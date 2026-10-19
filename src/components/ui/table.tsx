"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { TableExportScope } from "@/contexts/table-export-scope";
import { VisibleDataExport } from "@/components/shared/visible-data-export";
import * as React from "react";

import { TableColumnActions, TableViewControls } from "@/components/shared/table-view-controls";
import { ColumnSelector } from "@/components/shared/column-selector";
import { useTableColumns, type TableColumn } from "@/contexts/table-columns-context";

import { cn } from "@/lib/utils";
import { useTableLayout } from "@/hooks/use-table-layout";

const RowSelection = React.createContext<{
  enabled: boolean;
  selected: string[];
  visible: string[];
  setVisible: (ids: string[]) => void;
  toggle: (id: string) => void;
  toggleAll: () => void;
} | null>(null);
const RowSection = React.createContext<"head" | "body" | "footer">("body");
const TableVisibility = React.createContext<{ columns: TableColumn[]; hidden: string[] } | null>(
  null,
);
const CellVisibility = React.createContext<{ hidden: boolean; colSpan?: number } | null>(null);

type HeadProps = React.ComponentProps<"th"> & {
  valueType?: "text" | "number" | "currency";
  exportKeys?: string[];
  columnLabel?: string;
  hideable?: boolean;
};

function flatten(nodes: React.ReactNode): React.ReactNode[] {
  return React.Children.toArray(nodes).flatMap((node) =>
    React.isValidElement<{ children?: React.ReactNode }>(node) && node.type === React.Fragment
      ? flatten(node.props.children)
      : [node],
  );
}
function textOf(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  return React.isValidElement<{ children?: React.ReactNode }>(node)
    ? React.Children.toArray(node.props.children).map(textOf).join(" ").trim()
    : "";
}
function headerColumns(children: React.ReactNode): TableColumn[] {
  const header = flatten(children).find(
    (node) => React.isValidElement(node) && node.type === TableHeader,
  );
  if (!React.isValidElement<{ children?: React.ReactNode }>(header)) return [];
  const heads: React.ReactElement<HeadProps>[] = [];
  const visit = (nodes: React.ReactNode) =>
    flatten(nodes).forEach((node) => {
      if (!React.isValidElement<HeadProps>(node)) return;
      if (node.type === TableHead) heads.push(node);
      else visit(node.props.children);
    });
  visit(header.props.children);
  const occurrences = new Map<string, number>();
  let identifyingColumns = 0;
  return heads.map((head, index) => {
    const label = head.props.columnLabel ?? textOf(head.props.children);
    const identifier =
      !!label && !/^(actions?|options?|manage)$/i.test(label) && identifyingColumns++ < 2;
    const occurrence = occurrences.get(label) ?? 0;
    occurrences.set(label, occurrence + 1);
    return {
      id: label ? `${label}:${occurrence}` : `selection:${index}`,
      label,
      hideable: identifier ? false : (head.props.hideable ?? !!label),
      exportKeys: head.props.exportKeys,
    };
  });
}

