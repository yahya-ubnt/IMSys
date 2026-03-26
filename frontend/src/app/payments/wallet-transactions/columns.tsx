import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button'; // Import Button component
import { WalletTransaction } from './page'; // Import the WalletTransaction type from the page component

export const getColumns = (): ColumnDef<WalletTransaction>[] => [
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
    accessorKey: 'userId.officialName',
    header: ({ column }) => (
      <Button variant="ghost">
        User
      </Button>
    ),
    cell: ({ row }) => row.original.userId?.officialName || 'N/A',
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
    filterFn: 'equalsString',
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
    filterFn: (row, columnId, filterValue) => {
        const date = new Date(row.getValue(columnId));
        const { from, to } = filterValue as { from?: Date, to?: Date };
        if (from && !to) {
            return date >= from;
        } else if (!from && to) {
            const toDate = new Date(to);
            toDate.setHours(23, 59, 59, 999); // Include the whole 'to' day
            return date <= toDate;
        } else if (from && to) {
            const toDate = new Date(to);
            toDate.setHours(23, 59, 59, 999); // Include the whole 'to' day
            return date >= from && date <= toDate;
        }
        return true;
    }
  },
  {
    accessorKey: 'comment',
    header: ({ column }) => (
      <Button variant="ghost">
        Comment
      </Button>
    ),
    cell: ({ row }) => <div className="truncate max-w-xs">{row.original.comment || '-'}</div>,
  }
];
