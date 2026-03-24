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
import { calculateDaysRemaining } from "@/lib/utils"; // Import the new utility function

// --- Interface Definition ---
interface User {
  name: string;
  email: string;
  roles: string[];
  loginMethod: string;
  avatar?: string;
}

export const getMikrotikUserStatus = (user: MikrotikUser) => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (user.gracePeriodEnabled) {
    const expectedPaymentDate = new Date(user.expectedPaymentDate || '');
    if (expectedPaymentDate >= now) {
      return { status: "Grace Period", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" };
    } else {
      // Grace period has passed, treat as expired
      return { status: "Expired (Grace Ended)", color: "bg-red-500/20 text-red-400 border-red-500/30" };
    }
  }

  const expiryDate = new Date(user.expiryDate);
  if (expiryDate < now) {
    return { status: "Expired", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" };
  }
  return { status: "Active", color: "bg-green-500/20 text-green-400 border-green-500/30" };
};

export const getColumns = (
  user: User | null,
  onDelete?: (userId: string) => void
): ColumnDef<MikrotikUser>[] => {
  const columns: ColumnDef<MikrotikUser>[] = [
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
      id: "officialName", // Added unique ID
      header: ({ column }) => (
        <Button variant="ghost">
          Official Name
        </Button>
      ),
    },
    {
      accessorKey: "mobileNumber",
      id: "mobileNumber", // Added unique ID
      header: ({ column }) => (
        <Button variant="ghost">
          Mobile Number
        </Button>
      ),
    },
    {
      accessorKey: "package.name",
      id: "packageName", // Added unique ID
      header: ({ column }) => (
        <Button variant="ghost">
          Package
        </Button>
      ),
      cell: ({ row }) => row.original.package?.name || 'N/A',
    },
    {
      accessorKey: "mikrotikRouter.name",
      id: "mikrotikRouterName", // Added unique ID
      header: ({ column }) => (
        <Button variant="ghost">
          Mikrotik Router
        </Button>
      ),
    },
    {
      accessorKey: "station.deviceName",
      id: "stationName", // Added unique ID
      header: ({ column }) => (
        <Button variant="ghost">
          Station
        </Button>
      ),
      cell: ({ row }) => {
        const station = row.original.station;
        if (station) {
          return (
            <Link href={`/devices/${station._id}`} className="font-medium text-blue-400 hover:underline">
              {station.deviceName}
            </Link>
          );
        }
        return 'N/A';
      },
    },
    { // New Building Column
      accessorKey: "building.name",
      id: "buildingName", // Added unique ID
      header: ({ column }) => (
        <Button variant="ghost">
          Location
        </Button>
      ),
      cell: ({ row }) => {
        const building = row.original.building;
        if (building) {
          return building.name;
        }
        return 'N/A';
      },
    },
    {
      accessorKey: "expiryDate",
      id: "expiryDate", // Added unique ID
      header: ({ column }) => (
        <Button variant="ghost">
          Expiry Date
        </Button>
      ),
      cell: ({ row }) => new Date(row.getValue("expiryDate")).toLocaleDateString(),
    },
    {
      id: "remainingDays",
      header: ({ column }) => (
        <Button variant="ghost">
          Days Left
        </Button>
      ),
      cell: ({ row }) => calculateDaysRemaining(row.original.expiryDate).toString(),
    },
    {
      id: "accountStatus",
      header: ({ column }) => (
        <Button variant="ghost">
          Status
        </Button>
      ),
      cell: ({ row }) => {
        const { status, color } = getMikrotikUserStatus(row.original);
        return <Badge variant="outline" className={`capitalize ${color}`}>{status}</Badge>;
      },
      filterFn: (row, id, value) => {
        const userStatus = getMikrotikUserStatus(row.original).status.toLowerCase();
        return value.includes(userStatus);
      },
    },
    {
      id: "onlineStatus",
      header: ({ column }) => (
        <Button variant="ghost">
          Online
        </Button>
      ),
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

  if (user?.roles.includes("SUPER_ADMIN")) {
    columns.splice(1, 0, {
      accessorKey: "tenant.fullName",
      header: "Tenant",
      cell: ({ row }) => row.original.tenant?.fullName || "N/A",
    });
  }

  return columns;
};
