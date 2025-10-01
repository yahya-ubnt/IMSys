'use client';

import { ColumnDef } from '@tanstack/react-table';
import { WalletTransaction } from './page'; // Import the WalletTransaction type from the page component

export const getColumns = (): ColumnDef<WalletTransaction>[] => [
  {
    id: 'serialNumber',
    header: 'S/N',
    cell: ({ row }) => row.index + 1,
  },
  {
    accessorKey: 'userId.officialName',
    header: 'User',
    cell: ({ row }) => row.original.userId?.officialName || 'N/A',
  },
  {
    accessorKey: 'transactionId',
    header: 'Transaction ID',
  },
  {
    accessorKey: 'type',
    header: 'Type',
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
    accessorKey: 'source',
    header: 'Source/Reason',
  },
  {
    accessorKey: 'balanceAfter',
    header: 'Balance After',
    cell: ({ row }) => {
      const balance = parseFloat(row.getValue('balanceAfter'));
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'KES',
      }).format(balance);
      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Date/Time',
    cell: ({ row }) => {
      return new Date(row.getValue('createdAt')).toLocaleString();
    },
  },
  {
    accessorKey: 'comment',
    header: 'Comment',
    cell: ({ row }) => row.getValue('comment') || '-',
  },
];
