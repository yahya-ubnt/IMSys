'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { DataTable } from '@/components/data-table';
import { ColumnDef } from '@tanstack/react-table';

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

  const fetchActiveSessions = useCallback(async () => {
    try {
      const response = await fetch(`/api/routers/${routerId}/dashboard/pppoe/active`);
      if (!response.ok) throw new Error('Failed to fetch active sessions');
      const data = await response.json();
      setSessions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  }, [routerId]);

  useEffect(() => {
    if (!routerId) return;
    setLoading(true);
    fetchActiveSessions().finally(() => setLoading(false));
    const intervalId = setInterval(fetchActiveSessions, 5000);
    return () => clearInterval(intervalId);
  }, [routerId, fetchActiveSessions]);

  const handleDisconnect = useCallback(async (sessionId: string) => {
    if (!window.confirm('Are you sure you want to disconnect this session?')) return;
    try {
      const response = await fetch(`/api/routers/${routerId}/dashboard/pppoe/active/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: sessionId }),
      });
      if (!response.ok) throw new Error('Failed to disconnect user');
      fetchActiveSessions();
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'An unknown error occurred'}`);
    }
  }, [routerId, fetchActiveSessions]);

  const columns: ColumnDef<ActiveSession>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'User',
        cell: ({ row }) => <span className="font-medium text-white">{row.original.name}</span>,
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
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
          <div className="text-right">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDisconnect(row.original['.id'])}
            >
              <Trash2 className="h-4 w-4 text-zinc-400 hover:text-red-500" />
            </Button>
          </div>
        ),
      },
    ],
    [handleDisconnect]
  );

  if (loading) {
    return <div className="text-center text-zinc-400">Loading active sessions...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">Error: {error}</div>;
  }

  return (
    <DataTable
      columns={columns}
      data={sessions}
      filterColumn="name"
      paginationEnabled={false}
      tableClassName="[&_tr]:border-zinc-800"
      headerClassName="[&_th]:text-zinc-400"
      rowClassName="hover:bg-zinc-800/50"
    />
  );
}