'use client'

import { useEffect, useState, useMemo, useCallback } from "react";
import React from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
} from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { getColumns } from "./columns";
import { Topbar } from "@/components/topbar";
import { motion } from "framer-motion";
import { MikrotikUser } from "@/app/mikrotik/users/page"; // Re-use the same interface
import { ColumnDef } from "@tanstack/react-table";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function DelayedPaymentsPage() {
  const [users, setUsers] = useState<MikrotikUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const [daysOverdue, setDaysOverdue] = useState(3);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchDelayedUsers = useCallback(async () => {
    if (daysOverdue === null || daysOverdue < 0) {
        toast({ title: 'Invalid Input', description: 'Please enter a valid number of days.', variant: 'destructive' });
        return;
    }
    try {
      setLoading(true);
      let url = `/api/mikrotik/users/delayed-payments?days_overdue=${daysOverdue}`;
      if (searchTerm) {
        url += `&name_search=${searchTerm}`;
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch users: ${response.statusText}`);
      setUsers(await response.json());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch delayed payment users');
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'An error occurred.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [daysOverdue, searchTerm, toast]);

  const columns: ColumnDef<MikrotikUser & { daysOverdue: number }>[] = getColumns();

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  if (error) return <div className="flex h-screen items-center justify-center bg-zinc-900 text-red-400">{error}</div>;

  return (
    <div className="flex flex-col min-h-screen bg-zinc-900 text-white">
      <Topbar />
      <div className="flex-1 p-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Delayed Payments Report</h1>
          <p className="text-sm text-zinc-400 mt-1">Identify and manage users with overdue payments.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-zinc-900/50 backdrop-blur-lg border-zinc-700 shadow-2xl shadow-blue-500/10 rounded-xl">
            <CardHeader>
              <CardTitle className="text-cyan-400">Filter Options</CardTitle>
              <p className="text-sm text-zinc-400">Specify criteria to find overdue users.</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="space-y-2">
                  <label htmlFor="days-overdue" className="text-sm font-medium text-zinc-300">Minimum Days Overdue</label>
                  <Input
                    id="days-overdue"
                    type="number"
                    placeholder="e.g., 3"
                    value={daysOverdue}
                    onChange={(e) => setDaysOverdue(isNaN(parseInt(e.target.value)) ? 0 : parseInt(e.target.value))}
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="search-term" className="text-sm font-medium text-zinc-300">Search by Name/Username</label>
                  <Input
                    id="search-term"
                    type="text"
                    placeholder="Enter name or username..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
                <Button onClick={fetchDelayedUsers} className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white self-end">
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Searching...</> : 'Search'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-zinc-900/50 backdrop-blur-lg border-zinc-700 shadow-2xl shadow-blue-500/10 rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-blue-400">Overdue Subscribers</CardTitle>
              <Badge variant="secondary">{users.length} users found</Badge>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 text-zinc-500 animate-spin" />
                </div>
              ) : (
                <DataTable table={table} columns={columns} />
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}