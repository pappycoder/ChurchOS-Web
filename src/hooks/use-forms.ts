"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

// ─── Types ───────────────────────────────────────────────

export const FORM_STATUSES = ["draft", "published", "closed"] as const;
export type FormStatus = (typeof FORM_STATUSES)[number];

export const SUBMISSION_STATUSES = ["pending", "approved", "rejected"] as const;
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

export const FIELD_TYPES = [
  "text",
  "textarea",
  "number",
  "date",
  "dropdown",
  "checkbox",
  "email",
  "phone",
] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: "Text",
  textarea: "Text Area",
  number: "Number",
  date: "Date",
  dropdown: "Dropdown",
  checkbox: "Checkbox",
  email: "Email",
  phone: "Phone",
};

export const FORM_STATUS_LABELS: Record<FormStatus, string> = {
  draft: "Draft",
  published: "Published",
  closed: "Closed",
};

export const FORM_STATUS_TEXT: Record<FormStatus, string> = {
  draft: "text-yellow-600",
  published: "text-emerald-600",
  closed: "text-slate-500",
};

export const SUBMISSION_STATUS_LABELS: Record<SubmissionStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

export const SUBMISSION_STATUS_TEXT: Record<SubmissionStatus, string> = {
  pending: "text-yellow-600",
  approved: "text-emerald-600",
  rejected: "text-red-600",
};

export interface FormFieldValidation {
  min?: number;
  max?: number;
  pattern?: string;
}

export interface FormField {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  validation?: FormFieldValidation;
}

export interface Form {
  id: string;
  churchId: string;
  title: string;
  description?: string;
  fields: FormField[];
  status: FormStatus;
  isTemplate: boolean;
  isPublic: boolean;
  publicToken?: string;
  uniqueField?: string;
  submissionLimit: number;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubmissionAttachment {
  assetId: string;
  url: string;
  filename: string;
  mimeType: string;
}

export interface FormSubmission {
  id: string;
  formId: string;
  churchId: string;
  data: Record<string, unknown>;
  submittedBy?: string;
  status: SubmissionStatus;
  approvedById?: string;
  approvedAt?: string;
  rejectionReason?: string;
  attachments: SubmissionAttachment[];
  createdAt: string;
}

export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginatedMeta;
}

export interface ListFormsParams {
  status?: FormStatus;
  isTemplate?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  archived?: boolean;
}

export interface ListSubmissionsParams {
  status?: SubmissionStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateFormInput {
  title: string;
  description?: string;
  fields: FormField[];
  status?: FormStatus;
  isTemplate?: boolean;
  isPublic?: boolean;
  uniqueField?: string;
  submissionLimit?: number;
}

export type UpdateFormInput = Partial<CreateFormInput>;

export interface CreateSubmissionInput {
  data: Record<string, unknown>;
  attachmentAssetIds?: string[];
}

export interface UpdateSubmissionStatusInput {
  status: SubmissionStatus;
  rejectionReason?: string;
}

function buildQuery(params: object): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      if (Array.isArray(value)) {
        value.forEach((item) => searchParams.append(key, String(item)));
      } else {
        searchParams.set(key, String(value));
      }
    }
  }
  const qs = searchParams.toString();
  return qs ? `?${qs}` : "";
}

function invalidateFormCaches(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["forms-list"] });
  qc.invalidateQueries({ queryKey: ["form"] });
  qc.invalidateQueries({ queryKey: ["form-submissions"] });
}

// ─── Queries ─────────────────────────────────────────────

export function useFormsList(params: ListFormsParams = {}) {
  return useQuery({
    queryKey: ["forms-list", params],
    queryFn: () =>
      api.get<PaginatedResponse<Form>>(`/forms${buildQuery(params)}`),
  });
}

export function useForm(formId: string | undefined) {
  return useQuery({
    queryKey: ["form", formId],
    queryFn: () => api.get<Form>(`/forms/${formId}`),
    enabled: !!formId,
  });
}

export function useFormSubmissions(formId: string | undefined, params: ListSubmissionsParams = {}) {
  return useQuery({
    queryKey: ["form-submissions", formId, params],
    queryFn: () =>
      api.get<PaginatedResponse<FormSubmission>>(
        `/forms/${formId}/submissions${buildQuery(params)}`,
      ),
    enabled: !!formId,
  });
}

export function useFormSubmission(
  formId: string | undefined,
  submissionId: string | undefined,
) {
  return useQuery({
    queryKey: ["form-submission", formId, submissionId],
    queryFn: () => api.get<FormSubmission>(`/forms/${formId}/submissions/${submissionId}`),
    enabled: !!formId && !!submissionId,
  });
}

// ─── Mutations ───────────────────────────────────────────

export function useCreateForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateFormInput) => api.post<Form>("/forms", input),
    onSuccess: () => invalidateFormCaches(qc),
  });
}

export function useUpdateForm(formId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateFormInput) => api.patch<Form>(`/forms/${formId}`, input),
    onSuccess: () => invalidateFormCaches(qc),
  });
}

export function useDeleteForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formId: string) => api.delete<void>(`/forms/${formId}`),
    onSuccess: () => invalidateFormCaches(qc),
  });
}

export function useArchiveForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formId: string) => api.post<Form>(`/forms/${formId}/archive`, {}),
    onSuccess: () => invalidateFormCaches(qc),
  });
}

export function useRestoreForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formId: string) => api.post<Form>(`/forms/${formId}/restore`, {}),
    onSuccess: () => invalidateFormCaches(qc),
  });
}

export function useCloneForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formId: string) => api.post<Form>(`/forms/${formId}/clone`, {}),
    onSuccess: () => invalidateFormCaches(qc),
  });
}

export function useRegenerateLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formId: string) => api.post<Form>(`/forms/${formId}/regenerate-link`, {}),
    onSuccess: () => invalidateFormCaches(qc),
  });
}

export function useSubmitForm(formId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSubmissionInput) =>
      api.post<FormSubmission>(`/forms/${formId}/submit`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["form-submissions"] });
    },
  });
}

export function useSubmitFormPublic(publicToken: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post<FormSubmission>(
        `/forms/public/${publicToken}/submit`,
        { data },
        { skipAuth: true },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["form-submissions"] });
    },
  });
}

export function useUpdateSubmissionStatus(formId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      submissionId,
      input,
    }: {
      submissionId: string;
      input: UpdateSubmissionStatusInput;
    }) =>
      api.patch<FormSubmission>(
        `/forms/${formId}/submissions/${submissionId}/status`,
        input,
      ),
    onSuccess: () => invalidateFormCaches(qc),
  });
}

// ─── Helpers ─────────────────────────────────────────────

export function makeFieldKey(label: string): string {
  const slug = label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return slug || `field_${Date.now()}`;
}
