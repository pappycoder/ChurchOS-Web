"use client";

import * as React from "react";
import type { ExportColumn } from "@/lib/export-utils";

export interface TableColumn {
  id: string;
  label: string;
  hideable: boolean;
  exportKeys?: string[];
}
interface ColumnState {
  columns: TableColumn[];
  hidden: string[];
}
interface ColumnContextValue {
  tables: Record<string, ColumnState>;
  register: (id: string, columns: TableColumn[]) => void;
  setHidden: (id: string, hidden: string[]) => void;
}
const ColumnContext = React.createContext<ColumnContextValue | null>(null);

export function TableColumnsProvider({ children }: { children: React.ReactNode }) {
  const [tables, setTables] = React.useState<Record<string, ColumnState>>({});
  const register = React.useCallback((id: string, columns: TableColumn[]) => {
    setTables((previous) => {
      if (JSON.stringify(previous[id]?.columns) === JSON.stringify(columns)) return previous;
      return { ...previous, [id]: { columns, hidden: previous[id]?.hidden ?? [] } };
    });
  }, []);
  const setHidden = React.useCallback((id: string, hidden: string[]) => {
    setTables((previous) => previous[id] ? { ...previous, [id]: { ...previous[id], hidden } } : previous);
  }, []);
  const value = React.useMemo(() => ({ tables, register, setHidden }), [tables, register, setHidden]);
  return <ColumnContext.Provider value={value}>{children}</ColumnContext.Provider>;
}

export function useTableColumns(id: string, columns?: TableColumn[]) {
  const context = React.useContext(ColumnContext);
  const [localHidden, setLocalHidden] = React.useState<string[]>([]);
  const signature = JSON.stringify(columns);
  const register = context?.register;
  React.useEffect(() => {
    if (register && signature) register(id, JSON.parse(signature));
  }, [id, signature, register]);
  return {
    columns: columns ?? context?.tables[id]?.columns ?? [],
    hidden: context?.tables[id]?.hidden ?? localHidden,
    setHidden: (hidden: string[]) => context ? context.setHidden(id, hidden) : setLocalHidden(hidden),
  };
}

/** A screen column may represent several export fields, e.g. amount + currency. */
export function selectExportColumns(columns: ExportColumn[], tableColumns: TableColumn[], hidden: string[]): ExportColumn[] {
  const normalize = (label: string) => label.toLowerCase().replace(/[^a-z0-9]/g, "");
  const visible = tableColumns.filter((column) => !hidden.includes(column.id));
  const keys = new Set(visible.flatMap((column) => column.exportKeys ?? []));
  return columns.filter((column) => keys.has(column.key) || visible.some((tableColumn) =>
    tableColumn.exportKeys === undefined && normalize(tableColumn.label) === normalize(column.label),
  ));
}

export function useVisibleExportColumns(tableId: string | undefined, columns: ExportColumn[]) {
  const context = React.useContext(ColumnContext);
  const state = tableId ? context?.tables[tableId] : undefined;
  return state ? selectExportColumns(columns, state.columns, state.hidden) : columns;
}
