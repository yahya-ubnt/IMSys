"use client"

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  Table as TanstackTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface DataTableProps<TData, TValue> {
  table: TanstackTable<TData>
  columns: ColumnDef<TData, TValue>[]
  onRowClick?: (rowData: TData) => void
  className?: string
}

export function DataTable<TData, TValue>({
  table,
  columns,
  onRowClick,
  className,
}: DataTableProps<TData, TValue>) {
  return (
    <div className={`w-full rounded-md overflow-x-auto bg-zinc-900 ${className || ''}`}>
      <div className="rounded-md">
        <Table className="w-full text-left">
          <TableHeader className="border-b border-zinc-800 bg-zinc-800">{table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="px-2 py-1 text-left text-zinc-300 font-semibold uppercase tracking-wider">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className="bg-zinc-900">{table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    const isInteractiveElement = target.closest('button, a, input, select, [role="button"], [role="link"]');

                    if (!isInteractiveElement) {
                      onRowClick?.(row.original);
                    }
                  }}
                  className={`
                    ${onRowClick ? "cursor-pointer" : ""}
                    transition-colors
                    even:bg-zinc-900
                    hover:bg-zinc-800
                    data-[state=selected]:bg-zinc-800
                  `}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      onClick={(e) => {
                        if (onRowClick && cell.column.id !== 'select' && cell.column.id !== 'actions') {
                          e.stopPropagation();
                          onRowClick(cell.row.original);
                        }
                      }}
                      className="px-2 py-1 align-middle [&:has([role=checkbox])]:pr-0 text-zinc-200"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-zinc-400"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
