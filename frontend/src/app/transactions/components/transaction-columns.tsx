
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, ArrowUpDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import Link from 'next/link';




// Define a common interface for properties used in columns
export interface CommonTransaction {
  _id: string;
  transactionId?: string;
  transactionDate: string;
  transactionTime?: string;
  amount: number;
  receiverEntity?: string;
  phoneNumber?: string;
  method: string;
  label: string;
  createdAt: string;
}

export const getTransactionColumns = <T extends CommonTransaction>(onDelete: (id: string) => void, category: string): ColumnDef<T>[] => [
  {
    id: "number",
    header: "#",
    cell: ({ row }) => row.index + 1,
    enableSorting: false,
    enableHiding: false,
    size: 5,
  },
  {
    accessorKey: 'transactionId',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Transaction ID
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    size: 70,
  },
  {
    accessorKey: 'transactionDate',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = new Date(row.original.transactionDate);
      return date.toLocaleDateString();
    },
    size: 60,
  },
  {
    accessorKey: 'transactionTime',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Time
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    size: 50,
  },
  {
    accessorKey: 'amount',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Amount
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const amount = row.original.amount;
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'KES',
      }).format(amount);
    },
    size: 60,
  },
  {
    accessorKey: 'receiverEntity',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Receiver/Entity
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    size: 100,
  },
  {
    accessorKey: 'phoneNumber',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Phone Number
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    size: 80,
  },
  {
    accessorKey: 'method',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Method
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    size: 50,
  },
  {
    accessorKey: 'label',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Label
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    size: 70,
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Created At
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = new Date(row.original.createdAt);
      return date.toLocaleString();
    },
    size: 75,
  },
  {
    id: "actions",
    header: () => <span className="font-bold">Actions</span>, // Simple string header, no sorting
    cell: ({ row }) => {
      const transaction = row.original;

      const handleDelete = () => {
        if (confirm(`Are you sure you want to delete this transaction?`)) {
          onDelete(transaction._id); // Call the passed onDelete function
        }
      };

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-9 w-9 p-0 text-primary hover:bg-primary/10">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/transactions/${transaction._id}?category=${category}`}>View Details</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/transactions/${transaction._id}/edit?category=${category}`}>Edit</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDelete} className="text-red-600">
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    size: 15,
  },
];
