"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormFieldsEditor } from "./form-fields-editor";
import { FormSettingsCard } from "./form-settings-card";
import {
  type CreateFormInput,
  type Form as FormType,
  FIELD_TYPES,
  type FormField as FormFieldType,
} from "@/hooks/use-forms";

const fieldSchema = z.object({
  key: z.string().min(1, "Field key is required"),
  label: z.string().min(1, "Label is required"),
  type: z.enum(FIELD_TYPES),
  required: z.boolean().optional(),
  options: z.array(z.string()).optional(),
});

const formSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(200),
    description: z.string().max(2000).optional(),
    fields: z.array(fieldSchema).min(1, "Add at least one field"),
    status: z.enum(["draft", "published", "closed"]).optional(),
    isTemplate: z.boolean().optional(),
    isPublic: z.boolean().optional(),
    uniqueField: z.string().optional(),
    submissionLimit: z.number().min(0).optional(),
  })
  .superRefine((data, ctx) => {
    const keys = new Set<string>();
    for (const f of data.fields) {
      if (keys.has(f.key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["fields"],
          message: `Duplicate field key "${f.key}"`,
        });
      }
      keys.add(f.key);
    }
    for (const f of data.fields) {
      if ((f.type === "dropdown" || f.type === "checkbox") && (!f.options || f.options.length === 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["fields"],
          message: `"${f.label}" needs at least one option`,
        });
      }
    }
  });

type FormValues = z.infer<typeof formSchema>;

export interface FormFormProps {
  form?: FormType;
  onSubmit: (input: CreateFormInput) => Promise<void>;
  submitLabel: string;
}

const EMPTY_VALUES: FormValues = {
  title: "",
  description: "",
  fields: [],
  status: "draft",
  isTemplate: false,
  isPublic: false,
  uniqueField: undefined,
  submissionLimit: 0,
};

export function FormForm({ form, onSubmit, submitLabel }: FormFormProps) {
  const [saving, setSaving] = useState(false);
  const [builderFields, setBuilderFields] = useState<FormFieldType[]>([]);

  const formControl = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: EMPTY_VALUES,
  });

  useEffect(() => {
    if (form) {
      formControl.reset({
        title: form.title,
        description: form.description ?? "",
        fields: form.fields,
        status: form.status,
        isTemplate: form.isTemplate,
        isPublic: form.isPublic,
        uniqueField: form.uniqueField,
        submissionLimit: form.submissionLimit ?? 0,
      });
      setBuilderFields(form.fields);
    }
  }, [form, formControl]);

  const handleFormFieldsChange = (fields: FormFieldType[]) => {
    setBuilderFields(fields);
    formControl.setValue("fields", fields, { shouldDirty: true });
  };

  const handleSettingsChange = (values: {
    status?: FormValues["status"];
    isTemplate?: boolean;
    isPublic?: boolean;
    uniqueField?: string;
    submissionLimit?: number;
  }) => {
    formControl.setValue("status", values.status ?? "draft");
    formControl.setValue("isTemplate", values.isTemplate ?? false);
    formControl.setValue("isPublic", values.isPublic ?? false);
    formControl.setValue("uniqueField", values.uniqueField);
    formControl.setValue("submissionLimit", values.submissionLimit ?? 0);
  };

  const handleSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      await onSubmit({
        title: values.title,
        description: values.description?.trim() || undefined,
        fields: values.fields,
        status: values.status ?? "draft",
        isTemplate: values.isTemplate ?? false,
        isPublic: values.isPublic ?? false,
        uniqueField: values.uniqueField || undefined,
        submissionLimit: values.submissionLimit ?? 0,
      });
    } finally {
      setSaving(false);
    }
  };

  const settingsValues = {
    status: formControl.watch("status") as FormValues["status"],
    isTemplate: formControl.watch("isTemplate"),
    isPublic: formControl.watch("isPublic"),
    uniqueField: formControl.watch("uniqueField"),
    submissionLimit: formControl.watch("submissionLimit"),
  };

  return (
    <Form {...formControl}>
      <form onSubmit={formControl.handleSubmit(handleSubmit)} className="space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Form Details</CardTitle>
            <CardDescription>Name and describe this form.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={formControl.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Membership Application" {...field} disabled={saving} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={formControl.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What is this form for?"
                      {...field}
                      disabled={saving}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Fields</CardTitle>
            <CardDescription>Define what you want to collect.</CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={formControl.control}
              name="fields"
              render={() => (
                <FormItem>
                  <FormControl>
                    <FormFieldsEditor
                      fields={builderFields}
                      onChange={handleFormFieldsChange}
                      disabled={saving}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Settings</CardTitle>
            <CardDescription>
              Control publishing, public sharing, and duplicate-submission protection.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Controller
              control={formControl.control}
              name="status"
              render={() => (
                <FormSettingsCard
                  values={settingsValues}
                  onChange={handleSettingsChange}
                  fields={builderFields}
                  disabled={saving}
                />
              )}
            />
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