function Table({
  className,
  children,
  tableId,
  exportable = false,
  selectable,
  ...props
}: React.ComponentProps<"table"> & {
  tableId?: string;
  selectable?: boolean;
  /** Opt in only for important record collections without a dedicated Export menu. */ exportable?: boolean;
}) {
  const exportRoot = React.useRef<HTMLDivElement>(null);
  useTableLayout(exportRoot);
  const [compactRows, setCompactRows] = React.useState(false);
  const [compactColumns, setCompactColumns] = React.useState(false);
  const [widths, setWidths] = React.useState<Record<string, "compact" | "expanded">>({});
  const generatedId = React.useId();
  const inheritedExport = React.useContext(TableExportScope);
  const sourceColumns = headerColumns(children);
  const supportsSelection =
    (selectable ?? (exportable || inheritedExport)) &&
    sourceColumns.length > 0 &&
    !!sourceColumns[0].label;
  const columns = supportsSelection
    ? [{ id: "row-selection", label: "", hideable: false }, ...sourceColumns]
    : sourceColumns;
  const state = useTableColumns(tableId ?? generatedId, columns);
  const [selected, setSelected] = React.useState<string[]>([]);
  const [visible, setVisible] = React.useState<string[]>([]);
  const registerVisible = React.useCallback((ids: string[]) => {
    setVisible((previous) => (JSON.stringify(previous) === JSON.stringify(ids) ? previous : ids));
    setSelected((previous) => {
      const next = previous.filter((id) => ids.includes(id));
      return next.length === previous.length ? previous : next;
    });
  }, []);
  const selection = {
    enabled: supportsSelection,
    selected,
    visible,
    setVisible: registerVisible,
    toggle: (id: string) =>
      setSelected((previous) =>
        previous.includes(id) ? previous.filter((key) => key !== id) : [...previous, id],
      ),
    toggleAll: () =>
      setSelected((previous) =>
        visible.length > 0 && visible.every((id) => previous.includes(id)) ? [] : visible,
      ),
  };
  return (
    <RowSelection.Provider value={selection}>
      <TableVisibility.Provider value={state}>
        <div className="w-full" ref={exportRoot}>
          {
            <div className="flex flex-wrap justify-end gap-2 px-4 py-2 border-b bg-muted/20">
              {supportsSelection && selected.length > 0 && (
                <div className="mr-auto flex flex-wrap items-center gap-2">
                  <span role="status" className="text-xs font-medium">
                    {selected.length} rows selected on this page
                  </span>
                  <VisibleDataExport
                    getRoot={() => exportRoot.current}
                    selectedOnly
                    label="Export selected rows"
                  />
                  <Button size="sm" variant="ghost" onClick={() => setSelected([])}>
                    Clear rows
                  </Button>
                </div>
              )}
              {exportable && <VisibleDataExport getRoot={() => exportRoot.current} />}
              <TableViewControls
                compactRows={compactRows}
                compactColumns={compactColumns}
                onRowsChange={setCompactRows}
                onColumnsChange={(compact) => {
                  setCompactColumns(compact);
                  setWidths({});
                }}
              />
              <TableColumnActions
                columns={state.columns}
                hidden={state.hidden}
                onHiddenChange={state.setHidden}
                onWidthChange={(ids, size) =>
                  setWidths((previous) => ({
                    ...previous,
                    ...Object.fromEntries(ids.map((id) => [id, size])),
                  }))
                }
              />
              <ColumnSelector
                columns={state.columns}
                hidden={state.hidden}
                onChange={state.setHidden}
              />
            </div>
          }
          <div
            data-slot="table-container"
            tabIndex={0}
            role="region"
            aria-label={props["aria-label"] ?? "Scrollable data table"}
            className="relative w-full overflow-x-auto overscroll-x-contain rounded-b-lg outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40"
          >
            <table
              data-slot="table"
              data-compact-rows={compactRows}
              data-compact-columns={compactColumns}
              data-column-widths={JSON.stringify(
                state.columns.map((column) => widths[column.id] ?? "default"),
              )}
              className={cn("w-full caption-bottom text-sm", className)}
              {...props}
            >
              {children}
            </table>
          </div>
        </div>
      </TableVisibility.Provider>
    </RowSelection.Provider>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <RowSection.Provider value="head">
      <thead data-slot="table-header" className={cn("[&_tr]:border-b", className)} {...props} />
    </RowSection.Provider>
  );
}

