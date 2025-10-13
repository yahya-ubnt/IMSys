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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { MikrotikUser } from "./page"; // Import from the page component

export const getMikrotikUserStatus = (user: MikrotikUser) => {
  const expiryDate = new Date(user.expiryDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (expiryDate < now) {
    return { status: "Expired", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" };
  }
  return { status: "Active", color: "bg-green-500/20 text-green-400 border-green-500/30" };
};

const getRemainingDays = (expiryDateString: string): string => {
  const expiryDate = new Date(expiryDateString);
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const diffTime = expiryDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays.toString();
};

export const getColumns = (
  onDelete?: (userId: string) => void
): ColumnDef<MikrotikUser>[] => [
  {
    accessorKey: "username",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Username <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <Link href={`/mikrotik/users/${row.original._id}/details`} className="font-medium text-blue-400 hover:underline">
        {row.original.username}
      </Link>
    ),
  },
  {
    accessorKey: "officialName",
    header: "Official Name",
  },
  {
    accessorKey: "apartment_house_number",
    header: "Apartment/House",
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
    accessorKey: "mikrotikRouter.name",
    header: "Mikrotik Router",
  },
  {
    accessorKey: "station.deviceName",
    header: "Station",
    cell: ({ row }) => {
      const station = row.original.station;
      if (!station) return 'N/A';
      return (
        <Link href={`/devices/${station._id}`} className="font-medium text-blue-400 hover:underline">
          {station.deviceName}
        </Link>
      );
    },
  },
  {
    accessorKey: "expiryDate",
    header: "Expiry Date",
    cell: ({ row }) => new Date(row.getValue("expiryDate")).toLocaleDateString(),
  },
  {
    id: "remainingDays",
    header: "Days Left",
    cell: ({ row }) => getRemainingDays(row.original.expiryDate),
  },
  {
    id: "accountStatus",
    header: "Status",
    cell: ({ row }) => {
      const { status, color } = getMikrotikUserStatus(row.original);
      return <Badge variant="outline" className={`capitalize ${color}`}>{status}</Badge>;
    },
  },
  {
    id: "onlineStatus",
    header: "Online",
    cell: ({ row }) => {
      return row.original.isOnline 
        ? <Badge variant="outline" className="border-green-500/30 bg-green-500/20 text-green-400">Online</Badge>
        : <Badge variant="outline" className="border-red-500/30 bg-red-500/20 text-red-400">Offline</Badge>;
    },
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
            <DropdownMenuItem asChild><Link href={`/mikrotik/users/${user._id}/details`}>View Details</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link href={`/mikrotik/users/${user._id}`}>Edit User</Link></DropdownMenuItem>
            <DropdownMenuSeparator className="bg-zinc-700" />
            {onDelete && (
              <DropdownMenuItem className="text-red-400 focus:text-red-400 focus:bg-red-500/20" onClick={() => onDelete(user._id)}>
                Delete User
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
