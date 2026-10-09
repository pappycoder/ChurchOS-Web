"use client"

import * as React from "react"

import { ColumnSelector } from "@/components/shared/column-selector"
import { useTableColumns, type TableColumn } from "@/contexts/table-columns-context"

import { cn } from "@/lib/utils"

const TableVisibility = React.createContext<{ columns: TableColumn[]; hidden: string[] } | null>(null)
const CellVisibility = React.createContext<{ hidden: boolean; colSpan?: number } | null>(null)

type HeadProps = React.ComponentProps<"th"> & { exportKeys?: string[]; columnLabel?: string; hideable?: boolean }

function flatten(nodes: React.ReactNode): React.ReactNode[] {
  return React.Children.toArray(nodes).flatMap((node) =>
    React.isValidElement<{ children?: React.ReactNode }>(node) && node.type === React.Fragment
      ? flatten(node.props.children) : [node],
  )
}
function textOf(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node)
  return React.isValidElement<{ children?: React.ReactNode }>(node)
    ? React.Children.toArray(node.props.children).map(textOf).join(" ").trim() : ""
}
function headerColumns(children: React.ReactNode): TableColumn[] {
  const header = flatten(children).find((node) => React.isValidElement(node) && node.type === TableHeader)
  if (!React.isValidElement<{ children?: React.ReactNode }>(header)) return []
  const heads: React.ReactElement<HeadProps>[] = []
  const visit = (nodes: React.ReactNode) => flatten(nodes).forEach((node) => {
    if (!React.isValidElement<HeadProps>(node)) return
    if (node.type === TableHead) heads.push(node)
    else visit(node.props.children)
  })
  visit(header.props.children)
  const occurrences = new Map<string, number>()
  return heads.map((head, index) => {
    const label = head.props.columnLabel ?? textOf(head.props.children)
    const occurrence = occurrences.get(label) ?? 0
    occurrences.set(label, occurrence + 1)
    return { id: label ? `${label}:${occurrence}` : `selection:${index}`, label,
      hideable: head.props.hideable ?? !!label, exportKeys: head.props.exportKeys }
  })
}

function Table({ className, children, tableId, ...props }: React.ComponentProps<"table"> & { tableId?: string }) {
  const generatedId = React.useId()
  const state = useTableColumns(tableId ?? generatedId, headerColumns(children))
  return (
    <TableVisibility.Provider value={state}>
      <div className="w-full">
        {state.columns.some((column) => column.hideable) && (
          <div className="flex justify-end px-4 py-2 border-b bg-muted/20">
            <ColumnSelector columns={state.columns} hidden={state.hidden} onChange={state.setHidden} />
          </div>
        )}
        <div data-slot="table-container" className="relative w-full overflow-x-auto overscroll-x-contain">
          <table data-slot="table" className={cn("w-full caption-bottom text-sm", className)} {...props}>
            {children}
          </table>
        </div>
      </div>
    </TableVisibility.Provider>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("bg-muted/40 [&_tr]:border-b", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

function TableRow({ className, children, ...props }: React.ComponentProps<"tr">) {
  const visibility = React.useContext(TableVisibility)
  let offset = 0
  const cells = flatten(children).map((child, index) => {
    if (!React.isValidElement<{ colSpan?: number }>(child)) return child
    const span = child.props.colSpan ?? 1
    const start = offset
    offset += span
    const covered = visibility?.columns.slice(start, start + span) ?? []
    const visible = covered.filter((column) => !visibility?.hidden.includes(column.id)).length
    return <CellVisibility.Provider key={child.key ?? index} value={{ hidden: covered.length > 0 && visible === 0, colSpan: span > 1 ? Math.max(1, visible || span) : undefined }}>{child}</CellVisibility.Provider>
  })
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b transition-colors hover:bg-primary/3 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-primary/8",
        className
      )}
      {...props}
    >{cells}</tr>
  )
}

function TableHead({ className, ...props }: HeadProps) {
  delete props.exportKeys
  delete props.columnLabel
  delete props.hideable
  const visibility = React.useContext(CellVisibility)
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-11 px-4 text-left align-middle text-xs font-semibold whitespace-nowrap text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
      hidden={visibility?.hidden || props.hidden}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  const visibility = React.useContext(CellVisibility)
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "px-4 py-3.5 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
      hidden={visibility?.hidden || props.hidden}
      colSpan={visibility?.colSpan ?? props.colSpan}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
