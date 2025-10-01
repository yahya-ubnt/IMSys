'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/components/auth-provider';

interface LogEntry {
  '.id': string;
  time: string;
  topics: string;
  message: string;
}

export function LogsViewer({ routerId }: { routerId: string }) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const { token } = useAuth();

  const fetchLogs = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(`/api/routers/${routerId}/dashboard/logs`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch logs');
      }
      const data = await response.json();
      setLogs(data.reverse()); // Reverse to show latest logs at the bottom
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    }
  }, [token, routerId, setLogs, setError]);

  useEffect(() => {
    if (!routerId || !token) return;

    const loadInitialData = async () => {
        setLoading(true);
        await fetchLogs();
        setLoading(false);
    }

    loadInitialData();
    const intervalId = setInterval(fetchLogs, 5000); // Poll every 5 seconds

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [routerId, token, fetchLogs]);

  useEffect(() => {
    // Scroll to the bottom of the table when new logs are added
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTop = tableContainerRef.current.scrollHeight;
    }
  }, [logs]);

  if (loading) {
    return <div>Loading logs...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div ref={tableContainerRef} className="max-h-96 overflow-y-auto">
        <Table>
        <TableHeader>
            <TableRow>
            <TableHead>Time</TableHead>
            <TableHead>Topics</TableHead>
            <TableHead>Message</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {logs.map((log) => (
            <TableRow key={log['.id']}>
                <TableCell>{log.time}</TableCell>
                <TableCell>{log.topics}</TableCell>
                <TableCell>{log.message}</TableCell>
            </TableRow>
            ))}
        </TableBody>
        </Table>
    </div>
  );
}