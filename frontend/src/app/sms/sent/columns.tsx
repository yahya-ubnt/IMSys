"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { SmsLog } from "./page"

export const columns: ColumnDef<SmsLog>[] = [
  {
    accessorKey: "mobileNumber",
    header: "Mobile Number",
  },
  {
    accessorKey: "message",
    header: "Message",
    cell: ({ row }) => <div className="truncate max-w-xs">{row.original.message}</div>,
  },
  {
    accessorKey: "smsStatus",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.smsStatus
      const variant = status === 'Success' ? 'success' : status === 'Failed' ? 'destructive' : 'secondary'
      return <Badge variant={variant} className={`
        ${status === 'Success' && 'bg-green-600/20 text-green-400 border-green-600/30'}
        ${status === 'Failed' && 'bg-red-600/20 text-red-400 border-red-600/30'}
      `}>{status}</Badge>
    },
  },
  {
    accessorKey: "messageType",
    header: "Message Type",
  },
  {
    accessorKey: "createdAt",
    header: "Sent At",
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleString(),
  },
]
