'use client'

import { ColumnDef } from "@tanstack/react-table"
import { DowntimeLog } from "@/lib/deviceService"

const formatDuration = (seconds?: number) => {
  if (seconds === undefined || seconds === null) return 'N/A';
  if (seconds < 60) return `${seconds} sec`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

const formatDate = (dateString?: string) => {
  if (!dateString) return 'Ongoing';
  return new Date(dateString).toLocaleString();
};

export const columns: ColumnDef<DowntimeLog>[] = [
  {
    accessorKey: "downStartTime",
    header: "Start Time",
    cell: ({ row }) => formatDate(row.original.downStartTime),
  },
  {
    accessorKey: "downEndTime",
    header: "End Time",
    cell: ({ row }) => formatDate(row.original.downEndTime),
  },
  {
    accessorKey: "durationSeconds",
    header: "Duration",
    cell: ({ row }) => formatDuration(row.original.durationSeconds),
  },
];
