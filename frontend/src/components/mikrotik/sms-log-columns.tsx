import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Clock, RefreshCw } from 'lucide-react';
import { StatusBadge } from './SmsTab'; // Assuming StatusBadge is exported from SmsTab

export interface SmsLog {
  _id: string;
  message: string;
  messageType: string;
  smsStatus: 'Success' | 'Failed' | 'Pending' | 'RequiresManualIntervention';
  createdAt: string;
}

export const getColumns = (handleRetry: (logId: string) => Promise<void>, retryingId: string | null): ColumnDef<SmsLog>[] => [
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Date
      </Button>
    ),
    cell: ({ row }) => <div className="whitespace-nowrap text-zinc-400">{format(new Date(row.original.createdAt), 'PPpp')}</div>,
  },
  {
    accessorKey: 'messageType',
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Type
      </Button>
    ),
    cell: ({ row }) => <div className="font-semibold text-zinc-300">{row.original.messageType}</div>,
  },
  {
    accessorKey: 'message',
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Message
      </Button>
    ),
    cell: ({ row }) => <div className="text-sm text-zinc-400 max-w-md truncate">{row.original.message}</div>,
  },
  {
    accessorKey: 'smsStatus',
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Status
      </Button>
    ),
    cell: ({ row }) => <div className="text-right"><StatusBadge status={row.original.smsStatus} /></div>,
  },
  {
    id: 'actions',
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => (
      <div className="text-right">
        {row.original.smsStatus === 'RequiresManualIntervention' && (
          <Button
            size="sm"
            variant="outline"
            className="border-cyan-400 text-cyan-400 hover:bg-cyan-400/10 hover:text-cyan-300"
            onClick={() => handleRetry(row.original._id)}
            disabled={retryingId === row.original._id}
          >
            {retryingId === row.original._id ? (
              <Clock className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
    ),
  },
];
