"use client"

import { ColumnDef } from "@tanstack/react-table"

export interface MpesaTransaction {
  Number: number;
  'Transaction ID': string;
  'Official Name': string;
  Amount: number;
  'Date & Time': string;
}

export const columns: ColumnDef<MpesaTransaction>[] = [
  {
    accessorKey: "Number",
    header: "#",
  },
  {
    accessorKey: "Transaction ID",
    header: "Transaction ID",
  },
  {
    accessorKey: "Official Name",
    header: "Official Name",
  },
  {
    accessorKey: "Date & Time",
    header: "Date & Time",
  },
  {
    accessorKey: "Amount",
    header: "Amount",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("Amount"))
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "KES",
      }).format(amount)

      return <div className="text-right font-medium">{formatted}</div>
    },
  },
]
