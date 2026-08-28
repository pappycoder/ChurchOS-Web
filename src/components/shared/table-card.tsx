"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TablePagination } from "@/components/shared/table-pagination";

interface TableCardProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Rendered on the right side of the header (buttons, links). */
  action?: React.ReactNode;
  /** Rendered above the table (search, filters). */
  toolbar?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  itemName?: string;
  /** When set, a TablePagination footer is rendered inside the card. */
  page?: number;
  /** Defaults to 15 when pagination is enabled. */
  perPage?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
}

/**
 * Standard list-page table grammar: a titled Card wrapping the table as an
 * inner `rounded-md border` card, with the pagination footer inside the card.
 * Mirrors the Assets register layout everywhere.
 */
export function TableCard({
  title,
  description,
  action,
  toolbar,
  children,
  className,
  itemName = "rows",
  page,
  perPage,
  total,
  onPageChange,
  onPerPageChange,
}: TableCardProps) {
  const paginated = typeof page === "number" && typeof onPageChange === "function";

  return (
    <Card className={className}>
      {(title || description || action) && (
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {title && <CardTitle>{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {action}
        </CardHeader>
      )}
      <CardContent className="space-y-4">
        {toolbar}
        <div className="rounded-md border overflow-x-auto">{children}</div>
        {paginated && (
          <TablePagination
            page={page}
            perPage={perPage ?? 15}
            total={total ?? 0}
            itemName={itemName}
            onPageChange={onPageChange}
            onPerPageChange={
              onPerPageChange ??
              (() => {
                /* no-op */
              })
            }
          />
        )}
      </CardContent>
    </Card>
  );
}