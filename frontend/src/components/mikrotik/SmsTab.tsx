"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { MessageSquare, CheckCircle, XCircle, Clock, Mail, Bell, RefreshCw } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { retrySms } from '@/lib/api/sms';

// --- Interface Definitions ---
interface SmsLog {
  _id: string;
  message: string;
  messageType: string;
  smsStatus: 'Success' | 'Failed' | 'Pending' | 'RequiresManualIntervention';
  createdAt: string;
}

interface SmsStats {
  total: number;
  acknowledgement: number;
  expiry: number;
  composed: number;
  system: number;
}

interface SmsTabProps {
  smsData: {
    logs: SmsLog[];
    stats: SmsStats;
  } | null;
  onRefresh: () => void; // Callback to refresh data
}

// --- Sub-components ---
const StatCard = ({ title, value, icon: Icon, color = "text-white" }: { title: string; value: string | number; icon: React.ElementType; color?: string }) => (
  <div className="bg-zinc-800/50 p-3 rounded-lg flex items-center gap-4">
    <div className={`p-2 bg-zinc-700 rounded-md ${color}`}><Icon className="h-5 w-5" /></div>
    <div>
      <p className="text-xs text-zinc-400">{title}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  </div>
);

export const StatusBadge = ({ status }: { status: 'Success' | 'Failed' | 'Pending' | 'RequiresManualIntervention' }) => {
  const statusConfig = {
    Success: { icon: CheckCircle, color: 'bg-green-500/20 text-green-400', label: 'Success' },
    Failed: { icon: XCircle, color: 'bg-red-500/20 text-red-400', label: 'Failed' },
    Pending: { icon: Clock, color: 'bg-yellow-500/20 text-yellow-400', label: 'Pending' },
    RequiresManualIntervention: { icon: RefreshCw, color: 'bg-blue-500/20 text-blue-400', label: 'Retry Needed' },
  };
  const { icon: Icon, color, label } = statusConfig[status];
  return (
    <Badge variant="outline" className={`border-0 ${color}`}>
      <Icon className="h-3 w-3 mr-1" />
      {label}
    </Badge>
  );
};

import { DataTable } from '@/components/data-table';
import { getColumns } from './sms-log-columns';
import { useReactTable, getCoreRowModel } from '@tanstack/react-table';

// ... (rest of the file)

const SmsTab: React.FC<SmsTabProps> = ({ smsData, onRefresh }) => {
  const { toast } = useToast();
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const handleRetry = async (logId: string) => {
    setRetryingId(logId);
    try {
      await retrySms(logId);
      toast({
        title: "Success",
        description: "SMS has been re-queued for sending.",
      });
      onRefresh(); // Refresh the data to show the updated status
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to retry SMS.",
        variant: "destructive",
      });
    } finally {
      setRetryingId(null);
    }
  };

  const logs = smsData?.logs || [];
  const stats = smsData?.stats || { total: 0, acknowledgement: 0, expiry: 0, composed: 0, system: 0 };

  const table = useReactTable({
    data: logs,
    columns: getColumns(handleRetry, retryingId),
    getCoreRowModel: getCoreRowModel(),
  });




  return (
    <>
      {!smsData ? (
        <div className="text-center text-zinc-400">Loading SMS history...</div>
      ) : (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={MessageSquare} title="Total Messages" value={stats.total} />
            <StatCard icon={Mail} title="Acknowledgements" value={stats.acknowledgement} />
            <StatCard icon={Bell} title="Expiry Alerts" value={stats.expiry} />
            <StatCard icon={MessageSquare} title="Composed" value={stats.composed} />
          </div>

          {/* SMS History Table */}
          <Card className="bg-zinc-900/50 backdrop-blur-lg shadow-2xl shadow-cyan-500/10 rounded-xl">
            <CardHeader>
              <CardTitle className="text-cyan-400">SMS History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96 overflow-y-auto overflow-x-auto">
                {logs.length > 0 ? (
                  <DataTable table={table} columns={getColumns(handleRetry, retryingId)} />
                ) : (
                  <div className="flex items-center justify-center h-full text-zinc-400">No SMS history found for this user.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default SmsTab;
