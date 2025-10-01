"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"

export type Unit = {
  _id: string;
  label: string;
  visitStatus: string;
  provider: string;
  comments: string;
  createdAt: string;
}

export const getColumns = (onDelete: (unitId: string) => void): ColumnDef<Unit>[] => [
    {
        id: "number",
        header: "#",
        cell: ({ row }) => row.index + 1,
        enableSorting: false,
        enableHiding: false,
        size: 10, // Added size
    },
    {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            onClick={(e) => e.stopPropagation()} // Add onClick to stop propagation
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            onClick={(e) => e.stopPropagation()} // Add onClick to stop propagation
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 20, // Added size
      },
  {
    accessorKey: "label",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Unit<br />Label
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => { // Added cell for truncation
      const label = row.getValue("label");
      return <div className="overflow-hidden text-ellipsis whitespace-nowrap" title={label as string}>{label as string}</div>;
    },
    size: 60, // Added size
  },
  {
    accessorKey: "clientName",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Client<br />Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => { // Added cell for truncation
      const clientName = row.getValue("clientName");
      return <div className="overflow-hidden text-ellipsis whitespace-nowrap" title={clientName as string}>{clientName as string}</div>;
    },
    size: 80, // Added size
  },
  {
    accessorKey: "phone",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Phone<br />Number
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => { // Added cell for truncation
      const phone = row.getValue("phone");
      return <div className="overflow-hidden text-ellipsis whitespace-nowrap" title={phone as string}>{phone as string}</div>;
    },
    size: 40, // Added size
  },
  {
    accessorKey: "nextBillingDate",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Next<br />Billing<br />Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => { // Added cell for truncation
      const date = row.getValue("nextBillingDate")
      return <div className="overflow-hidden text-ellipsis whitespace-nowrap" title={date ? new Date(date as string).toLocaleDateString() : "N/A"}>{date ? new Date(date as string).toLocaleDateString() : "N/A"}</div>;
    },
    size: 60, // Added size
  },
  {
    accessorKey: "visitStatus",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Visit<br />Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const status = row.getValue("visitStatus") as string
      const variant = status === "Visited" ? "default" : "secondary"
      return <Badge variant={variant}>{status}</Badge>
    },
    size: 40, // Added size
  },
  {
    accessorKey: "provider",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Provider
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => { // Added cell for truncation
      const provider = row.getValue("provider");
      return <div className="overflow-hidden text-ellipsis whitespace-nowrap" title={provider as string}>{provider as string}</div>;
    },
    size: 80, // Added size
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date<br />Created
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => { // Added cell for truncation
      const date = new Date(row.getValue("createdAt"))
      const formattedDate = date.toLocaleDateString();
      return <div className="overflow-hidden text-ellipsis whitespace-nowrap" title={formattedDate}>{formattedDate}</div>;
    },
    size: 60, // Added size
  },
  {
    id: "actions",
    header: ({ column }) => { // Added header
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Actions
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const unit = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-9 w-9 p-0 text-primary hover:bg-primary/10">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(unit._id)}
            >
              Copy Unit ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild onClick={(e) => e.stopPropagation()}>
              <Link href={`/units/view/${unit._id}`}>View Details</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild onClick={(e) => e.stopPropagation()}>
              <Link href={`/units/edit/${unit._id}`}>Edit Unit</Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600" onClick={(e) => { e.stopPropagation(); onDelete(unit._id); }}>Delete Unit</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
    size: 20, // Added size
  },
]
