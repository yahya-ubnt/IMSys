"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SmsExpirySchedule } from "./page"

interface ColumnsProps {
  handleEdit: (schedule: SmsExpirySchedule) => void;
  handleDelete: (schedule: SmsExpirySchedule) => void;
}

export const columns = ({ handleEdit, handleDelete }: ColumnsProps): ColumnDef<SmsExpirySchedule>[] => [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "days",
    header: "Days",
  },
  {
    accessorKey: "timing",
    header: "Timing",
  },
  {
    accessorKey: "messageBody",
    header: "Message Body",
    cell: ({ row }) => {
      const message = row.original.messageBody
      return <div className="truncate max-w-xs">{message}</div>
    },
  },
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => {
      return new Date(row.original.createdAt).toLocaleDateString()
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const schedule = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => handleEdit(schedule)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDelete(schedule)} className="text-red-500">
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
