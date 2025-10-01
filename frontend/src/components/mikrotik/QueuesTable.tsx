'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { QueueFormModal } from './QueueFormModal';
import { DataTable } from '@/components/data-table'; // Import DataTable
import { ColumnDef } from '@tanstack/react-table'; // Import ColumnDef
import { Edit, Trash2 } from 'lucide-react'; // Import icons

interface Queue {
  '.id': string;
  name: string;
  target: string;
  'max-limit': string;
  rate?: string; // Made optional as it might not always be present in the initial fetch
  'burst-limit'?: string;
  'burst-threshold'?: string;
  'burst-time'?: string;
  priority?: string;
  parent?: string;
  comment?: string;
  'limit-at'?: string;
  disabled: boolean; // Keep as boolean for internal component state
}

// Helper function to format rate
const formatRate = (rate: string) => {
  const [upload, download] = rate.split('/').map(Number);
  const format = (value: number) => {
    if (isNaN(value) || value === 0) return '0bps';
    const units = ['bps', 'Kbps', 'Mbps', 'Gbps'];
    const i = Math.floor(Math.log(value) / Math.log(1000));
    // Directly return the string from toFixed(1)
    return `${(value / Math.pow(1000, i)).toFixed(1)}${units[i]}`;
  };
  return `${format(upload)} / ${format(download)}`;
};

export function QueuesTable({ routerId }: { routerId: string }) {
  const [queues, setQueues] = useState<Queue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQueue, setEditingQueue] = useState<Queue | undefined>(undefined);

  const fetchQueues = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(`/api/routers/${routerId}/dashboard/queues`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch queues');
      }
      const data = await response.json();
      setQueues(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    }
  }, [token, routerId, setQueues, setError]);

  useEffect(() => {
    if (!routerId || !token) return;

    const loadInitialData = async () => {
        setLoading(true);
        await fetchQueues();
        setLoading(false);
    }

    loadInitialData();
    const intervalId = setInterval(fetchQueues, 5000); // Poll every 5 seconds

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [routerId, token, fetchQueues]);

  const handleEditQueue = useCallback((queue: Queue) => {
    setEditingQueue(queue);
    setIsModalOpen(true);
  }, [setEditingQueue, setIsModalOpen]);

  const handleAddQueue = () => {
    setEditingQueue(undefined);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingQueue(undefined);
  };

  const handleDeleteQueue = useCallback(async (queueId: string) => {
    if (!window.confirm('Are you sure you want to delete this queue?')) {
      return;
    }
    try {
      const response = await fetch(`/api/routers/${routerId}/dashboard/queues/${queueId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to delete queue');
      }
      fetchQueues();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    }
  }, [token, routerId, fetchQueues, setError]);

  // Define columns for the DataTable
  const columns: ColumnDef<Queue>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
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
        cell: ({ row }) => (row.original.disabled ? 'Disabled' : 'Enabled'),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleEditQueue(row.original)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              size="icon"
              onClick={() => handleDeleteQueue(row.original['.id'])}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [handleDeleteQueue, handleEditQueue]
  );

  if (loading) {
    return <div>Loading queues...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="space-y-4">
      <Button onClick={handleAddQueue} className="mb-4">
        Add New Queue
      </Button>
      <DataTable
        columns={columns}
        data={queues}
        filterColumn="name" // Allow filtering by queue name
        className="text-lg [&_td]:p-2 [&_th]:p-2" // Apply styling
        pageSizeOptions={[25, 50, 100, queues.length]} // Add page size options
      />

      <QueueFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        queue={editingQueue ? {
          ...editingQueue,
          disabled: editingQueue.disabled ? 'yes' : 'no',
          'burst-limit': editingQueue['burst-limit'] || '',
          'burst-threshold': editingQueue['burst-threshold'] || '',
          'burst-time': editingQueue['burst-time'] || '',
          priority: editingQueue.priority || '',
          parent: editingQueue.parent || '',
          comment: editingQueue.comment || '',
          'limit-at': editingQueue['limit-at'] || '',
        } : undefined}
        routerId={routerId}
        onSuccess={fetchQueues}
      />
    </div>
  );
}