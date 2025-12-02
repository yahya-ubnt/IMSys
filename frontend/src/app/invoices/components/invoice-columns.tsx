"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, FileDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { format } from "date-fns"

// This type is a representation of the Invoice data we expect from the API
export type Invoice = {
  _id: string
  invoiceNumber: string
  amount: number
  dueDate: string
  status: "Paid" | "Unpaid" | "Overdue" | "Void"
  mikrotikUser: {
    username: string
    officialName: string
  }
  createdAt: string
}

interface GetInvoiceColumnsProps {
  onViewDetails: (id: string) => void;
}

export const getInvoiceColumns = ({ onViewDetails }: GetInvoiceColumnsProps): ColumnDef<Invoice>[] => [
  {
    accessorKey: "invoiceNumber",
    header: "Invoice #",
  },
  {
    accessorKey: "mikrotikUser.officialName",
    header: "Customer",
  },
  {
    accessorKey: "createdAt",
    header: "Date Issued",
    cell: ({ row }) => {
        return <span>{format(new Date(row.getValue("createdAt")), "PPP p")}</span>
    }
  },
  {
    accessorKey: "amount",
    header: () => <div className="text-right">Amount</div>,
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
    accessorKey: "dueDate",
    header: "Due Date",
    cell: ({ row }) => {
        return <span>{format(new Date(row.getValue("dueDate")), "PPP")}</span>
    }
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      let variant: "default" | "secondary" | "destructive" | "outline" = "secondary"
      let className = ""
      
      switch (status) {
        case "Paid":
          className = "bg-green-500 text-white" // Maintain green for Paid
          break;
        case "Unpaid":
          className = "border-gray-400 text-gray-400" // Subtle grey for Unpaid
          variant = "outline" // Use outline variant for border
          break;
        case "Overdue":
          variant = "destructive" // Keep destructive for Overdue
          break;
        default:
          variant = "secondary"
      }
      
      return <Badge variant={variant} className={`capitalize ${className}`}>{status}</Badge>
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const invoice = row.original

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
            <DropdownMenuItem onClick={() => onViewDetails(invoice._id)}>
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.open(`/api/invoices/${invoice._id}/pdf`, '_blank')}>
              <FileDown className="mr-2 h-4 w-4" />
              Download PDF
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(invoice.invoiceNumber)}
            >
              Copy Invoice ID
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
