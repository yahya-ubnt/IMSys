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
import { Package } from "@/types/mikrotik-package"

export const getColumns = (
  onEdit: (pkg: Package) => void,
  onDelete: (packageId: string) => void
): ColumnDef<Package>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Package Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
  },
  {
    accessorKey: "mikrotikRouter",
    header: "Router",
    cell: ({ row }) => {
      const router = row.original.mikrotikRouter;
      if (!router || typeof router === 'string') return "N/A";
      return `${router.name} (${router.ipAddress})`;
    },
  },
  {
    accessorKey: "serviceType",
    header: "Service Type",
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => `KES ${row.original.price.toLocaleString()}`,
  },
  {
    accessorKey: "profile",
    header: "Profile (PPPoE)",
    cell: ({ row }) => row.original.profile || "N/A",
  },
  {
    accessorKey: "rateLimit",
    header: "Rate Limit (Static)",
    cell: ({ row }) => row.original.rateLimit || "N/A",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const color = status === "active" 
        ? "bg-green-500/20 text-green-400 border-green-500/30" 
        : "bg-red-500/20 text-red-400 border-red-500/30";
      return <Badge variant="outline" className={`capitalize ${color}`}>{status}</Badge>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const pkg = row.original;
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
            <Link href={`/mikrotik/packages/${pkg._id}`} passHref>
              <DropdownMenuItem as="a">
                Edit Package
              </DropdownMenuItem>
            </Link>
            <DropdownMenuItem className="text-red-400 focus:text-red-400 focus:bg-red-500/20" onClick={() => onDelete(pkg._id)}>
              Delete Package
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];