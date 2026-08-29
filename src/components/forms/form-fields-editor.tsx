"use client";

import { Button } from "@/components/ui/button";
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
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { FIELD_TYPES, FIELD_TYPE_LABELS, type FormField, type FieldType } from "@/hooks/use-forms";

export interface FormFieldsEditorProps {
  fields: FormField[];
  onChange: (fields: FormField[]) => void;
  disabled?: boolean;
}

function blankField(): FormField {
  return {
    key: "",
    label: "",
    type: "text",
    required: false,
    options: [],
  };
}

export function FormFieldsEditor({ fields, onChange, disabled }: FormFieldsEditorProps) {
  const updateField = (index: number, patch: Partial<FormField>) => {
    onChange(fields.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  };

  const addField = () => {
    onChange([...fields, blankField()]);
  };

  const removeField = (index: number) => {
    onChange(fields.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {fields.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No fields yet. Add at least one field to collect responses.
        </p>
      )}

      {fields.map((field, index) => (
        <div
          key={index}
          className="rounded-md border p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <GripVertical className="h-4 w-4" />
              Field {index + 1}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={() => removeField(index)}
              disabled={disabled}
              aria-label={`Remove field ${index + 1}`}
              title="Remove field"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Label</Label>
              <Input
                value={field.label}
                placeholder="e.g. Full Name"
                onChange={(e) => {
                  const label = e.target.value;
                  const nextKey = field.key || makeKey(label);
                  updateField(index, { label, key: field.key ? field.key : nextKey });
                }}
                disabled={disabled}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Field Key</Label>
              <Input
                value={field.key}
                placeholder="e.g. full_name"
                onChange={(e) => updateField(index, { key: e.target.value })}
                disabled={disabled}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Type</Label>
              <Select
                value={field.type}
                onValueChange={(value) => updateField(index, { type: value as FieldType })}
                disabled={disabled}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {FIELD_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Required</Label>
              <div className="flex h-9 items-center">
                <Switch
                  checked={!!field.required}
                  onCheckedChange={(checked) => updateField(index, { required: checked })}
                  disabled={disabled}
                />
              </div>
            </div>
          </div>

          {(field.type === "dropdown" || field.type === "checkbox") && (
            <div className="space-y-1.5">
              <Label className="text-xs">
                Options (one per line)
              </Label>
              <textarea
                className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={(field.options ?? []).join("\n")}
                placeholder={"Option 1\nOption 2"}
                onChange={(e) =>
                  updateField(index, {
                    options: e.target.value
                      .split("\n")
                      .map((o) => o.trim())
                      .filter(Boolean),
                  })
                }
                disabled={disabled}
              />
            </div>
          )}
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addField}
        disabled={disabled}
      >
        <Plus className="mr-1 h-4 w-4" />
        Add Field
      </Button>
    </div>
  );
}

function makeKey(label: string): string {
  const slug = label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return slug || "";
}
