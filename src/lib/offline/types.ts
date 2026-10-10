export type PersonEntity = "member" | "visitor";
export interface OfflineRecord {
  id: string;
  branch_id?: string | null;
  updated_at: string;
  first_name?: string;
  last_name?: string;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  title?: string;
  fields?: OfflineField[];
  [key: string]: unknown;
}
export interface OfflineField {
  key: string;
  label: string;
  type: string;
  required?: boolean;
  options?: string[];
}
export interface Snapshot {
  profileId: string;
  churchId: string;
  branchId: string;
  branchName: string;
  permissions: string[];
  issuedAt: string;
  expiresAt: string;
  records: {
    member: OfflineRecord[];
    visitor: OfflineRecord[];
    form: OfflineRecord[];
  };
}
export interface Mutation {
  mutationId: string;
  entityId: string;
  entity: PersonEntity | "submission";
  action: "create" | "update";
  baseVersion?: string;
  branchId: string;
  formId?: string;
  data: Record<string, unknown>;
}
export interface PendingMutation extends Mutation {
  status: "pending" | "conflict" | "rejected";
  message?: string;
}
export interface Workspace extends Snapshot {
  outbox: PendingMutation[];
  drafts: Record<string, Record<string, unknown>>;
  lastSyncedAt?: string;
}
export interface Ack {
  mutationId: string;
  status: "accepted" | "conflict" | "rejected" | "retry";
  version?: string;
  message?: string;
}
