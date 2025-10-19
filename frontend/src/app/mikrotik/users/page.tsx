"use client"

import { useEffect, useState, useMemo, useCallback } from "react";
import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { PlusCircledIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { getColumns, getMikrotikUserStatus } from "./columns";
import { Input } from "@/components/ui/input";
import { Search, Users, CheckCircle, Clock, Wifi, BarChart2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Topbar } from "@/components/topbar";
import { motion } from "framer-motion";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export interface MikrotikUser {
  _id: string;
  username: string;
  officialName: string;
  emailAddress?: string;
  mobileNumber: string;
  mPesaRefNo: string;
  serviceType: 'pppoe' | 'static';
  mikrotikRouter: { _id: string; name: string };
  package: { _id: string; name: string; price: number };
  expiryDate: string;
  isOnline: boolean;
  tenant?: {
    _id: string;
    fullName: string;
  };
}

export default function MikrotikUsersPage() {
  const [users, setUsers] = useState<MikrotikUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token, user, isLoggingOut } = useAuth();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "expired">("all");
  const [monthlyTotalSubscribers, setMonthlyTotalSubscribers] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);

  const fetchMonthlyTotalSubscribers = useCallback(async (year: string) => {
    if (!token) return;
    try {
      const response = await fetch(`/api/mikrotik/users/stats/monthly-total-subscribers/${year}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) setMonthlyTotalSubscribers(await response.json());
    } catch (err) {
      console.error('Failed to fetch monthly total subscribers:', err);
    }
  }, [token]);

  const fetchUsers = useCallback(async () => {
    if (!token) {
      setError('Authentication token not found.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const response = await fetch('/api/mikrotik/users', { headers: { 'Authorization': `Bearer ${token}` } });
      if (!response.ok) throw new Error(`Failed to fetch users: ${response.statusText}`);
      setUsers(await response.json());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch Mikrotik users');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!isLoggingOut) {
      fetchUsers();
      fetchMonthlyTotalSubscribers(selectedYear);
    }
  }, [token, isLoggingOut, selectedYear, fetchUsers, fetchMonthlyTotalSubscribers]);

  const handleDeleteUser = async () => {
    if (!deleteCandidateId) return;
    if (!token) {
      toast({ title: 'Authentication Error', description: 'You must be logged in.', variant: 'destructive' });
      return;
    }
    try {
      const response = await fetch(`/api/mikrotik/users/${deleteCandidateId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (!response.ok) throw new Error(`Failed to delete user: ${response.statusText}`);
      setUsers(prev => prev.filter(user => user._id !== deleteCandidateId));
      toast({ title: 'User Deleted', description: 'Mikrotik user has been successfully deleted.' });
    } catch (error: unknown) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to delete user.', variant: 'destructive' });
    }
    finally {
      setDeleteCandidateId(null);
    }
  };

  const columns = useMemo(() => getColumns(user, (id) => setDeleteCandidateId(id)), [user]);

  const filteredUsers = useMemo(() => users.filter(user => {
    const userStatus = getMikrotikUserStatus(user).status.toLowerCase();
    const matchesStatus = statusFilter === "all" || userStatus === statusFilter;
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) || user.officialName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  }), [users, searchTerm, statusFilter]);

  const totalUsers = users.length;
  const activeUsers = users.filter(user => getMikrotikUserStatus(user).status.toLowerCase() === 'active').length;
  const expiredUsers = totalUsers - activeUsers;
  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());

  if (loading) return <div className="flex h-screen items-center justify-center bg-zinc-900 text-white">Loading...</div>;
  if (error) return <div className="flex h-screen items-center justify-center bg-zinc-900 text-red-400">{error}</div>;

  return (
    <>
      <div className="flex flex-col min-h-screen bg-zinc-900 text-white">
        <Topbar />
        <div className="flex-1 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Mikrotik Users</h1>
              <p className="text-sm text-zinc-400">Dashboard and management for all network users.</p>
            </div>
            <Button asChild className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg transition-all duration-300 hover:scale-105">
              <Link href="/mikrotik/users/new"><PlusCircledIcon className="mr-2 h-4 w-4" /> Add New User</Link>
            </Button>
          </div>

          <motion.div layout className="bg-zinc-900/50 backdrop-blur-lg border-zinc-700 shadow-2xl shadow-blue-500/10 rounded-xl overflow-hidden">
            <Card className="bg-transparent border-none">
              <CardHeader className="p-4 border-b border-zinc-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard title="Total Users" value={totalUsers} icon={Users} />
                <StatCard title="Active Users" value={activeUsers} icon={CheckCircle} color="text-green-400" />
                <StatCard title="Expired Users" value={expiredUsers} icon={Clock} color="text-yellow-400" />
              </CardHeader>
              <CardContent className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartCard title="Subscriber Trends" selectedYear={selectedYear} onYearChange={setSelectedYear} years={years} data={monthlyTotalSubscribers} />
                <DonutChartCard active={activeUsers} expired={expiredUsers} total={totalUsers} />
              </CardContent>
              <div className="p-4 border-t border-zinc-800">
                <DataTableToolbar searchTerm={searchTerm} onSearch={setSearchTerm} statusFilter={statusFilter} onStatusFilter={setStatusFilter} />
              </div>
              <div className="overflow-x-auto">
                <DataTable columns={columns} data={filteredUsers} filterColumn="username" />
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
      <AlertDialog open={!!deleteCandidateId} onOpenChange={() => setDeleteCandidateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// --- Sub-components ---
const StatCard = ({ title, value, icon: Icon, color = "text-white" }: any) => (
  <div className="bg-zinc-800/50 p-3 rounded-lg flex items-center gap-4">
    <div className={`p-2 bg-zinc-700 rounded-md ${color}`}><Icon className="h-5 w-5" /></div>
    <div>
      <p className="text-xs text-zinc-400">{title}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  </div>
);

const ChartCard = ({ title, selectedYear, onYearChange, years, data }: any) => (
  <div className="bg-zinc-800/50 p-4 rounded-lg">
    <div className="flex justify-between items-center mb-2">
      <h3 className="text-sm font-semibold text-cyan-400 flex items-center gap-2"><BarChart2 size={16}/> {title}</h3>
      <Select value={selectedYear} onValueChange={onYearChange}>
        <SelectTrigger className="w-32 h-8 text-xs bg-zinc-700 border-zinc-600"><SelectValue /></SelectTrigger>
        <SelectContent className="bg-zinc-800 text-white border-zinc-700">{years.map((y: string) => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
      </Select>
    </div>
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
        <defs><linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22d3ee" stopOpacity={0.8}/><stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/></linearGradient></defs>
        <XAxis dataKey="month" tickFormatter={m => new Date(2000, m - 1).toLocaleString('default', { month: 'short' })} style={{ fontSize: '0.75rem' }} stroke="#888" />
        <YAxis style={{ fontSize: '0.75rem' }} stroke="#888" />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(100,100,100,0.1)' }} />
        <Area type="monotone" dataKey="total" stroke="#22d3ee" fill="url(#chartFill)" />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

const DonutChartCard = ({ active, expired, total }: any) => (
    <div className="bg-zinc-800/50 p-4 rounded-lg">
        <h3 className="text-sm font-semibold text-cyan-400 mb-2 flex items-center gap-2"><Wifi size={16}/> User Status</h3>
        <ResponsiveContainer width="100%" height={200}>
            <PieChart>
                <defs>
                    <linearGradient id="activeFill"><stop offset="0%" stopColor="#10b981" /><stop offset="100%" stopColor="#34d399" /></linearGradient>
                    <linearGradient id="expiredFill"><stop offset="0%" stopColor="#f59e0b" /><stop offset="100%" stopColor="#fbbf24" /></linearGradient>
                </defs>
                <Pie data={[{ name: 'Active', value: active }, { name: 'Expired', value: expired }]} dataKey="value" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} stroke="none">
                    <Cell key="active" fill="url(#activeFill)" />
                    <Cell key="expired" fill="url(#expiredFill)" />
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: '0.75rem' }} />
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize="24" fontWeight="bold">{total}</text>
                <text x="50%" y="65%" textAnchor="middle" dominantBaseline="middle" fill="#aaa" fontSize="12">Total Users</text>
            </PieChart>
        </ResponsiveContainer>
    </div>
);

const DataTableToolbar = ({ searchTerm, onSearch, statusFilter, onStatusFilter }: any) => (
  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
    <div className="flex items-center gap-2">
      <Button size="sm" className={statusFilter === 'all' ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-transparent border border-zinc-700 text-zinc-400 hover:bg-zinc-800'} onClick={() => onStatusFilter('all')}>All</Button>
      <Button size="sm" className={statusFilter === 'active' ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-transparent border border-zinc-700 text-zinc-400 hover:bg-zinc-800'} onClick={() => onStatusFilter('active')}>Active</Button>
      <Button size="sm" className={statusFilter === 'expired' ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-transparent border border-zinc-700 text-zinc-400 hover:bg-zinc-800'} onClick={() => onStatusFilter('expired')}>Expired</Button>
    </div>
    <div className="relative w-full sm:max-w-xs">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
      <Input
        placeholder="Search username or name..."
        value={searchTerm}
        onChange={e => onSearch(e.target.value)}
        className="pl-10 h-9 bg-zinc-800 border-zinc-700"
      />
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-800/80 backdrop-blur-sm text-white p-2 rounded-md text-xs border border-zinc-700">
        <p className="font-bold">{label || payload[0].name}</p>
        <p>{`Users: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};