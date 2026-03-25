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
const StatCard = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) => (
  <div className="p-4 rounded-lg bg-zinc-800/50 flex items-center">
    <Icon className="h-6 w-6 text-cyan-400 mr-4" />
    <div>
      <p className="text-sm text-zinc-400">{label}</p>
      <p className="text-xl font-bold text-white">{value}</p>
    </div>
  </div>
);

const StatusBadge = ({ status }: { status: 'Success' | 'Failed' | 'Pending' | 'RequiresManualIntervention' }) => {
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

// --- Main Component ---
const SmsTab: React.FC<SmsTabProps> = ({ smsData, onRefresh }) => {
  const { toast } = useToast();
  const [retryingId, setRetryingId] = useState<string | null>(null);

  if (!smsData) {
    return <div className="text-center text-zinc-400">Loading SMS history...</div>;
  }

  const { logs, stats } = smsData;

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

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={MessageSquare} label="Total Messages" value={stats.total} />
        <StatCard icon={Mail} label="Acknowledgements" value={stats.acknowledgement} />
        <StatCard icon={Bell} label="Expiry Alerts" value={stats.expiry} />
        <StatCard icon={MessageSquare} label="Composed" value={stats.composed} />
      </div>

      {/* SMS History Table */}
      <Card className="bg-zinc-900/50 backdrop-blur-lg shadow-2xl shadow-cyan-500/10 rounded-xl">
        <CardHeader>
          <CardTitle className="text-cyan-400">SMS History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 overflow-y-auto overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length > 0 ? logs.map((log) => (
                  <TableRow key={log._id}>
                    <TableCell className="whitespace-nowrap text-zinc-400">{format(new Date(log.createdAt), 'PPpp')}</TableCell>
                    <TableCell className="font-semibold text-zinc-300">{log.messageType}</TableCell>
                    <TableCell className="text-sm text-zinc-400 max-w-md truncate">{log.message}</TableCell>
                    <TableCell className="text-right">
                      <StatusBadge status={log.smsStatus} />
                    </TableCell>
                    <TableCell className="text-right">
                      {log.smsStatus === 'RequiresManualIntervention' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-cyan-400 text-cyan-400 hover:bg-cyan-400/10 hover:text-cyan-300"
                          onClick={() => handleRetry(log._id)}
                          disabled={retryingId === log._id}
                        >
                          {retryingId === log._id ? (
                            <Clock className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-zinc-500">
                      No SMS history found for this user.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SmsTab;
