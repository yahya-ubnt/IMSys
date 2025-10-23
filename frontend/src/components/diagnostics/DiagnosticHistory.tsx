'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { DiagnosticLog } from '@/types/diagnostics';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye } from 'lucide-react';

interface DiagnosticHistoryProps {
  userId: string;
}

const getBadgeVariant = (conclusion: string): "secondary" | "outline" | "destructive" => {
  if (!conclusion) return 'secondary';
  if (conclusion.includes('online')) return 'secondary';
  if (conclusion.includes('expired')) return 'outline';
  return 'destructive';
};

export function DiagnosticHistory({ userId }: DiagnosticHistoryProps) {
  const [logs, setLogs] = useState<DiagnosticLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/mikrotik/users/${userId}/diagnostics`);
        if (!response.ok) {
          throw new Error('Failed to fetch diagnostic history');
        }
        const data = await response.json();
        setLogs(data);
      } catch (error) {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Could not fetch history.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [userId, toast]);

  return (
    <Card className="bg-zinc-900 text-white border-zinc-800 shadow-xl rounded-lg">
      <CardHeader className="border-b border-zinc-800 pb-2">
        <CardTitle className="text-blue-400">Diagnostic History</CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        {isLoading ? (
          <div className="h-96 flex items-center justify-center">
            <p className="text-zinc-400">Loading history...</p>
          </div>
        ) : logs.length > 0 ? (
          <div className="h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800">
                  <TableHead className="text-zinc-300">Date</TableHead>
                  <TableHead className="text-zinc-300">Conclusion</TableHead>
                  <TableHead className="text-zinc-300 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map(log => (
                  <TableRow key={log._id} className="border-zinc-800">
                    <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={getBadgeVariant(log.finalConclusion)}>{log.finalConclusion}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/mikrotik/users/${userId}/diagnostics/${log._id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View Report
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="h-96 flex items-center justify-center">
            <p className="text-zinc-400">No diagnostic history found for this user.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}