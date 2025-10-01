'use client';

import { useEffect, useState, useMemo, useRef } from 'react'; // Added useMemo, useRef
import { useAuth } from '@/components/auth-provider';
import { DataTable } from '@/components/data-table'; // Import DataTable
import { ColumnDef } from '@tanstack/react-table'; // Import ColumnDef

interface Interface {
  '.id': string;
  name: string;
  type: string;
  running: boolean;
  'rx-byte': string;
  'tx-byte': string;
}

export function InterfacesTable({ routerId }: { routerId: string }) {
  const [interfaces, setInterfaces] = useState<Interface[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();
  const isInitialMount = useRef(true);

  const formatBitrate = (bitsPerSecond: string) => {
    const value = parseInt(bitsPerSecond, 10);
    if (isNaN(value) || value === 0) return '0 bps';
    const units = ['bps', 'Kbps', 'Mbps', 'Gbps'];
    const i = Math.floor(Math.log(value) / Math.log(1024));
    return parseFloat((value / Math.pow(1024, i)).toFixed(2)) + ' ' + units[i];
  };

  // Define columns for the DataTable
  const columns: ColumnDef<Interface>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
      },
      {
        accessorKey: 'type',
        header: 'Type',
      },
      {
        accessorKey: 'running',
        header: 'Status',
        cell: ({ row }) => (row.original.running ? 'Running' : 'Stopped'),
      },
      {
        accessorKey: 'rx-byte',
        header: 'RX Rate',
        cell: ({ row }) => formatBitrate(row.original['rx-byte']),
        meta: {
          align: 'right', // Custom meta for right alignment
        },
      },
      {
        accessorKey: 'tx-byte',
        header: 'TX Rate',
        cell: ({ row }) => formatBitrate(row.original['tx-byte']),
        meta: {
          align: 'right', // Custom meta for right alignment
        },
      },
    ],
    []
  );

  useEffect(() => {
    if (!routerId || !token) return;

    const fetchInterfaces = async () => {
      try {
        // Only show loading on initial mount
        if (isInitialMount.current) {
          setLoading(true);
        }
        const response = await fetch(`/api/routers/${routerId}/dashboard/interfaces`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch interfaces');
        }
        const data = await response.json();
        setInterfaces(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred');
        }
      } finally {
        setLoading(false);
        isInitialMount.current = false; // Mark as not initial mount after first fetch
      }
    };

    fetchInterfaces(); // Initial fetch
    const intervalId = setInterval(fetchInterfaces, 3000); // Poll every 3 seconds

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [routerId, token]);

  if (loading) {
    return <div>Loading interfaces...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <DataTable
      columns={columns}
      data={interfaces}
      filterColumn="name" // Allow filtering by interface name
      className="text-lg [&_td]:p-2 [&_th]:p-2" // Adjust font size and padding
      pageSizeOptions={[25, 50, 100, interfaces.length]} // Add page size options
    />
  );
}