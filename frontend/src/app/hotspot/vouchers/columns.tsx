"use client"

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// TODO: Move to a types file
interface Voucher {
  _id: string;
  username: string;
  profile: string;
  price: number;
  batch: string;
  createdAt: string;
  password?: string;
}

export const getColumns = (user: any, setDeleteCandidateBatchId: (id: string) => void): ColumnDef<Voucher>[] => [
  {
    accessorKey: "username",
    header: "Username",
  },
  {
    accessorKey: "password",
    header: "Password",
  },
  {
    accessorKey: "profile",
    header: "Profile",
  },
  {
    accessorKey: "price",
    header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}><span className="text-xs">Price</span><ArrowUpDown className="ml-2 h-3 w-3" /></Button>,
    cell: ({ row }) => `Ksh ${row.original.price}`,
  },
  {
    accessorKey: "createdAt",
    header: "Generated At",
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleString(),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const voucher = row.original;
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
            <DropdownMenuItem onClick={() => setDeleteCandidateBatchId(voucher.batch)}>Delete Batch</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
