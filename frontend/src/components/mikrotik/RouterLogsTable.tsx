'use client';

import { useEffect, useState, useMemo } from 'react'; // Added useMemo
import { useAuth } from '@/components/auth-provider';
import { DataTable } from '@/components/data-table'; // Import DataTable
import { ColumnDef } from '@tanstack/react-table'; // Import ColumnDef
import { RouterLog } from '@/types/mikrotik'; // Assuming RouterLog is correctly defined here

interface RouterLogsTableProps {
  id: string;
}

export function RouterLogsTable({ id }: RouterLogsTableProps) {
  const [logs, setLogs] = useState<RouterLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Define columns for the DataTable
  const columns: ColumnDef<RouterLog>[] = useMemo(
    () => [
      {
        accessorKey: 'time',
        header: 'Time',
      },
      {
        accessorKey: 'topics',
        header: 'Topics',
      },
      {
        accessorKey: 'message',
        header: 'Message',
      },
    ],
    []
  );

  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/mikrotik/routers/${id}/dashboard/logs`);
        if (!response.ok) {
          throw new Error('Failed to fetch router logs');
        }
        const data: RouterLog[] = await response.json();
        setLogs(data);
      } catch (err: unknown) {
        setError((err instanceof Error) ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [id]);

  if (isLoading && logs.length === 0) {
    return <p>Loading logs...</p>;
  }

  if (error) {
    return <p className="text-red-500">Error: {error}</p>;
  }

  return (
    <DataTable
      columns={columns}
      data={logs}
      filterColumn="message" // Allow filtering by message
      className="text-xl [&_td]:px-4 [&_th]:px-4 [&_td]:py-2 [&_th]:py-2" // Apply styling with larger font size and more padding
      pageSizeOptions={[25, 50, 100, logs.length]} // Add page size options
    />
  );
}
