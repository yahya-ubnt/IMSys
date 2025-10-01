"use client"

import { ColumnDef } from "@tanstack/react-table"

export interface ReportData {
  SN: number;
  'Official Name': string;
  'Total Amount': number;
  Type: string;
  'Reference Number': string;
}

export const columns: ColumnDef<ReportData>[] = [
  {
    accessorKey: "SN",
    header: "SN",
  },
  {
    accessorKey: "Official Name",
    header: "Official Name",
  },
  {
    accessorKey: "Type",
    header: "Type",
  },
  {
    accessorKey: "Reference Number",
    header: "Reference",
  },
  {
    accessorKey: "Total Amount",
    header: "Amount",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("Total Amount"))
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "KES",
      }).format(amount)

      return <div className="text-right font-medium">{formatted}</div>
    },
  },
]
