"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, ArrowUpDown, Check, X } from "lucide-react"
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
  poeAdapter: boolean; // Added poeAdapter
  status: string; // Added status
  wifiName?: string;
  wifiPassword?: string;
  pppoeUsername?: string;
  pppoePassword?: string;
  staticIpAddress?: string;
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
    accessorKey: "status",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const status = row.getValue("status")
      return <Badge variant={status === "active" ? "default" : "destructive"}>{status as string}</Badge>
    },
    size: 40, // Added size
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
    cell: ({ row }) => { // Added cell for truncation
      const visitStatus = row.getValue("visitStatus");
      return <div className="overflow-hidden text-ellipsis whitespace-nowrap" title={visitStatus as string}>{visitStatus as string}</div>;
    },
    size: 40, // Added size
  },
  {
    accessorKey: "wifiName",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Wi-Fi<br />Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => { // Added cell for truncation
      const wifiName = row.original.wifiName || "N/A";
      return <div className="overflow-hidden text-ellipsis whitespace-nowrap" title={wifiName}>{wifiName}</div>;
    },
    size: 60, // Added size
  },
  {
    accessorKey: "wifiPassword",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Wi-Fi<br />Password
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => { // Added cell for truncation
      const wifiPassword = row.original.wifiPassword ? "********" : "N/A";
      return <div className="overflow-hidden text-ellipsis whitespace-nowrap" title={wifiPassword}>{wifiPassword}</div>;
    },
    size: 60, // Added size
  },
  
  {
    accessorKey: "pppoeUsername",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          PPPoE<br />Username
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => { // Added cell for truncation
      const pppoeUsername = row.original.pppoeUsername || "N/A";
      return <div className="overflow-hidden text-ellipsis whitespace-nowrap" title={pppoeUsername}>{pppoeUsername}</div>;
    },
    size: 60, // Added size
  },
  {
    accessorKey: "pppoePassword",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          PPPoE<br />Password
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => { // Added cell for truncation
      const pppoePassword = row.original.pppoePassword ? "********" : "N/A";
      return <div className="overflow-hidden text-ellipsis whitespace-nowrap" title={pppoePassword}>{pppoePassword}</div>;
    },
    size: 60, // Added size
  },
  {
    accessorKey: "poeAdapter",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          PoE<br />Adapter
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const hasPoeAdapter = row.getValue("poeAdapter")
      return (
        <div className="text-center">
          {hasPoeAdapter ? (
            <Check className="h-5 w-5 text-green-500" />
          ) : (
            <X className="h-5 w-5 text-red-500" />
          )}
        </div>
      )
    },
    size: 30, // Added size
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
