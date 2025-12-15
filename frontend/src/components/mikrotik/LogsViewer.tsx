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

import { Badge } from '@/components/ui/badge';

interface LogEntry {
  '.id': string;
  time: string;
  topics: string;
  message: string;
}

const getTopicBadge = (topic: string) => {
  const topics = topic.split(',');
  return topics.map((t, index) => (
    <Badge key={index} variant="secondary" className="mr-1">{t}</Badge>
  ));
};

export function LogsViewer({ routerId }: { routerId: string }) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const fetchLogs = useCallback(async () => {
    try {
      const response = await fetch(`/api/routers/${routerId}/dashboard/logs`);
      if (!response.ok) throw new Error('Failed to fetch logs');
      const data = await response.json();
      setLogs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  }, [routerId]);

  useEffect(() => {
    if (!routerId) return;
    setLoading(true);
    fetchLogs().finally(() => setLoading(false));
    const intervalId = setInterval(fetchLogs, 5000);
    return () => clearInterval(intervalId);
  }, [routerId, fetchLogs]);

  useEffect(() => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTop = tableContainerRef.current.scrollHeight;
    }
  }, [logs]);

  if (loading) {
    return <div className="text-center text-zinc-400">Loading logs...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">Error: {error}</div>;
  }

  return (
    <div ref={tableContainerRef} className="max-h-[60vh] overflow-y-auto">
      <Table>
        <TableHeader className="sticky top-0 bg-zinc-900/50 backdrop-blur-lg">
          <TableRow className="[&_th]:text-zinc-400 border-zinc-800">
            <TableHead className="w-[150px]">Time</TableHead>
            <TableHead className="w-[200px]">Topics</TableHead>
            <TableHead>Message</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log['.id']} className="hover:bg-zinc-800/50 border-zinc-800">
              <TableCell className="font-mono text-xs">{log.time}</TableCell>
              <TableCell>{getTopicBadge(log.topics)}</TableCell>
              <TableCell className="font-mono text-xs">{log.message}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}