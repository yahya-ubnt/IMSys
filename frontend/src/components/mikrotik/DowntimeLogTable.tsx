"use client"

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/components/auth-provider';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { History, CheckCircle } from "lucide-react";
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";


// --- Interface Definitions ---
interface DowntimeLog {
  _id: string;
  downStartTime: string;
  downEndTime?: string;
  durationSeconds?: number;
}

interface DowntimeLogTableProps {
  userId: string;
}

// --- Helper Functions ---
const formatDuration = (totalSeconds: number | undefined): string => {
    if (totalSeconds === undefined || totalSeconds < 0) return "Ongoing";
    if (totalSeconds === 0) return "0s";
  
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);
  
    const hDisplay = h > 0 ? h + "h " : "";
    const mDisplay = m > 0 ? m + "m " : "";
    const sDisplay = s > 0 ? s + "s" : "";
  
    return hDisplay + mDisplay + sDisplay || "0s";
};

// --- Main Component ---
export default function DowntimeLogTable({ userId }: DowntimeLogTableProps) {
  const [logs, setLogs] = useState<DowntimeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    const fetchDowntimeLogs = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const response = await fetch(`/api/mikrotik/users/${userId}/downtime-logs`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          setLogs((await response.json()).sort((a: DowntimeLog, b: DowntimeLog) => new Date(b.downStartTime).getTime() - new Date(a.downStartTime).getTime()));
        }
      } catch (error) {
        console.error('Failed to fetch downtime logs:', error);
      }
      setLoading(false);
    };
    fetchDowntimeLogs();
  }, [userId, token]);

  const totalDowntime = useMemo(() => {
    return logs.reduce((acc, log) => acc + (log.durationSeconds || 0), 0);
  }, [logs]);

  const renderLogList = () => {
    if (logs.length === 0) {
      return (
        <div className="text-center h-60 flex flex-col justify-center">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500/30" />
          <h3 className="mt-2 text-lg font-medium text-zinc-300">Perfect Uptime</h3>
          <p className="mt-1 text-sm text-zinc-500">No downtime has been recorded for this user.</p>
        </div>
      );
    }

    return (
      <div className="h-60 overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Start Time</TableHead>
              <TableHead>End Time</TableHead>
              <TableHead className="text-right">Duration</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log._id}>
                <TableCell>
                  <Badge variant={log.downEndTime ? 'success' : 'destructive'}>
                    {log.downEndTime ? 'Up' : 'Down'}
                  </Badge>
                </TableCell>
                <TableCell>{format(new Date(log.downStartTime), 'MMM d, yyyy p')}</TableCell>
                <TableCell>{log.downEndTime ? format(new Date(log.downEndTime), 'MMM d, yyyy p') : 'Now'}</TableCell>
                <TableCell className="text-right">{formatDuration(log.durationSeconds)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <Card className="bg-zinc-900/50 backdrop-blur-lg border-zinc-700 shadow-2xl shadow-blue-500/10 rounded-xl flex flex-col h-full">
      <CardHeader className="border-b border-zinc-800 p-3">
        <CardTitle className="text-base text-cyan-400 flex items-center"><History className="mr-2 h-5 w-5" />Downtime History</CardTitle>
        <div className="flex justify-between items-center text-xs text-zinc-400 pt-2">
            <span>{logs.length} outages recorded</span>
            <span>Total: {formatDuration(totalDowntime)}</span>
        </div>
      </CardHeader>
      <CardContent className="p-3">
        {loading ? <p className="text-center text-zinc-400">Loading history...</p> : renderLogList()}
      </CardContent>
    </Card>
  );
}