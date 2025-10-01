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
import { Checkbox } from "@/components/ui/checkbox"

type Building = {
  _id: string
  name: string
  address: string
  totalUnits: number
  visitedUnits: number
  providers: string[]
  active: boolean
  completionRate: number
  lastUpdated: string
  status: "completed" | "in-progress"
  caretakerName: string
}

export const getColumns = (actions: { handleDelete: (buildingId: string) => void; handleEdit: (id: string) => void }): ColumnDef<Building>[] => [
  {
    id: "number",
    header: "#",
    cell: ({ row }) => row.index + 1,
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        onClick={(e) => e.stopPropagation()}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        onClick={(e) => e.stopPropagation()}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Building Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const building = row.original
      return (
        <Link href={`/units/${building._id}`} className="font-medium hover:underline">
          {building.name}
        </Link>
      )
    },
  },
  {
    accessorKey: "totalUnits",
    header: "Total Units",
  },
  {
    accessorKey: "visitedUnits",
    header: "Visited Units",
  },
  {
    id: "notVisitedUnits",
    header: "Not Visited Units",
    cell: ({ row }) => {
      const totalUnits = row.original.totalUnits;
      const visitedUnits = row.original.visitedUnits;
      return totalUnits - visitedUnits;
    },
  },
  {
    accessorKey: "caretakerName",
    header: "Caretaker Name",
  },
  {
    accessorKey: "completionRate",
    header: "Completion Rate",
    cell: ({ row }) => {
      const completionRate = parseFloat(row.getValue("completionRate"))
      return <div className="text-right font-medium">{completionRate}%</div>
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as Building["status"]
      const statusMap = {
        completed: { label: "Completed", color: "bg-green-100 text-green-800" },
        "in-progress": { label: "In Progress", color: "bg-blue-100 text-blue-800" },
      }
      const { label, color } = statusMap[status] || { label: "Unknown", color: "bg-gray-100 text-gray-800" }
      return <Badge className={color}>{label}</Badge>
    },
  },
  {
    accessorKey: "lastUpdated",
    header: "Last Updated",
    cell: ({ row }) => {
      const date = new Date(row.getValue("lastUpdated"))
      return date.toLocaleDateString()
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const building = row.original

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
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(building._id)}
            >
              Copy Building ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild onClick={(e) => e.stopPropagation()}>
              <Link href={`/units/${building._id}`} className="w-full block">View Building Units</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>View Building Details</DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => { e.stopPropagation(); actions.handleEdit(building._id); }}
            >
              Edit Building
            </DropdownMenuItem>
            {actions.handleDelete && (
              <DropdownMenuItem className="text-red-600" onClick={(e) => { e.stopPropagation(); actions.handleDelete(building._id); }}>
                Delete Building
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]