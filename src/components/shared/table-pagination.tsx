"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const PAGE_SIZE_OPTIONS = [10, 15, 25, 50];

interface TablePaginationProps {
  page: number;
  perPage: number;
  total: number;
  /** Plural noun for the count line, e.g. "members". */
  itemName?: string;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
}

export function TablePagination({
  page,
  perPage,
  total,
  itemName = "rows",
  onPageChange,
  onPerPageChange,
}: TablePaginationProps) {
  if (total <= 0) return null;

  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-4">
      <p className="text-sm text-muted-foreground">
        Showing {from}–{to} of {total} {itemName}
      </p>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            Rows per page
          </span>
          <Select
            value={String(perPage)}
            onValueChange={(v) => onPerPageChange(Number(v))}
          >
            <SelectTrigger className="h-8 w-[70px]" aria-label="Rows per page">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
