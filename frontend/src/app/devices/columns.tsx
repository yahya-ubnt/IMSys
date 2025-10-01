'use client'

import { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Device } from "@/lib/deviceService"

const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString();
};

export const getColumns = (
  onDelete?: (deviceId: string, event: React.MouseEvent) => void
): ColumnDef<Device>[] => [
  {
    accessorKey: "deviceName",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Device Name <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <Link href={`/devices/${row.original._id}`} className="font-medium text-blue-400 hover:underline">
        {row.original.deviceName || 'N/A'}
      </Link>
    ),
  },
  {
    accessorKey: "ipAddress",
    header: "IP Address",
  },
  {
    accessorKey: "macAddress",
    header: "MAC Address",
  },
  {
    accessorKey: "deviceType",
    header: "Type",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const color = status === "UP" 
        ? "bg-green-500/20 text-green-400 border-green-500/30" 
        : "bg-red-500/20 text-red-400 border-red-500/30";
      return <Badge variant="outline" className={`capitalize ${color}`}>{status === "UP" ? "Online" : "Offline"}</Badge>;
    },
  },
  {
    accessorKey: "router.name",
    header: "Router",
    cell: ({ row }) => row.original.router?.name || 'N/A',
  },
  {
    accessorKey: "lastSeen",
    header: "Last Seen",
    cell: ({ row }) => formatDate(row.original.lastSeen),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const device = row.original;
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
            <DropdownMenuItem asChild><Link href={`/devices/${device._id}`}>View Details</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link href={`/devices/edit/${device._id}`}>Edit Device</Link></DropdownMenuItem>
            <DropdownMenuSeparator className="bg-zinc-700" />
            {onDelete && (
              <DropdownMenuItem
                className="text-red-400 focus:text-red-400 focus:bg-red-500/20"
                onClick={(e) => onDelete(device._id, e)}
              >
                Delete Device
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];