'use client';

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Lead } from "@/types/lead";

const getStatusColor = (status: Lead["status"]) => {
  const colors = {
    New: "bg-blue-800 text-blue-100",
    Contacted: "bg-cyan-800 text-cyan-100",
    Interested: "bg-purple-800 text-purple-100",
    "Site Survey Scheduled": "bg-indigo-800 text-indigo-100",
    Converted: "bg-green-800 text-green-100",
    "Not Interested": "bg-red-800 text-red-100",
    "Future Prospect": "bg-orange-800 text-orange-100",
  };
  return colors[status];
};

export const getColumns = (
  onDelete: (leadId: string) => void,
  onStatusChange: (lead: Lead) => void
): ColumnDef<Lead>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-white hover:bg-zinc-700"
      >
        Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const lead = row.original;
      return (
        <Link href={`/leads/${lead._id}`} className="hover:underline text-cyan-400">
          {lead.name || "Anonymous Lead"}
        </Link>
      );
    },
  },
  {
    accessorKey: "phoneNumber",
    header: "Phone Number",
  },
  {
    accessorKey: "leadSource",
    header: "Source",
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-white hover:bg-zinc-700"
      >
        Status
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const status = row.getValue("status");
      return (
        <Badge className={getStatusColor(status as Lead["status"])}>
          {status as string}
        </Badge>
      );
    },
  },
  {
    accessorKey: "broughtInBy",
    header: "Brought In By",
    cell: ({ row }) => row.original.broughtInBy || "N/A",
  },
  {
    accessorKey: "totalAmount",
    header: "Total Amount",
    cell: ({ row }) => `KES ${row.original.totalAmount?.toLocaleString() || 0}`,
  },
  {
    accessorKey: "followUpDate",
    header: "Follow-up Date",
    cell: ({ row }) => {
      const date = row.original.followUpDate;
      return date ? new Date(date).toLocaleDateString() : "N/A";
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const lead = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 text-white hover:bg-zinc-700">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-zinc-800 text-white border-zinc-700">
            <DropdownMenuLabel className="text-blue-400">Actions</DropdownMenuLabel>
            <DropdownMenuItem asChild className="hover:bg-zinc-700 focus:bg-zinc-700">
              <Link href={`/leads/${lead._id}`}>View Details</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="hover:bg-zinc-700 focus:bg-zinc-700">
              <Link href={`/leads/edit/${lead._id}`}>Edit Lead</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-zinc-700" />
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange(lead);
              }}
              className="hover:bg-zinc-700 focus:bg-zinc-700"
            >
              Convert Lead
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-zinc-700" />
            <DropdownMenuItem
              className="text-red-600 hover:bg-zinc-700 focus:bg-zinc-700"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(lead._id);
              }}
            >
              Delete Lead
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];