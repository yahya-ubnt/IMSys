"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { SmsLog } from "./page"
import { CheckCircle, XCircle } from "lucide-react"

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
      
      if (status === 'Success') {
        return (
          <Badge variant="outline" className="bg-green-600/20 text-green-400 border-green-600/30">
            <CheckCircle className="mr-2 h-4 w-4" />
            Success
          </Badge>
        )
      }
      
      if (status === 'Failed') {
        return (
          <Badge variant="outline" className="bg-red-600/20 text-red-400 border-red-600/30">
            <XCircle className="mr-2 h-4 w-4" />
            Failed
          </Badge>
        )
      }

      return <Badge variant="secondary">{status}</Badge>
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
