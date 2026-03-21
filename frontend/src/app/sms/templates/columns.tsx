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
import { SmsTemplate } from "@/types/sms"

interface ColumnsProps {
  handleEdit: (template: SmsTemplate) => void;
  handleDelete: (template: SmsTemplate) => void;
}

export const columns = ({ handleEdit, handleDelete }: ColumnsProps): ColumnDef<SmsTemplate>[] => [
  {
    id: "index",
    header: "#",
    cell: ({ row }) => row.index + 1,
  },
  {
    accessorKey: "triggerType",
    header: "Trigger Type",
    cell: ({ row }) => {
      const trigger = row.original.triggerType;
      // Format triggerType to be more readable (e.g., 'mikrotik_user_created' -> 'Mikrotik User Created')
      const formattedTrigger = trigger.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      return <div>{formattedTrigger}</div>;
    },
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
    cell: ({ row }) => {
      const status = row.original.status;
      const statusClass = status === 'Active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400';
      return <div className={`px-2 py-1 rounded-full text-xs font-medium inline-block ${statusClass}`}>{status}</div>;
    },
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
      const template = row.original
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
            <DropdownMenuItem onClick={() => handleEdit(template)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDelete(template)} className="text-red-500">
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
