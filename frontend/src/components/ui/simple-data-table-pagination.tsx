"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Table } from "@tanstack/react-table"

import { Button } from "@/components/ui/button"

interface SimpleDataTablePaginationProps<TData> {
  table: Table<TData>
}

export function SimpleDataTablePagination<TData>({
  table,
}: SimpleDataTablePaginationProps<TData>) {
  return (
    <div className="flex items-center justify-end space-x-2 py-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => table.previousPage()}
        disabled={!table.getCanPreviousPage()}
        className="bg-zinc-800 border-zinc-700"
      >
        <ChevronLeft className="h-4 w-4 mr-2" />
        Previous
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => table.nextPage()}
        disabled={!table.getCanNextPage()}
        className="bg-zinc-800 border-zinc-700"
      >
        Next
        <ChevronRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  )
}
