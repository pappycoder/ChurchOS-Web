import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OfflineVault, indexedDbStorage } from "./vault";
import {
  assertLease,
  OfflineSync,
  queueMutation,
  recordMutation,
  visibleRecords,
} from "./engine";
import type { Snapshot, Workspace } from "./types";

const snapshot = (): Snapshot => ({
  profileId: "profile-1",
  churchId: "church-1",
  branchId: "branch-1",
  branchName: "Lekki",
  permissions: [
    "members:all:read",
    "members:new:create",
    "members:all:update",
    "forms:list:read",
  ],
  issuedAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 86400000).toISOString(),
  records: { member: [], visitor: [], form: [] },
});
const workspace = (): Workspace => ({ ...snapshot(), outbox: [], drafts: {} });
const passphrase = "correct horse battery staple";
let vault: OfflineVault;
beforeEach(async () => {
  const previous = await indexedDbStorage.read();
  await indexedDbStorage.compareAndSwap(previous?.revision, undefined);
  vault = new OfflineVault();
});

describe("encrypted offline vault", () => {
  it("requires a strong passphrase and does not overwrite an existing workspace", async () => {
    await expect(vault.enable("1234", workspace())).rejects.toThrow(
      "12 characters",
    );
    await vault.enable(passphrase, workspace());
    await expect(vault.enable(passphrase, workspace())).rejects.toThrow(
      "already exists",
    );
  });
  it("persists encrypted data across reload and accepts only the correct passphrase", async () => {
    const data = workspace();
    data.records.member = [
      { id: "member-1", updated_at: "v1", first_name: "PrivatePerson" },
    ];
    await vault.enable(passphrase, data);
    const stored = await indexedDbStorage.read();
    expect(JSON.stringify(stored)).not.toContain("PrivatePerson");
    expect(new TextDecoder().decode(stored!.ciphertext)).not.toContain(
      "PrivatePerson",
    );
    vault.lock();
    await expect(vault.read()).rejects.toThrow("Unlock");
    const reopened = new OfflineVault();
    await expect(reopened.unlock("wrong passphrase")).rejects.toThrow(
      "Unable to unlock",
    );
    expect(await reopened.unlock(passphrase)).toEqual(data);
  });
  it("does not unlock if logout interrupts preparation before the durable save", async () => {
    const cancelling = new OfflineVault({
      read: async () => {
        cancelling.lock();
        return undefined;
      },
      compareAndSwap: vi.fn(),
    });
    await expect(cancelling.enable(passphrase, workspace())).rejects.toThrow(
      "cancelled",
    );
    expect(cancelling.unlocked).toBe(false);
    expect(await indexedDbStorage.read()).toBeUndefined();
  });
  it("preserves a committed workspace but keeps it locked if logout races its commit", async () => {
    const cancelling = new OfflineVault({
      read: indexedDbStorage.read,
      compareAndSwap: async (revision, data) => {
        await indexedDbStorage.compareAndSwap(revision, data);
        cancelling.lock();
      },
    });
    const saved = workspace();
    await expect(cancelling.enable(passphrase, saved)).rejects.toThrow(
      "saved but locked",
    );
    expect(cancelling.unlocked).toBe(false);
    expect(await cancelling.exists()).toBe(true);
    expect(await cancelling.unlock(passphrase)).toEqual(saved);
  });
  it("detects modified ciphertext", async () => {
    await vault.enable(passphrase, workspace());
    const stored = (await indexedDbStorage.read())!;
    new Uint8Array(stored.ciphertext)[0] ^= 1;
    await indexedDbStorage.compareAndSwap(stored.revision, {
      ...stored,
      revision: stored.revision + 1,
    });
    vault.lock();
    await expect(vault.unlock(passphrase)).rejects.toThrow("Unable to unlock");
  });
  it("serializes concurrent edits without dropping any outbox entries", async () => {
    await vault.enable(passphrase, workspace());
    await Promise.all(
      [1, 2, 3].map((index) =>
        queueMutation(
          vault,
          recordMutation(
            "member",
            undefined,
            { firstName: `Member${index}`, lastName: "Test" },
            "branch-1",
          ),
        ),
      ),
    );
    expect((await vault.read()).outbox).toHaveLength(3);
  });
  it("fails a stale tab write rather than overwriting another tab", async () => {
    await vault.enable(passphrase, workspace());
    const original = (await indexedDbStorage.read())!;
    await indexedDbStorage.compareAndSwap(original.revision, {
      ...original,
      revision: 2,
    });
    await expect(
      indexedDbStorage.compareAndSwap(original.revision, original),
    ).rejects.toThrow("another tab");
    expect((await indexedDbStorage.read())!.revision).toBe(2);
  });
  it("keeps unsynced data when removal is requested", async () => {
    await vault.enable(passphrase, workspace());
    await queueMutation(
      vault,
      recordMutation(
        "member",
        undefined,
        { firstName: "Ada", lastName: "Obi" },
        "branch-1",
      ),
    );
    await expect(vault.remove()).rejects.toThrow("pending changes");
    expect(await vault.exists()).toBe(true);
  });
  it("rejects account or branch changes in an edit", async () => {
    await vault.enable(passphrase, workspace());
    await expect(
      vault.update((data) => ({ ...data, profileId: "other" })),
    ).rejects.toThrow("scope");
    await expect(
      vault.update((data) => ({ ...data, branchId: "other" })),
    ).rejects.toThrow("scope");
  });
  it("reports storage failure and retains the previous durable state", async () => {
    await vault.enable(passphrase, workspace());
    const broken = new OfflineVault({
      read: indexedDbStorage.read,
      compareAndSwap: vi
        .fn()
        .mockRejectedValue(new Error("QuotaExceededError")),
    });
    await broken.unlock(passphrase);
    await expect(
      queueMutation(
        broken,
        recordMutation("member", undefined, {}, "branch-1"),
      ),
    ).rejects.toThrow("QuotaExceededError");
    expect((await vault.read()).outbox).toEqual([]);
  });
  it("keeps saved form drafts when removal is requested", async () => {
    await vault.enable(passphrase, {
      ...workspace(),
      drafts: { form1: { name: "Ada" } },
    });
    await expect(vault.remove()).rejects.toThrow("drafts");
    expect((await vault.read()).drafts.form1.name).toBe("Ada");
  });
});

