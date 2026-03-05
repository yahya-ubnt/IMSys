"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { SmsLog } from "./page"
import { CheckCircle, XCircle, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"

export const columns = (onViewDetails: (sms: SmsLog) => void): ColumnDef<SmsLog>[] => [
  {
    header: "ID",
    cell: ({ row }) => row.index + 1,
  },
  {
    accessorKey: "providerResponse",
    header: "Message ID",
    cell: ({ row }) => {
      const message = row.original.providerResponse?.message || "";
      const match = message.match(/Message ID: (.*)/);
      return match ? match[1] : "N/A";
    },
  },
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
    cell: ({ row }) => {
      const messageType = row.original.messageType;
      let displayType = messageType;
      if (messageType === 'Manual') {
        displayType = 'Manual';
      } else if (messageType === 'Expiry Alert') {
        displayType = 'Expiry Alert';
      }

      return (
        <div className="flex items-center">
          <span>{displayType}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Sent At",
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleString(),
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <Button variant="ghost" size="icon" onClick={() => onViewDetails(row.original)}>
        <Eye className="h-4 w-4" />
      </Button>
    ),
  },
]
