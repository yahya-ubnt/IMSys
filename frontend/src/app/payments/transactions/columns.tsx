'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Transaction } from './page'; // Import the Transaction type from the page component
import { Button } from "@/components/ui/button"

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
    header: ({ column }) => (
      <Button variant="ghost">
        Name
      </Button>
    ),
  },
  {
    accessorKey: 'transactionId',
    header: ({ column }) => (
      <Button variant="ghost">
        Transaction ID
      </Button>
    ),
  },
  {
    accessorKey: 'amount',
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
    header: ({ column }) => (
      <Button variant="ghost">
        Ref Number
      </Button>
    ),
  },
  {
    accessorKey: 'msisdn',
    header: ({ column }) => (
      <Button variant="ghost">
        MSISDN
      </Button>
    ),
    cell: ({ row }) => maskMsisdn(row.getValue('msisdn')),
  },
  {
    accessorKey: 'transactionDate',
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
];

