"use client"

import { useEffect, useState, useMemo, useCallback } from "react";
import React from "react";
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

export default function DelayedPaymentsPage() {
  const [users, setUsers] = useState<MikrotikUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();
  const { toast } = useToast();
  
  const [daysOverdue, setDaysOverdue] = useState(3);

  const fetchDelayedUsers = useCallback(async () => {
    if (!token) {
      setError('Authentication token not found.');
      return;
    }
    if (daysOverdue === null || daysOverdue <= 0) {
        toast({ title: 'Invalid Input', description: 'Please enter a valid number of days.', variant: 'destructive' });
        return;
    }
    try {
      setLoading(true);
      const response = await fetch(`/api/mikrotik/users/delayed-payments?days_overdue=${daysOverdue}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error(`Failed to fetch users: ${response.statusText}`);
      setUsers(await response.json());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch delayed payment users');
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'An error occurred.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [token, daysOverdue, toast]);

  const columns = getColumns();

  if (error) return <div className="flex h-screen items-center justify-center bg-zinc-900 text-red-400">{error}</div>;

  return (
    <div className="flex flex-col min-h-screen bg-zinc-900 text-white">
      <Topbar />
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">Delayed Payments</h1>
            <p className="text-sm text-zinc-400">View users who are overdue on their payments.</p>
          </div>
        </div>

        <motion.div layout className="bg-zinc-900/50 backdrop-blur-lg border-zinc-700 shadow-2xl shadow-orange-500/10 rounded-xl overflow-hidden">
          <Card className="bg-transparent border-none">
            <CardHeader>
              <CardTitle>Filter Overdue Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  placeholder="Days Overdue"
                  value={daysOverdue}
                  onChange={(e) => setDaysOverdue(parseInt(e.target.value, 10))}
                  className="max-w-xs bg-zinc-800 border-zinc-700"
                />
                <Button onClick={fetchDelayedUsers} className="bg-gradient-to-r from-orange-600 to-yellow-500 text-white">
                  {loading ? 'Loading...' : 'Filter'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div layout className="bg-zinc-900/50 backdrop-blur-lg border-zinc-700 shadow-2xl shadow-blue-500/10 rounded-xl overflow-hidden">
          <Card className="bg-transparent border-none">
            <CardHeader>
                <CardTitle>Overdue Subscribers</CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <p>Loading data...</p>
                    </div>
                ) : (
                    <DataTable columns={columns} data={users} filterColumn="username" />
                )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
