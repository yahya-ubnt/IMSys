'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Transaction } from './page'; // Import the Transaction type from the page component

// Function to mask the MSISDN (phone number)
const maskMsisdn = (msisdn: string) => {
  if (msisdn.length > 7) {
    return `${msisdn.substring(0, 4)}****${msisdn.substring(msisdn.length - 3)}`;
  }
  return msisdn;
};

export const getColumns = (): ColumnDef<Transaction>[] => [
  {
    id: 'serialNumber',
    header: 'S/N',
    cell: ({ row }) => row.index + 1,
  },
  {
    accessorKey: 'officialName',
    header: 'Name',
  },
  {
    accessorKey: 'transactionId',
    header: 'Transaction ID',
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
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
    header: 'Ref Number',
  },
  {
    accessorKey: 'msisdn',
    header: 'MSISDN',
    cell: ({ row }) => maskMsisdn(row.getValue('msisdn')),
  },
  {
    accessorKey: 'transactionDate',
    header: 'Time',
    cell: ({ row }) => {
      return new Date(row.getValue('transactionDate')).toLocaleString();
    },
  },
  {
    accessorKey: 'balance',
    header: 'Balance',
    cell: ({ row }) => {
      const balance = row.getValue('balance');
      return balance !== null && balance !== undefined ? balance : 'N/A';
    },
  },
];
