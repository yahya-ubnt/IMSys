"use client"

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import { HotspotPlan } from "@/types/hotspot";

export const getColumns = (user: { roles: string[] } | null, handleOpenForm: (plan: HotspotPlan) => void, setDeleteCandidateId: (id: string) => void): ColumnDef<HotspotPlan>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          <span className="text-xs">Name</span>
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      );
    },
  },
  {
    accessorKey: "price",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          <span className="text-xs">Price</span>
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      );
    },
    cell: ({ row }) => `Ksh ${row.original.price}`,
  },
  {
    accessorKey: "timeLimit",
    header: "Time Limit",
    cell: ({ row }) => `${row.original.timeLimitValue} ${row.original.timeLimitUnit}`
  },
  {
    accessorKey: "dataLimit",
    header: "Data Limit",
    cell: ({ row }) => `${row.original.dataLimitValue} ${row.original.dataLimitUnit}`
  },
  {
    accessorKey: "mikrotikRouter.name",
    header: "Router",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const plan = row.original;
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
            <DropdownMenuItem onClick={() => handleOpenForm(plan)}>Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDeleteCandidateId(plan._id)}>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
