"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle } from "lucide-react";
import type { FormField } from "@/hooks/use-forms";

export interface FormFieldsRendererProps {
  fields: FormField[];
  disabled?: boolean;
  onChange: (data: Record<string, unknown>) => void;
}

function initialData(fields: FormField[]): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const f of fields) {
    data[f.key] = f.type === "checkbox" ? [] : "";
  }
  return data;
}

export function FormFieldsRenderer({
  fields,
  disabled,
  onChange,
}: FormFieldsRendererProps) {
  const [data, setData] = useState<Record<string, unknown>>(() => initialData(fields));

  useEffect(() => {
    setData(initialData(fields));
  }, [fields]);

  const update = (key: string, value: unknown) => {
    const next = { ...data, [key]: value };
    setData(next);
    onChange(next);
  };

  return (
    <div className="space-y-4">
      {fields.length === 0 && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4" />
          This form has no fields to complete.
        </p>
      )}

      {fields.map((field) => (
        <div key={field.key} className="space-y-1.5">
          <Label className="text-sm">
            {field.label}
            {field.required && <span className="ml-1 text-destructive">*</span>}
          </Label>

          {field.type === "textarea" && (
            <Textarea
              value={String(data[field.key] ?? "")}
              onChange={(e) => update(field.key, e.target.value)}
              disabled={disabled}
            />
          )}

          {field.type === "number" && (
            <Input
              type="number"
              value={String(data[field.key] ?? "")}
              onChange={(e) => update(field.key, e.target.value)}
              disabled={disabled}
            />
          )}

          {field.type === "date" && (
            <Input
              type="date"
              value={String(data[field.key] ?? "")}
              onChange={(e) => update(field.key, e.target.value)}
              disabled={disabled}
            />
          )}

          {field.type === "dropdown" && (
            <Select
              value={String(data[field.key] ?? "")}
              onValueChange={(value) => update(field.key, value)}
              disabled={disabled}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {(field.options ?? []).map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {field.type === "checkbox" && (
            <div className="grid gap-2">
              {(field.options ?? []).map((opt) => {
                const selected = Array.isArray(data[field.key]) ? data[field.key] as string[] : [];
                return (
                  <label key={opt} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={selected.includes(opt)}
                      onCheckedChange={(checked) =>
                        update(
                          field.key,
                          checked ? [...selected, opt] : selected.filter((o) => o !== opt),
                        )
                      }
                      disabled={disabled}
                    />
                    {opt}
                  </label>
                );
              })}
            </div>
          )}

          {(field.type === "text" || field.type === "email" || field.type === "phone") && (
            <Input
              type={field.type === "email" ? "email" : field.type === "phone" ? "tel" : "text"}
              value={String(data[field.key] ?? "")}
              onChange={(e) => update(field.key, e.target.value)}
              disabled={disabled}
            />
          )}
        </div>
      ))}
    </div>
  );
}
