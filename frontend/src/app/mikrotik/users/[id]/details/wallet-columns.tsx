'use client';

import { ColumnDef } from '@tanstack/react-table';

export interface WalletTransaction {
  _id: string;
  transactionId: string;
  type: 'Credit' | 'Debit' | 'Adjustment';
  amount: number;
  source: string;
  balanceAfter: number;
  comment?: string;
  createdAt: string;
}

export const columns: ColumnDef<WalletTransaction>[] = [
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
