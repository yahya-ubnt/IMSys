"use client"

import { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { MikrotikUser } from "@/app/mikrotik/users/page";

export const getColumns = (): ColumnDef<MikrotikUser & { daysOverdue: number }>[] => [
  {
    accessorKey: "username",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Username <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <Link href={`/reports/delayed-payments/${row.original._id}/stats`} className="font-medium text-blue-400 hover:underline">
        {row.original.username}
      </Link>
    ),
  },
  {
    accessorKey: "officialName",
    header: "Official Name",
  },
  {
    accessorKey: "mobileNumber",
    header: "Mobile Number",
  },
  {
    accessorKey: "package.name",
    header: "Package",
    cell: ({ row }) => row.original.package?.name || 'N/A',
  },
  {
    accessorKey: "expiryDate",
    header: "Expiry Date",
    cell: ({ row }) => new Date(row.getValue("expiryDate")).toLocaleDateString(),
  },
  {
    accessorKey: "daysOverdue",
    header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Days Overdue <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    cell: ({ row }) => {
        const days = row.original.daysOverdue;
        return <Badge variant="destructive">{days} {days === 1 ? 'day' : 'days'}</Badge>
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const user = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-zinc-800 text-white border-zinc-700">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem asChild><Link href={`/reports/delayed-payments/${user._id}/stats`}>View Stats</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link href={`/mikrotik/users/${user._id}`}>Edit User</Link></DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