describe("offline queue and sync", () => {
  it("enforces permission, branch and lease before saving", async () => {
    await vault.enable(passphrase, workspace());
    await expect(
      queueMutation(
        vault,
        recordMutation("visitor", undefined, {}, "branch-1"),
      ),
    ).rejects.toThrow("permission");
    await expect(
      queueMutation(vault, recordMutation("member", undefined, {}, "other")),
    ).rejects.toThrow("branch");
    expect(() =>
      assertLease({ ...workspace(), expiresAt: new Date(0).toISOString() }),
    ).toThrow("expired");
    expect(() =>
      assertLease({
        ...workspace(),
        issuedAt: new Date(Date.now() + 86400000).toISOString(),
      }),
    ).toThrow("expired");
    expect(() =>
      assertLease({ ...workspace(), expiresAt: "not-a-date" }),
    ).toThrow("expired");
  });
  it("overlays pending edits onto server snapshots without changing the original", async () => {
    const data = workspace();
    data.records.member = [{ id: "a", first_name: "Old", updated_at: "v1" }];
    data.outbox = [
      {
        ...recordMutation(
          "member",
          data.records.member[0],
          { firstName: "New" },
          data.branchId,
        ),
        status: "pending",
      },
    ];
    expect(visibleRecords(data, "member")[0].first_name).toBe("New");
    expect(data.records.member[0].first_name).toBe("Old");
  });
  async function setup() {
    await vault.enable(passphrase, workspace());
    await queueMutation(
      vault,
      recordMutation(
        "member",
        undefined,
        { firstName: "Ada", lastName: "Obi" },
        "branch-1",
      ),
    );
    return {
      identity: vi
        .fn()
        .mockResolvedValue({ profileId: "profile-1", churchId: "church-1" }),
      push: vi.fn().mockImplementation(async (changes) =>
        changes.map((item: { mutationId: string }) => ({
          mutationId: item.mutationId,
          status: "accepted",
          version: "v2",
        })),
      ),
      snapshot: vi.fn().mockResolvedValue(snapshot()),
    };
  }
  it("never sends queued data as a different user", async () => {
    const transport = await setup();
    transport.identity.mockResolvedValue({
      profileId: "other",
      churchId: "church-1",
    });
    await expect(new OfflineSync(vault, transport).run()).rejects.toThrow(
      "account",
    );
    expect(transport.push).not.toHaveBeenCalled();
    expect((await vault.read()).outbox).toHaveLength(1);
  });
  it("retains stable mutation IDs after a dropped connection", async () => {
    const transport = await setup();
    const id = (await vault.read()).outbox[0].mutationId;
    transport.push.mockRejectedValue(new Error("network disconnected"));
    await expect(new OfflineSync(vault, transport).run()).rejects.toThrow(
      "network",
    );
    expect((await vault.read()).outbox[0].mutationId).toBe(id);
  });
  it("does not acknowledge an incomplete server response", async () => {
    const transport = await setup();
    transport.push.mockResolvedValue([]);
    await expect(new OfflineSync(vault, transport).run()).rejects.toThrow(
      "Incomplete",
    );
    expect((await vault.read()).outbox).toHaveLength(1);
  });
  it("retains conflicts and their local overlay while refreshing server data", async () => {
    const transport = await setup();
    transport.push.mockImplementation(async (changes) => [
      {
        mutationId: changes[0].mutationId,
        status: "conflict",
        message: "Changed online",
      },
    ]);
    const synced = await new OfflineSync(vault, transport).run();
    expect(synced.outbox[0].status).toBe("conflict");
    expect(visibleRecords(synced, "member")[0].first_name).toBe("Ada");
  });
  it("commits accepted contact data before dropping the outbox even if pull fails", async () => {
    const transport = await setup();
    transport.snapshot.mockRejectedValue(new Error("download failed"));
    await expect(new OfflineSync(vault, transport).run()).rejects.toThrow(
      "download",
    );
    const saved = await vault.read();
    expect(saved.outbox).toHaveLength(0);
    expect(saved.records.member[0].first_name).toBe("Ada");
  });
  it("deduplicates concurrent sync requests", async () => {
    const transport = await setup();
    const engine = new OfflineSync(vault, transport);
    await Promise.all([engine.run(), engine.run()]);
    expect(transport.push).toHaveBeenCalledTimes(1);
    expect(transport.identity).toHaveBeenCalledTimes(1);
  });
  it("binds every uploaded batch to the original account identity", async () => {
    const transport = await setup();
    await new OfflineSync(vault, transport).run();
    expect(transport.push.mock.calls[0][1]).toEqual({
      profileId: "profile-1",
      churchId: "church-1",
    });
  });
  it("keeps transient server failures pending with the same mutation ID", async () => {
    const transport = await setup();
    const before = (await vault.read()).outbox[0];
    transport.push.mockResolvedValue([
      { mutationId: before.mutationId, status: "retry" },
    ]);
    await expect(new OfflineSync(vault, transport).run()).rejects.toThrow(
      "could not sync",
    );
    expect((await vault.read()).outbox[0].mutationId).toBe(before.mutationId);
    expect((await vault.read()).outbox[0].status).toBe("pending");
  });
  it("rejects a snapshot belonging to another branch without losing pending data", async () => {
    const transport = await setup();
    transport.push.mockImplementation(async (changes) => [
      { mutationId: changes[0].mutationId, status: "conflict" },
    ]);
    transport.snapshot.mockResolvedValue({ ...snapshot(), branchId: "other" });
    await expect(new OfflineSync(vault, transport).run()).rejects.toThrow(
      "different",
    );
    expect((await vault.read()).branchId).toBe("branch-1");
  });
});
