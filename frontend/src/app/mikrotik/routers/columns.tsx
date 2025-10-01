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
import { Badge } from "@/components/ui/badge";

// --- Interface Definition ---
interface MikrotikRouter {
  _id: string;
  name: string;
  ipAddress: string;
  apiUsername: string;
  apiPort: number;
  location?: string;
  isOnline: boolean;
  lastChecked?: string;
}

// --- Main Component ---
export const getColumns = (
  onDelete?: (routerId: string) => void,
): ColumnDef<MikrotikRouter>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Name <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <Link href={`/mikrotik/routers/${row.original._id}/dashboard`} className="font-medium text-blue-400 hover:underline">
        {row.original.name}
      </Link>
    ),
  },
  {
    accessorKey: "ipAddress",
    header: "IP Address",
  },
  {
    accessorKey: "apiUsername",
    header: "API Username",
  },
  {
    accessorKey: "location",
    header: "Location",
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => {
      const { isOnline, lastChecked } = row.original;
      const statusColor = isOnline ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-red-500/20 text-red-400 border-red-500/30";
      const statusText = isOnline ? "Online" : "Offline";
      return (
        <div className="flex flex-col items-start gap-1">
          <Badge variant="outline" className={statusColor}>{statusText}</Badge>
          <span className="text-xs text-zinc-400">
            {lastChecked ? new Date(lastChecked).toLocaleString() : "N/A"}
          </span>
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const router = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-zinc-800 text-white border-zinc-700">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem asChild><Link href={`/mikrotik/routers/${router._id}/dashboard`}>View Dashboard</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link href={`/mikrotik/routers/${router._id}`}>Edit Router</Link></DropdownMenuItem>
            {onDelete && (
              <DropdownMenuItem className="text-red-400 focus:text-red-400 focus:bg-red-500/20" onClick={() => onDelete(router._id)}>
                Delete Router
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
]