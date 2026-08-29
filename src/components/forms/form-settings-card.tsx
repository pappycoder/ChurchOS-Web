"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FORM_STATUSES,
  FORM_STATUS_LABELS,
  type FormStatus,
  type FormField,
} from "@/hooks/use-forms";

export interface FormSettingsValues {
  status?: FormStatus;
  isTemplate?: boolean;
  isPublic?: boolean;
  uniqueField?: string;
  submissionLimit?: number;
}

export interface FormSettingsCardProps {
  values: FormSettingsValues;
  onChange: (values: FormSettingsValues) => void;
  fields: FormField[];
  disabled?: boolean;
}

export function FormSettingsCard({
  values,
  onChange,
  fields,
  disabled,
}: FormSettingsCardProps) {
  const selectableFields = fields.filter((f) =>
    ["email", "phone", "text", "dropdown"].includes(f.type),
  );

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs">Status</Label>
        <Select
          value={values.status ?? "draft"}
          onValueChange={(value) => onChange({ ...values, status: value as FormStatus })}
          disabled={disabled}
        >
          <SelectTrigger className="w-full sm:max-w-[260px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FORM_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {FORM_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Published forms are open to submissions; closed forms reject new submissions.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Unique Field (dedupe)</Label>
          <Select
            value={values.uniqueField ?? "none"}
            onValueChange={(value) =>
              onChange({ ...values, uniqueField: value === "none" ? undefined : value })
            }
            disabled={disabled}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {selectableFields.map((f) => (
                <SelectItem key={f.key} value={f.key}>
                  {f.label || f.key}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            When set, public submissions with a duplicate value for this field are rejected.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Submission Limit (0 = unlimited)</Label>
          <Input
            type="number"
            min={0}
            value={values.submissionLimit ?? 0}
            onChange={(e) =>
              onChange({ ...values, submissionLimit: Math.max(0, Number(e.target.value) || 0) })
            }
            disabled={disabled}
          />
        </div>
      </div>

      <div className="space-y-3 border-t pt-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <Label className="text-xs">Reusable Template</Label>
            <p className="text-xs text-muted-foreground">
              Save this form as a template for cloning.
            </p>
          </div>
          <Switch
            checked={!!values.isTemplate}
            onCheckedChange={(checked) => onChange({ ...values, isTemplate: checked })}
            disabled={disabled}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div>
            <Label className="text-xs">Public Submissions</Label>
            <p className="text-xs text-muted-foreground">
              Allow anyone with the share link to submit without signing in.
            </p>
          </div>
          <Switch
            checked={!!values.isPublic}
            onCheckedChange={(checked) => onChange({ ...values, isPublic: checked })}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}
