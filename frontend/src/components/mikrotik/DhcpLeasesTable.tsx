'use client';

import { useEffect, useState, useMemo, useCallback } from 'react'; // Added useMemo, useCallback
import { useAuth } from '@/components/auth-provider';
import { DataTable } from '@/components/data-table'; // Import DataTable
import { ColumnDef } from '@tanstack/react-table'; // Import ColumnDef

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
  const { token } = useAuth();

  const fetchLeases = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(`/api/routers/${routerId}/dashboard/dhcp-leases`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch DHCP leases');
      }
      const data = await response.json();
      setLeases(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    }
  }, [token, routerId, setLeases, setError]);

  // Define columns for the DataTable
  const columns: ColumnDef<DhcpLease>[] = useMemo(
    () => [
      {
        accessorKey: 'address',
        header: 'IP Address',
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
      },
    ],
    []
  );

  useEffect(() => {
    if (!routerId || !token) return;

    const loadInitialData = async () => {
        setLoading(true);
        await fetchLeases();
        setLoading(false);
    }

    loadInitialData();
    const intervalId = setInterval(fetchLeases, 10000); // Poll every 10 seconds

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [routerId, token, fetchLeases]);

  if (loading) {
    return <div>Loading DHCP leases...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <DataTable
      columns={columns}
      data={leases}
      filterColumn="address" // Allow filtering by IP address
      className="text-lg [&_td]:p-2 [&_th]:p-2" // Apply styling
      pageSizeOptions={[25, 50, 100, leases.length]} // Add page size options
    />
  );
}
