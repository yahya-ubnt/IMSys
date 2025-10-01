"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

export interface MpesaAlert {
  _id: string;
  message: string;
  createdAt: string;
}

export const getColumns = (handleDelete: (id: string) => void): ColumnDef<MpesaAlert>[] => [
  {
    accessorKey: "index",
    header: "#",
    cell: ({ row }) => row.index + 1,
  },
  {
    accessorKey: "message",
    header: "Message",
    cell: ({ row }) => <div className="max-w-md truncate">{row.original.message}</div>,
  },
  {
    accessorKey: "createdAt",
    header: "Date & Time",
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleString(),
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <div className="text-right">
        <Button
          variant='destructive'
          size='icon'
          onClick={() => handleDelete(row.original._id)}
          className="bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
        >
          <Trash2 className='h-4 w-4' />
        </Button>
      </div>
    ),
  },
]
