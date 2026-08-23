"use client";

/**
 * @file Shared building blocks for the settings area, mirroring the SmartHR
 * business/security-settings grammar: bordered sections with h6-style
 * headings and horizontal label-left / input-right field rows.
 */

import * as React from "react";
import type { Control, FieldValues, Path } from "react-hook-form";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

/**
 * Bordered section inside the main settings card, matching the SmartHR
 * "border-bottom mb-3" grouping. Carries `data-settings-section` so the
 * left-nav scrollspy can track it.
 */
export function SettingsSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      data-settings-section=""
      className="scroll-mt-28 border-b border-border pb-6 [&:not(:first-child)]:pt-6"
    >
      <h3 className="mb-4 text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
}

/** Horizontal SmartHR-style row: fixed-width left label, fluid control. */
export function FieldRow({
  label,
  htmlFor,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid items-start gap-1.5 md:grid-cols-[150px_1fr] md:items-center md:gap-3 [&+&]:mt-3",
        className,
      )}
    >
      <Label htmlFor={htmlFor} className="md:leading-9">
        {label}
      </Label>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/** Label-left / input-right RHF field using the shared row grammar. */
export function InfoField<T extends FieldValues>({
  label,
  name,
  control,
  placeholder,
  type = "text",
  disabled,
}: {
  label: string;
  name: Path<T>;
  control: Control<T>;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="grid items-start gap-1.5 md:grid-cols-[150px_1fr] md:gap-3 [&+&]:mt-3">
          <FormLabel className="md:pt-2">{label}</FormLabel>
          <div className="min-w-0">
            <FormControl>
              <Input type={type} placeholder={placeholder} disabled={disabled} {...field} />
            </FormControl>
            <FormMessage />
          </div>
        </FormItem>
      )}
    />
  );
}
