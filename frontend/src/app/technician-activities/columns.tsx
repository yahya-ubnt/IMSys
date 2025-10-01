'use client';

import { ColumnDef } from '@tanstack/react-table';
import { TechnicianActivity } from '@/types/technician-activity';
import { MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export const columns = (onDelete: (id: string) => void): ColumnDef<TechnicianActivity>[] => [
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
    accessorKey: 'technician',
    header: 'Technician',
  },
  {
    accessorKey: 'activityType',
    header: 'Type',
    cell: ({ row }) => {
      const type = row.original.activityType;
      return (
        <Badge variant={type === 'Installation' ? 'default' : 'secondary'}>
          {type}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'clientName',
    header: 'Client Name',
  },
  {
    accessorKey: 'clientPhone',
    header: 'Client Phone',
  },
  {
    accessorKey: 'activityDate',
    header: 'Date',
    cell: ({ row }) => {
      const date = row.original.activityDate;
      return format(new Date(date), 'PPP');
    },
  },
  {
    accessorKey: 'description',
    header: 'Description',
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) => {
      const activity = row.original;

      const handleDelete = () => {
        if (confirm(`Are you sure you want to delete this activity?`)) {
          onDelete(activity._id); // Call the passed onDelete function
        }
      };

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={`/technician-activities/${activity._id}`}>View Details</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/technician-activities/${activity._id}/edit`}>Edit</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDelete} className="text-red-600">
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];