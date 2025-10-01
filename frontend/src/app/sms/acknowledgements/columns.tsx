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
import { SmsAcknowledgement } from "./page"

interface ColumnsProps {
  handleEdit: (acknowledgement: SmsAcknowledgement) => void;
  handleDelete: (acknowledgement: SmsAcknowledgement) => void;
}

export const columns = ({ handleEdit, handleDelete }: ColumnsProps): ColumnDef<SmsAcknowledgement>[] => [
  {
    accessorKey: "triggerType",
    header: "Trigger Type",
  },
  {
    accessorKey: "description",
    header: "Description",
  },
  {
    accessorKey: "smsTemplate.name",
    header: "Linked Template",
    cell: ({ row }) => row.original.smsTemplate.name,
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
      const acknowledgement = row.original
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
            <DropdownMenuItem onClick={() => handleEdit(acknowledgement)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDelete(acknowledgement)} className="text-red-500">
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
