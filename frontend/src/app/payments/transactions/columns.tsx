'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Transaction } from './page'; // Import the Transaction type from the page component
import { Button } from "@/components/ui/button"
import { MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"

// Function to mask the MSISDN (phone number)
const maskMsisdn = (msisdn: string) => {
  if (msisdn.length > 7) {
    return `${msisdn.substring(0, 4)}****${msisdn.substring(msisdn.length - 3)}`;
  }
  return msisdn;
};

export const getColumns = (): ColumnDef<Transaction>[] => [
  {
    accessorKey: 'officialName',
    id: "officialName", // Added unique ID
    header: ({ column }) => (
      <Button variant="ghost">
        Name
      </Button>
    ),
  },
  {
    accessorKey: 'transactionId',
    id: "transactionId", // Added unique ID
    header: ({ column }) => (
      <Button variant="ghost">
        Transaction ID
      </Button>
    ),
  },
  {
    accessorKey: 'amount',
    id: "amount", // Added unique ID
    header: ({ column }) => (
      <Button variant="ghost">
        Amount
      </Button>
    ),
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('amount'));
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'KES',
      }).format(amount);
      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: 'referenceNumber',
    id: "referenceNumber", // Added unique ID
    header: ({ column }) => (
      <Button variant="ghost">
        Ref Number
      </Button>
    ),
  },
  {
    accessorKey: 'msisdn',
    id: "msisdn", // Added unique ID
    header: ({ column }) => (
      <Button variant="ghost">
        MSISDN
      </Button>
    ),
    cell: ({ row }) => maskMsisdn(row.getValue('msisdn')),
  },
  {
    accessorKey: 'transactionDate',
    id: "transactionDate", // Added unique ID
    header: ({ column }) => (
      <Button variant="ghost">
        Time
      </Button>
    ),
    cell: ({ row }) => {
      return new Date(row.getValue('transactionDate')).toLocaleString();
    },
  },
  {
    accessorKey: 'balance',
    id: "balance", // Added unique ID
    header: ({ column }) => (
      <Button variant="ghost">
        Balance
      </Button>
    ),
    cell: ({ row }) => {
      const balance = row.getValue('balance');
      return balance !== null && balance !== undefined ? balance : 'N/A';
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const transaction = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-zinc-800 text-white border-zinc-700">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={`/payments/transactions/${transaction._id}`}>View Details</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

