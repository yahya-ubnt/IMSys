"use client"

import { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowUpDown } from "lucide-react"
import { MikrotikUser } from "@/types/mikrotik"

export const columns: ColumnDef<MikrotikUser>[] = [
  {
    accessorKey: "username",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Username
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const user = row.original
      return (
        <Link href={`/mikrotik/users/${user._id}`} className="font-medium hover:underline">
          {user.username}
        </Link>
      )
    },
  },
  {
    accessorKey: "officialName",
    header: "Official Name",
  },
  {
    accessorKey: "mobileNumber",
    header: "Phone Number",
  },
  {
    accessorKey: "serviceType",
    header: "Service Type",
  },
  {
    accessorKey: "mikrotikRouter.name",
    header: "Router",
  },
]