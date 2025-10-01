'use client';

import { useEffect, useState, useMemo } from 'react'; // Added useMemo
import { useAuth } from '@/components/auth-provider';
import { DataTable } from '@/components/data-table'; // Import DataTable
import { ColumnDef } from '@tanstack/react-table'; // Import ColumnDef

interface FirewallRule {
  '.id': string;
  chain: string;
  action: string;
  protocol: string;
  'src-address': string;
  'dst-address': string;
}

export function FirewallRulesTable({ routerId }: { routerId: string }) {
  const [rules, setRules] = useState<FirewallRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  // Define columns for the DataTable
  const columns: ColumnDef<FirewallRule>[] = useMemo(
    () => [
      {
        accessorFn: (row, index) => index, // Accessor for row index
        header: '#',
        id: 'row-index', // Unique ID for the column
      },
      {
        accessorKey: 'chain',
        header: 'Chain',
      },
      {
        accessorKey: 'action',
        header: 'Action',
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
    ],
    []
  );

  useEffect(() => {
    if (!routerId || !token) return;

    const fetchFirewallRules = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/routers/${routerId}/dashboard/firewall/filter`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch firewall rules');
        }
        const data = await response.json();
        setRules(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchFirewallRules();
  }, [routerId, token]);

  if (loading) {
    return <div>Loading firewall rules...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <DataTable
      columns={columns}
      data={rules}
      filterColumn="chain" // Allow filtering by chain
      className="text-lg [&_td]:p-2 [&_th]:p-2" // Apply styling
      pageSizeOptions={[25, 50, 100, rules.length]} // Add page size options
    />
  );
}
