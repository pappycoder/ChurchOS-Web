"use client";

import { Columns3, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import type { TableColumn } from "@/contexts/table-columns-context";

export function ColumnSelector({ columns, hidden, onChange }: {
  columns: TableColumn[]; hidden: string[]; onChange: (hidden: string[]) => void;
}) {
  const choices = columns.filter((column) => column.hideable);
  const visibleCount = choices.filter((column) => !hidden.includes(column.id)).length;
  if (!choices.length) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" aria-label="Choose visible columns">
          <Columns3 className="h-4 w-4" />
          Columns <span className="text-muted-foreground text-xs">{visibleCount}/{choices.length}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>Visible columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-72 overflow-y-auto">
          {choices.map((column) => {
            const checked = !hidden.includes(column.id);
            const remainingData = choices.filter((choice) => choice.label.toLowerCase() !== "actions" && !hidden.includes(choice.id)).length;
            return <DropdownMenuCheckboxItem key={column.id} checked={checked}
              disabled={checked && (visibleCount === 1 || (column.label.toLowerCase() !== "actions" && remainingData === 1))}
              onSelect={(event) => event.preventDefault()}
              onCheckedChange={(value) => onChange(value ? hidden.filter((id) => id !== column.id) : [...hidden, column.id])}>
              {column.label}
            </DropdownMenuCheckboxItem>;
          })}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={!hidden.length} onSelect={() => onChange([])}>
          <RotateCcw className="h-4 w-4" /> Show all columns
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
