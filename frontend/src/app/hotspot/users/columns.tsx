"use client"

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import { HotspotUser } from "@/types/hotspot";

export const getColumns = (user: any, handleOpenForm: (user: HotspotUser) => void, setDeleteCandidateId: (id: string) => void): ColumnDef<HotspotUser>[] => [
  {
    accessorKey: "officialName",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          <span className="text-xs">Official Name</span>
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      );
    },
  },
  {
    accessorKey: "hotspotName",
    header: "Username",
  },
  {
    accessorKey: "profile",
    header: "Profile",
  },
  {
    accessorKey: "server",
    header: "Server",
  },
  {
    accessorKey: "phoneNumber",
    header: "Phone Number",
  },
  {
    accessorKey: "mikrotikRouter.name",
    header: "Router",
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
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => handleOpenForm(user)}>Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDeleteCandidateId(user._id)}>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];