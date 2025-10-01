"use client"

import { ColumnDef } from "@tanstack/react-table"
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
    accessorKey: "status",
    header: "Status",
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
