'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/components/auth-provider';
import { DataTable } from '@/components/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';

interface FirewallRule {
  '.id': string;
  chain: 'input' | 'forward' | 'output';
  action: 'accept' | 'drop' | 'reject' | 'jump';
  protocol: string;
  'src-address'?: string;
  'dst-address'?: string;
  disabled: 'true' | 'false';
}

export function FirewallRulesTable({ routerId }: { routerId: string }) {
  const [rules, setRules] = useState<FirewallRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const columns: ColumnDef<FirewallRule>[] = useMemo(
    () => [
      {
        accessorKey: 'chain',
        header: 'Chain',
        cell: ({ row }) => <Badge variant="secondary">{row.original.chain}</Badge>,
      },
      {
        accessorKey: 'action',
        header: 'Action',
        cell: ({ row }) => <Badge variant="secondary">{row.original.action}</Badge>,
      },
      {
        accessorKey: 'protocol',
        header: 'Protocol',
      },
      {
        accessorKey: 'src-address',
        header: 'Src. Address',
      },
      {
        accessorKey: 'dst-address',
        header: 'Dst. Address',
      },
      {
        accessorKey: 'disabled',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant="secondary">
            {row.original.disabled === 'true' ? 'Disabled' : 'Enabled'}
          </Badge>
        ),
      },
    ],
    []
  );

  useEffect(() => {
    if (!routerId || !token) return;

    const fetchFirewallRules = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/routers/${routerId}/dashboard/firewall/filter`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to fetch firewall rules');
        const data = await response.json();
        setRules(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchFirewallRules();
  }, [routerId, token]);

  if (loading) {
    return <div className="text-center text-zinc-400">Loading firewall rules...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">Error: {error}</div>;
  }

  return (
    <DataTable
      columns={columns}
      data={rules}
      filterColumn="chain"
      paginationEnabled={false}
      tableClassName="[&_tr]:border-zinc-800"
      headerClassName="[&_th]:text-zinc-400"
      rowClassName="hover:bg-zinc-800/50"
    />
  );
}