import { useEffect, useState, useMemo, useRef } from 'react';
import { useAuth } from '@/components/auth-provider';
import { DataTable } from '@/components/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge'; // Import Badge

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
    let i = 0;
    let rate = value;
    while (rate >= 1024 && i < units.length - 1) {
      rate /= 1024;
      i++;
    }
    return `${rate.toFixed(2)} ${units[i]}`;
  };

  const columns: ColumnDef<Interface>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => <span className="font-medium text-white">{row.original.name}</span>,
      },
      {
        accessorKey: 'type',
        header: 'Type',
      },
      {
        accessorKey: 'running',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={row.original.running ? 'success' : 'secondary'}>
            {row.original.running ? 'Running' : 'Stopped'}
          </Badge>
        ),
      },
      {
        accessorKey: 'rx-byte',
        header: () => <div className="text-right">RX Rate</div>,
        cell: ({ row }) => <div className="text-right">{formatBitrate(row.original['rx-byte'])}</div>,
      },
      {
        accessorKey: 'tx-byte',
        header: () => <div className="text-right">TX Rate</div>,
        cell: ({ row }) => <div className="text-right">{formatBitrate(row.original['tx-byte'])}</div>,
      },
    ],
    []
  );

  useEffect(() => {
    if (!routerId || !token) return;

    const fetchInterfaces = async () => {
      try {
        if (isInitialMount.current) {
          setLoading(true);
        }
        const response = await fetch(`/api/routers/${routerId}/dashboard/interfaces`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch interfaces');
        }
        const data = await response.json();
        setInterfaces(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
        isInitialMount.current = false;
      }
    };

    fetchInterfaces();
    const intervalId = setInterval(fetchInterfaces, 3000);

    return () => clearInterval(intervalId);
  }, [routerId, token]);

  if (loading) {
    return <div className="text-center text-zinc-400">Loading interfaces...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">Error: {error}</div>;
  }

  return (
    <DataTable
      columns={columns}
      data={interfaces}
      filterColumn="name"
      paginationEnabled={false}
      tableClassName="[&_tr]:border-zinc-800"
      headerClassName="[&_th]:text-zinc-400"
      rowClassName="hover:bg-zinc-800/50"
    />
  );
}