function TableBody({ className, children, ...props }: React.ComponentProps<"tbody">) {
  const selection = React.useContext(RowSelection);
  const rows = flatten(children);
  const ids = rows
    .filter(
      (row) =>
        React.isValidElement(row) &&
        row.type === TableRow &&
        row.key &&
        !/^\.\d+$/.test(String(row.key)),
    )
    .map((row) => String((row as React.ReactElement).key));
  const signature = JSON.stringify(ids);
  const register = selection?.setVisible;
  React.useEffect(() => {
    if (register) register(JSON.parse(signature));
  }, [signature, register]);
  return (
    <RowSection.Provider value="body">
      <tbody
        data-slot="table-body"
        className={cn("[&_tr:last-child]:border-0", className)}
        {...props}
      >
        {rows.map((row) =>
          React.isValidElement(row) && row.type === TableRow
            ? React.cloneElement(row as React.ReactElement<{ recordKey?: string }>, {
                recordKey:
                  row.key && !/^\.\d+$/.test(String(row.key)) ? String(row.key) : undefined,
              })
            : row,
        )}
      </tbody>
    </RowSection.Provider>
  );
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0", className)}
      {...props}
    />
  );
}

function TableRow({
  className,
  children,
  recordKey,
  ...props
}: React.ComponentProps<"tr"> & { recordKey?: string }) {
  const visibility = React.useContext(TableVisibility);
  const selection = React.useContext(RowSelection);
  const section = React.useContext(RowSection);
  const autoSelect = !!selection?.enabled;
  let offset = autoSelect ? 1 : 0;
  const cells = flatten(children).map((child, index) => {
    if (!React.isValidElement<{ colSpan?: number }>(child)) return child;
    const span = child.props.colSpan ?? 1;
    const start = offset;
    offset += span;
    const covered = visibility?.columns.slice(start, start + span) ?? [];
    const visible = covered.filter((column) => !visibility?.hidden.includes(column.id)).length;
    return (
      <CellVisibility.Provider
        key={child.key ?? index}
        value={{
          hidden: covered.length > 0 && visible === 0,
          colSpan: span > 1 ? Math.max(1, visible || span) : undefined,
        }}
      >
        {child}
      </CellVisibility.Provider>
    );
  });
  return (
    <tr
      data-slot="table-row"
      data-row-selected={
        autoSelect && recordKey
          ? selection?.selected.includes(recordKey)
          : props["data-row-selected" as keyof typeof props]
      }
      className={cn(
        "border-b transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted",
        className,
      )}
      {...props}
    >
      {autoSelect &&
        (section === "head" ? (
          <TableHead className="w-10" hideable={false}>
            <Checkbox
              aria-label="Select all visible rows"
              checked={
                selection!.visible.length > 0 &&
                selection!.visible.every((id) => selection!.selected.includes(id))
                  ? true
                  : selection!.selected.length > 0
                    ? "indeterminate"
                    : false
              }
              onCheckedChange={selection!.toggleAll}
            />
          </TableHead>
        ) : (
          <TableCell className="w-10" onClick={(event) => event.stopPropagation()}>
            {recordKey ? (
              <Checkbox
                aria-label={"Select row " + recordKey.replace(/^\.\$/, "")}
                checked={selection!.selected.includes(recordKey)}
                onCheckedChange={() => selection!.toggle(recordKey!)}
              />
            ) : null}
          </TableCell>
        ))}

      {cells}
    </tr>
  );
}

function TableHead({ className, valueType, ...props }: HeadProps) {
  delete props.exportKeys;
  delete props.columnLabel;
  delete props.hideable;
  const visibility = React.useContext(CellVisibility);
  return (
    <th
      data-slot="table-head"
      data-declared-value-type={
        valueType ??
        (/\b(amount|price|cost|balance|value|depreciation|opening|closing)\b/i.test(
          textOf(props.children),
        )
          ? "currency"
          : undefined)
      }
      className={cn(
        "h-11 px-4 text-left align-middle text-sm font-medium whitespace-nowrap text-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className,
      )}
      {...props}
      hidden={visibility?.hidden || props.hidden}
    />
  );
}

function TableCell({ className, children, ...props }: React.ComponentProps<"td">) {
  const visibility = React.useContext(CellVisibility);
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "px-4 py-3.5 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className,
      )}
      {...props}
      hidden={visibility?.hidden || props.hidden}
      colSpan={visibility?.colSpan ?? props.colSpan}
    >
      <div data-slot="table-cell-content">{children}</div>
    </td>
  );
}

function TableCaption({ className, ...props }: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
