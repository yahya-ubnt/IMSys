"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ChevronDown } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select" // Import Select components

interface DataTableProps<TData, TValue, TMeta extends Record<string, unknown>> {
  handleEdit?: (expense: TData) => void;
  handleDelete?: (id: string) => void;
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  filterColumn?: string
  onRowClick?: (rowData: TData) => void
  className?: string
  initialColumnVisibility?: VisibilityState
  meta?: TMeta // Allow passing meta data to the table
  pageSizeOptions?: number[] // New prop for page size options
}

export function DataTable<TData, TValue, TMeta extends Record<string, unknown>>({
  columns,
  data,
  filterColumn,
  onRowClick,
  className,
  initialColumnVisibility,
  meta,
  pageSizeOptions,
  handleEdit,
  handleDelete,
}: DataTableProps<TData, TValue, TMeta>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>(initialColumnVisibility || {})
  const [rowSelection, setRowSelection] = React.useState({})
  const [pagination, setPagination] = React.useState({ // Define pagination state
    pageIndex: 0,
    pageSize: pageSizeOptions?.[0] || 10,
  });

    const table = useReactTable<TData>({
    data,
    columns,
    meta: { ...meta, ...(handleEdit && { handleEdit }), ...(handleDelete && { handleDelete }) },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination, // Use the pagination state
    },
    initialState: {
      pagination: {
        pageSize: pageSizeOptions?.[0] || 10, // Set initial page size
      },
    },
    onPaginationChange: setPagination, // Control pagination state
  })

  return (
    <div className={`w-full rounded-md overflow-x-auto bg-zinc-900 ${className || ''}`}> {/* Added futuristic styling */}
      <div className="flex items-center py-4 px-4"> {/* Added padding and border */}
        {filterColumn && table.getColumn(filterColumn) && (
            <Input
            placeholder={`Filter by ${filterColumn}...`}
            value={(table.getColumn(filterColumn)?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
                table.getColumn(filterColumn)?.setFilterValue(event.target.value)
            }
            className="max-w-sm bg-zinc-800 text-white border-zinc-700 placeholder-zinc-500 focus:border-blue-500 focus:ring-blue-500 rounded-lg" // Styled input
            />
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700"> {/* Styled button */}
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-zinc-800 text-white border-zinc-700"> {/* Styled dropdown content */}
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize focus:bg-zinc-700 focus:text-white"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md"> {/* Removed redundant rounded-md */}
        <Table className="w-full text-left">
          <TableHeader className="border-b border-zinc-800 bg-zinc-800">{table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="px-2 py-1 text-left text-zinc-300 font-semibold uppercase tracking-wider"> {/* Styled header cells */}
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
                  }} // Added onClick handler
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
                        // Only trigger onRowClick if the cell is not part of the 'select' or 'actions' column
                        if (onRowClick && cell.column.id !== 'select' && cell.column.id !== 'actions') {
                          // Stop propagation to prevent the row's onClick from firing if it were still there
                          e.stopPropagation();
                          onRowClick(cell.row.original);
                        }
                      }}
                      className="px-2 py-1 align-middle [&:has([role=checkbox])]:pr-0 text-zinc-200" // Styled table cells
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
      <div className="flex items-center justify-end space-x-2 py-4 px-4"> {/* Styled pagination container */}
        {/* Removed: Row selection info */}
        {/* Pagination controls */}
        <div className="flex items-center space-x-2">
          {pageSizeOptions && pageSizeOptions.length > 0 && (
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value))
              }}
            >
              <SelectTrigger className="h-8 w-[70px] bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700"> {/* Styled select trigger */}
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top" className="bg-zinc-800 text-white border-zinc-700"> {/* Styled select content */}
                {pageSizeOptions.map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`} className="focus:bg-zinc-700 focus:text-white"> {/* Styled select item */}
                    {pageSize === data.length ? "All" : pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700" // Styled button
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700" // Styled button
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
