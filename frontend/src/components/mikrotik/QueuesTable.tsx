'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { QueueFormModal } from './QueueFormModal';
import { DataTable } from '@/components/data-table';
import { useReactTable, getCoreRowModel, ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';

interface Queue {
  '.id': string;
  name: string;
  target: string;
  'max-limit': string;
  rate?: string;
  'burst-limit'?: string;
  'burst-threshold'?: string;
  'burst-time'?: string;
  priority?: string;
  parent?: string;
  comment?: string;
  'limit-at'?: string;
  disabled: 'yes' | 'no';
}

// Helper function to format rate
const formatRate = (rate: string) => {
  if (!rate) return '0bps / 0bps';
  const [upload, download] = rate.split('/').map(Number);
  const format = (value: number) => {
    if (isNaN(value) || value === 0) return '0bps';
    const units = ['bps', 'Kbps', 'Mbps', 'Gbps'];
    const i = Math.floor(Math.log(value) / Math.log(1000));
    return `${(value / Math.pow(1000, i)).toFixed(1)}${units[i]}`;
  };
  return `${format(upload)} / ${format(download)}`;
};

export function QueuesTable({ routerId }: { routerId: string }) {
  const [queues, setQueues] = useState<Queue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQueue, setEditingQueue] = useState<Queue | undefined>(undefined);

  const fetchQueues = useCallback(async () => {
    try {
      const response = await fetch(`/api/routers/${routerId}/dashboard/queues`);
      if (!response.ok) throw new Error('Failed to fetch queues');
      const data = await response.json();
      setQueues(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  }, [routerId]);

  useEffect(() => {
    if (!routerId) return;
    setLoading(true);
    fetchQueues().finally(() => setLoading(false));
    const intervalId = setInterval(fetchQueues, 5000);
    return () => clearInterval(intervalId);
  }, [routerId, fetchQueues]);

  const handleEditQueue = useCallback((queue: Queue) => {
    setEditingQueue(queue);
    setIsModalOpen(true);
  }, []);

  const handleAddQueue = () => {
    setEditingQueue(undefined);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingQueue(undefined);
  };

  const handleDeleteQueue = useCallback(async (queueId: string) => {
    if (!window.confirm('Are you sure you want to delete this queue?')) return;
    try {
      const response = await fetch(`/api/routers/${routerId}/dashboard/queues/${queueId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete queue');
      fetchQueues();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  }, [routerId, fetchQueues]);

  const columns: ColumnDef<Queue>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => <span className="font-medium text-white">{row.original.name}</span>,
      },
      {
        accessorKey: 'target',
        header: 'Target',
      },
      {
        accessorKey: 'max-limit',
        header: 'Max Limit',
        cell: ({ row }) => formatRate(row.original['max-limit']),
      },
      {
        accessorKey: 'rate',
        header: 'Current Rate',
        cell: ({ row }) => formatRate(row.original.rate || ''),
      },
      {
        accessorKey: 'disabled',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={row.original.disabled === 'yes' ? 'secondary' : 'default'}>
            {row.original.disabled === 'yes' ? 'Disabled' : 'Enabled'}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
          <div className="text-right space-x-2">
            <Button variant="ghost" size="icon" onClick={() => handleEditQueue(row.original)}>
              <Edit className="h-4 w-4 text-zinc-400 hover:text-blue-500" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => handleDeleteQueue(row.original['.id'])}>
              <Trash2 className="h-4 w-4 text-zinc-400 hover:text-red-500" />
            </Button>
          </div>
        ),
      },
    ],
    [handleDeleteQueue, handleEditQueue]
  );

  const table = useReactTable({
    data: queues,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (loading) {
    return <div className="text-center text-zinc-400">Loading queues...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">Error: {error}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button 
          onClick={handleAddQueue} 
          className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg transition-all duration-300 hover:scale-105"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Add New Queue
        </Button>
      </div>
      <DataTable
        table={table}
        columns={columns}
      />

      <QueueFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        queue={editingQueue ? {
          ...editingQueue,
          disabled: editingQueue.disabled,
          'burst-limit': editingQueue['burst-limit'] || '',
          'burst-threshold': editingQueue['burst-threshold'] || '',
          'burst-time': editingQueue['burst-time'] || '',
          priority: editingQueue.priority || '8',
          parent: editingQueue.parent || 'none',
          comment: editingQueue.comment || '',
          'limit-at': editingQueue['limit-at'] || '',
        } : undefined}
        routerId={routerId}
        onSuccess={fetchQueues}
      />
    </div>
  );
}