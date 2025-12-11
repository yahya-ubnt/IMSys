'use client';

import { useEffect, useState, useMemo, useCallback } from 'react'; // Added useMemo, useCallback
import { useAuth } from '@/components/auth-provider';
import { DataTable } from '@/components/data-table'; // Import DataTable
import { useReactTable, getCoreRowModel, ColumnDef } from '@tanstack/react-table'; // Import ColumnDef

import { Badge } from '@/components/ui/badge';

interface DhcpLease {
  '.id': string;
  address: string;
  'mac-address': string;
  'client-id': string;
  server: string;
  status: string;
}

export function DhcpLeasesTable({ routerId }: { routerId: string }) {
  const [leases, setLeases] = useState<DhcpLease[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const columns: ColumnDef<DhcpLease>[] = useMemo(
    () => [
      {
        accessorKey: 'address',
        header: 'IP Address',
        cell: ({ row }) => <span className="font-medium text-white">{row.original.address}</span>,
      },
      {
        accessorKey: 'mac-address',
        header: 'MAC Address',
      },
      {
        accessorKey: 'client-id',
        header: 'Client ID',
      },
      {
        accessorKey: 'server',
        header: 'Server',
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={row.original.status === 'bound' ? 'default' : 'secondary'}>
            {row.original.status}
          </Badge>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: leases,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const fetchLeases = useCallback(async () => {
    try {
      const response = await fetch(`/api/routers/${routerId}/dashboard/dhcp-leases`);
      if (!response.ok) throw new Error('Failed to fetch DHCP leases');
      const data = await response.json();
      setLeases(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  }, [routerId]);

  useEffect(() => {
    if (!routerId) return;
    setLoading(true);
    fetchLeases().finally(() => setLoading(false));
    const intervalId = setInterval(fetchLeases, 10000);
    return () => clearInterval(intervalId);
  }, [routerId, fetchLeases]);

  if (loading) {
    return <div className="text-center text-zinc-400">Loading DHCP leases...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">Error: {error}</div>;
  }

  return (
    <DataTable
      table={table}
      columns={columns}
    />
  );
}
