import type {
  Ack,
  Mutation,
  OfflineRecord,
  PersonEntity,
  Snapshot,
  Workspace,
} from "./types";
import { OfflineVault } from "./vault";

export function assertLease(workspace: Workspace, now = Date.now()) {
  if (!workspace.permissions.includes("offline:read"))
    throw new Error(
      "Offline workspace access is not permitted. Connect to refresh your permissions.",
    );
  if (
    !Number.isFinite(Date.parse(workspace.issuedAt)) ||
    !Number.isFinite(Date.parse(workspace.expiresAt)) ||
    now < Date.parse(workspace.issuedAt) - 300000 ||
    now >= Date.parse(workspace.expiresAt)
  )
    throw new Error("Offline access expired. Connect and sync to renew it.");
}
export function visibleRecords(workspace: Workspace, entity: PersonEntity) {
  const rows = new Map(
    workspace.records[entity].map((row) => [row.id, { ...row }]),
  );
  for (const change of workspace.outbox.filter(
    (item) => item.entity === entity,
  )) {
    const previous = rows.get(change.entityId) ?? {
      id: change.entityId,
      updated_at: change.baseVersion ?? "",
      branch_id: change.branchId,
    };
    const fields = Object.fromEntries(
      Object.entries(change.data).map(([key, value]) => [
        key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`),
        value,
      ]),
    );
    rows.set(change.entityId, { ...previous, ...fields });
  }
  return [...rows.values()];
}
export async function queueMutation(vault: OfflineVault, mutation: Mutation) {
  return vault.update((workspace) => {
    assertLease(workspace);
    if (mutation.branchId !== workspace.branchId)
      throw new Error("Choose the prepared branch.");
    const permission =
      mutation.entity === "submission"
        ? "forms:list:read"
        : `${mutation.entity === "member" ? "members" : "visitors"}:${mutation.action === "create" ? "new:create" : mutation.entity === "member" ? "all:update" : "list:update"}`;
    if (!workspace.permissions.includes(permission))
      throw new Error("You do not have permission to save this change.");
    if (
      workspace.outbox.some(
        (item) =>
          item.entity === mutation.entity &&
          item.entityId === mutation.entityId,
      )
    )
      throw new Error(
        "Sync or review the pending change for this record before editing again.",
      );
    if (
      mutation.entity === "submission" &&
      workspace.outbox.some(
        (item) =>
          item.entity === "submission" && item.formId === mutation.formId,
      )
    )
      throw new Error(
        "This form already has a queued submission. Sync or review it first.",
      );
    if (workspace.outbox.length >= 500)
      throw new Error("Sync pending changes before adding more.");
    return {
      ...workspace,
      outbox: [...workspace.outbox, { ...mutation, status: "pending" }],
    };
  });
}

export interface SyncTransport {
  identity(): Promise<{ profileId: string; churchId: string }>;
  push(
    mutations: Mutation[],
    owner: { profileId: string; churchId: string },
  ): Promise<Ack[]>;
  snapshot(branchId: string): Promise<Snapshot>;
}

/** Events trigger this single flight. No timer or idle polling. */
export class OfflineSync {
  private flight?: Promise<Workspace>;
  constructor(
    private readonly vault: OfflineVault,
    private readonly transport: SyncTransport,
  ) {}
  run(): Promise<Workspace> {
    if (this.flight) return this.flight;
    this.flight = this.perform().finally(() => {
      this.flight = undefined;
    });
    return this.flight;
  }
  private async perform() {
    const start = await this.vault.read();
    const identity = await this.transport.identity();
    if (
      identity.profileId !== start.profileId ||
      identity.churchId !== start.churchId
    )
      throw new Error(
        "Sign in with the account that prepared this workspace before syncing.",
      );
    // Use bounded sequential batches; durable individual acknowledgements survive interrupted requests.
    const pending = start.outbox.filter((item) => item.status === "pending");
    for (let index = 0; index < pending.length; index += 25) {
      const batch = pending.slice(index, index + 25);
      const ids = new Set(batch.map((item) => item.mutationId));
      const acknowledgements = await this.transport.push(
        batch.map((item) => ({
          mutationId: item.mutationId,
          entityId: item.entityId,
          entity: item.entity,
          action: item.action,
          branchId: item.branchId,
          baseVersion: item.baseVersion,
          formId: item.formId,
          data: item.data,
        })),
        identity,
      );
      if (
        acknowledgements.length !== batch.length ||
        new Set(acknowledgements.map((ack) => ack.mutationId)).size !==
          batch.length ||
        acknowledgements.some((ack) => !ids.has(ack.mutationId))
      )
        throw new Error(
          "Incomplete sync acknowledgement. Pending data was retained.",
        );
      await this.vault.update((current) => {
        const records = structuredClone(current.records);
        const outbox = current.outbox.flatMap((item) => {
          const ack = acknowledgements.find(
            (result) => result.mutationId === item.mutationId,
          );
          if (!ack) return [item];
          if (ack.status !== "accepted")
            return [
              {
                ...item,
                status:
                  ack.status === "retry" ? ("pending" as const) : ack.status,
                message: ack.message,
              },
            ];
          // Apply acceptance before removing its outbox entry so failed downloads retain the accepted data.
          if (item.entity !== "submission") {
            const row = visibleRecords(
              { ...current, outbox: [item] },
              item.entity,
            ).find((record) => record.id === item.entityId)!;
            row.updated_at = ack.version ?? row.updated_at;
            records[item.entity] = records[item.entity]
              .filter((record) => record.id !== item.entityId)
              .concat(row);
          }
          return [];
        });
        return { ...current, records, outbox };
      });
      if (acknowledgements.some((ack) => ack.status === "retry"))
        throw new Error(
          "Some changes could not sync. Your pending data is safe; try again.",
        );
    }
    const snapshot = await this.transport.snapshot(start.branchId);
    if (
      snapshot.profileId !== start.profileId ||
      snapshot.churchId !== start.churchId ||
      snapshot.branchId !== start.branchId
    )
      throw new Error("Server returned a different account or branch.");
    // New server data and lease commit atomically. Local outbox overlays never disappear.
    return this.vault.update((current) => ({
      ...current,
      ...snapshot,
      outbox: current.outbox,
      drafts: current.drafts,
      lastSyncedAt: new Date().toISOString(),
    }));
  }
}

export function recordMutation(
  entity: PersonEntity,
  row: OfflineRecord | undefined,
  data: Record<string, unknown>,
  branchId: string,
): Mutation {
  return {
    mutationId: crypto.randomUUID(),
    entity,
    entityId: row?.id ?? crypto.randomUUID(),
    action: row ? "update" : "create",
    baseVersion: row?.updated_at,
    branchId,
    data,
  };
}
