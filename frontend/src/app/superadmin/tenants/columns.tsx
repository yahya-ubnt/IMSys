'use client';

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

// --- Interface Definition ---
interface Tenant {
  _id: string;
  name: string;
  owner?: {
    fullName: string;
    email: string;
    phone: string;
  };
  status: 'Active' | 'Suspended';
  createdAt: string;
}

export const getColumns = (
  onEdit: (tenant: Tenant) => void,
  onSuspend: (tenant: Tenant) => void,
  onDelete: (tenant: Tenant) => void
): ColumnDef<Tenant>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Tenant Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
  },
  {
    accessorFn: (row) => row.owner?.fullName,
    id: "ownerName",
    header: "Owner Name",
  },
  {
    accessorFn: (row) => row.owner?.email,
    id: "ownerEmail",
    header: "Email",
  },
  {
    accessorFn: (row) => row.owner?.phone,
    id: "ownerPhone",
    header: "Phone",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const tenant = row.original;
      const variant = tenant.status === 'Active' ? 'default' : 'destructive';
      return <Badge variant={variant}>{tenant.status}</Badge>;
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Date Registered
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const tenant = row.original;
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
            <DropdownMenuItem onClick={() => onEdit(tenant)}>Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSuspend(tenant)}>
              {tenant.status === 'Active' ? 'Suspend' : 'Activate'}
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-400 focus:text-red-400 focus:bg-red-500/20" onClick={() => onDelete(tenant)}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];