"use client"

import { Table } from "@tanstack/react-table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"

interface TicketToolbarProps<TData> {
  table: Table<TData>
}

export function TicketToolbar<TData>({ table }: TicketToolbarProps<TData>) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
      <div className="flex items-center gap-2 flex-wrap">
        <Button size="sm" className={!table.getColumn('status')?.getFilterValue() ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-transparent border border-zinc-700 text-zinc-400 hover:bg-zinc-800'} onClick={() => table.getColumn('status')?.setFilterValue(undefined)}>All</Button>
        <Button size="sm" className={table.getColumn('status')?.getFilterValue() === 'New' ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-transparent border border-zinc-700 text-zinc-400 hover:bg-zinc-800'} onClick={() => table.getColumn('status')?.setFilterValue('New')}>New</Button>
        <Button size="sm" className={table.getColumn('status')?.getFilterValue() === 'Open' ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-transparent border border-zinc-700 text-zinc-400 hover:bg-zinc-800'} onClick={() => table.getColumn('status')?.setFilterValue('Open')}>Opened</Button>
        <Button size="sm" className={table.getColumn('status')?.getFilterValue() === 'In Progress' ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-transparent border border-zinc-700 text-zinc-400 hover:bg-zinc-800'} onClick={() => table.getColumn('status')?.setFilterValue('In Progress')}>In Progress</Button>
        <Button size="sm" className={table.getColumn('status')?.getFilterValue() === 'Resolved' ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-transparent border border-zinc-700 text-zinc-400 hover:bg-zinc-800'} onClick={() => table.getColumn('status')?.setFilterValue('Resolved')}>Resolved</Button>
        <Button size="sm" className={table.getColumn('status')?.getFilterValue() === 'Closed' ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-transparent border border-zinc-700 text-zinc-400 hover:bg-zinc-800'} onClick={() => table.getColumn('status')?.setFilterValue('Closed')}>Closed</Button>
      </div>
      <div className="relative w-full sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <Input
          placeholder="Search by client name..."
          value={(table.getColumn("clientName")?.getFilterValue() as string) ?? ""}
          onChange={(event) => table.getColumn("clientName")?.setFilterValue(event.target.value)}
          className="pl-10 h-9 bg-zinc-800 border-zinc-700"
        />
      </div>
    </div>
  )
}
