"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Device } from "@/lib/deviceService"
import { Badge } from "@/components/ui/badge"
import { ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"

export const connectedStationsColumns: ColumnDef<Device>[] = [
  {
    accessorKey: "deviceName",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Device Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const device = row.original
      return (
        <div className="font-medium">
          <a href={`/devices/${device._id}`} className="text-blue-400 hover:underline">
            {device.deviceName}
          </a>
        </div>
      )
    },
  },
  {
    accessorKey: "ipAddress",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          IP Address
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "macAddress",
    header: "MAC Address",
  },
  {
    accessorKey: "status",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      const statusVariant = status === "UP" ? "default" : "destructive"
      const statusClassName = status === "UP" ? "bg-green-600 text-white" : "bg-red-600 text-white"
      return <Badge variant={statusVariant} className={statusClassName}>{status}</Badge>
    },
  },
];
