"use client"

import { ColumnDef } from "@tanstack/react-table"

export type HotspotTransaction = {
  _id: string
  planId: {
    name: string
  }
  phoneNumber: string
  macAddress: string
  amount: number
  status: "pending" | "completed" | "failed"
  createdAt: string
}

export const getColumns = (): ColumnDef<HotspotTransaction>[] => [
  {
    id: "serialNumber",
    header: "S/N",
    cell: ({ row }) => row.index + 1,
  },
  {
    accessorKey: "planId.name",
    header: "Plan",
  },
  {
    accessorKey: "phoneNumber",
    header: "Phone Number",
  },
  {
    accessorKey: "macAddress",
    header: "MAC Address",
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"))
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "KES",
      }).format(amount)
      return <div className="text-right font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) => {
      const date = new Date(row.original.createdAt)
      return date.toLocaleString()
    },
  },
]
