'use client';

import { useEffect, useState, useMemo, useCallback } from 'react'; // Added useMemo, useCallback
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { DataTable } from '@/components/data-table'; // Import DataTable
import { ColumnDef } from '@tanstack/react-table'; // Import ColumnDef

interface ActiveSession {
  '.id': string;
  name: string;
  service: string;
  'caller-id': string;
  address: string;
  uptime: string;
}

export function PppoeActiveTable({ routerId }: { routerId: string }) {
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const fetchActiveSessions = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(`/api/routers/${routerId}/dashboard/pppoe/active`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch active sessions');
      }
      const data = await response.json();
      setSessions(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    }
  }, [token, routerId, setSessions, setError]);

  useEffect(() => {
    if (!routerId || !token) return;

    const loadInitialData = async () => {
        setLoading(true);
        await fetchActiveSessions();
        setLoading(false);
    }

    loadInitialData();
    const intervalId = setInterval(fetchActiveSessions, 5000); // Poll every 5 seconds

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [routerId, token, fetchActiveSessions]);

  const handleDisconnect = useCallback(async (sessionId: string) => {
    if (!window.confirm('Are you sure you want to disconnect this session?')) {
      return;
    }
    if (!token) return;
    try {
      const response = await fetch(`/api/routers/${routerId}/dashboard/pppoe/active/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ id: sessionId }),
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect user');
      }
      fetchActiveSessions();
    } catch (err) {
      if (err instanceof Error) {
        alert(`Error: ${err.message}`);
      } else {
        alert('Error: An unknown error occurred');
      }
    }
  }, [token, routerId, fetchActiveSessions]);

  // Define columns for the DataTable
  const columns: ColumnDef<ActiveSession>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'User',
      },
      {
        accessorKey: 'service',
        header: 'Service',
      },
      {
        accessorKey: 'address',
        header: 'IP Address',
      },
      {
        accessorKey: 'caller-id',
        header: 'MAC Address',
      },
      {
        accessorKey: 'uptime',
        header: 'Uptime',
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <Button
            variant="destructive"
            size="icon"
            onClick={() => handleDisconnect(row.original['.id'])}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ),
      },
    ],
    [handleDisconnect]
  );

  if (loading) {
    return <div>Loading active sessions...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <DataTable
      columns={columns}
      data={sessions}
      filterColumn="name" // Allow filtering by user name
      className="text-lg [&_td]:p-2 [&_th]:p-2" // Apply styling
      pageSizeOptions={[25, 50, 100, sessions.length]} // Add page size options
    />
  );
}
