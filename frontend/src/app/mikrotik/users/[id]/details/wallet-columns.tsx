import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button'; // Import Button component

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
    id: 'serialNumber',
    header: ({ column }) => (
      <Button variant="ghost">
        S/N
      </Button>
    ),
    cell: ({ row }) => row.index + 1,
  },
  {
    accessorKey: 'transactionId',
    header: ({ column }) => (
      <Button variant="ghost">
        Transaction ID
      </Button>
    ),
    cell: ({ row }) => <div className="truncate max-w-xs">{row.original.transactionId}</div>,
  },
  {
    accessorKey: 'type',
    header: ({ column }) => (
      <Button variant="ghost">
        Type
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
    accessorKey: 'source',
    header: ({ column }) => (
      <Button variant="ghost">
        Source/Reason
      </Button>
    ),
    cell: ({ row }) => <div className="truncate max-w-xs">{row.original.source}</div>,
  },
  {
    accessorKey: 'balanceAfter',
    header: ({ column }) => (
      <Button variant="ghost">
        Balance After
      </Button>
    ),
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
    header: ({ column }) => (
      <Button variant="ghost">
        Date/Time
      </Button>
    ),
    cell: ({ row }) => {
      return new Date(row.getValue('createdAt')).toLocaleString();
    },
  },
  {
    accessorKey: 'comment',
    header: ({ column }) => (
      <Button variant="ghost">
        Comment
      </Button>
    ),
    cell: ({ row }) => <div className="truncate max-w-xs">{row.original.comment || '-'}</div>,
  },
];
