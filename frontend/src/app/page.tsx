"use client";

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Topbar } from "@/components/topbar";
import { DollarSign, TrendingUp, Calendar, Globe, BarChart2, Users, CheckCircle, Clock, UserPlus } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from '@/components/auth-provider';

// --- Interface Definitions ---
interface CollectionsSummary { today: number; weekly: number; monthly: number; yearly: number; }
interface ExpenseSummary { today: number; weekly: number; monthly: number; yearly: number; }
interface MonthlyDataPoint { month: string; collections: number; expenses: number; }
interface UserSummary {
  totalUsers: number;
  activeUsers: number;
  expiredUsers: number;
  newSubscriptions: number;
}

// --- Main Page Component ---
export default function DashboardPage() {
  const [summary, setSummary] = useState<CollectionsSummary | null>(null);
  const [expenseSummary, setExpenseSummary] = useState<ExpenseSummary | null>(null);
  const [userSummary, setUserSummary] = useState<UserSummary | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyDataPoint[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [summaryRes, expenseSummaryRes, monthlyRes, totalUsersRes, activeUsersRes, expiredUsersRes, newSubsRes] = await Promise.all([
          fetch('/api/dashboard/collections/summary'),
          fetch('/api/dashboard/expenses/summary'),
          fetch(`/api/dashboard/collections-expenses/monthly?year=${selectedYear}`),
          fetch('/api/dashboard/users/total'),
          fetch('/api/dashboard/users/active'),
          fetch('/api/dashboard/users/expired'),
          fetch('/api/dashboard/subscriptions/new')
        ]);

        if (!summaryRes.ok) throw new Error(`Failed to fetch summary: ${summaryRes.statusText}`);
        if (!expenseSummaryRes.ok) throw new Error(`Failed to fetch expense summary: ${expenseSummaryRes.statusText}`);
        if (!monthlyRes.ok) throw new Error(`Failed to fetch monthly data: ${monthlyRes.statusText}`);
        if (!totalUsersRes.ok) throw new Error(`Failed to fetch total users: ${totalUsersRes.statusText}`);
        if (!activeUsersRes.ok) throw new Error(`Failed to fetch active users: ${activeUsersRes.statusText}`);
        if (!expiredUsersRes.ok) throw new Error(`Failed to fetch expired users: ${expiredUsersRes.statusText}`);
        if (!newSubsRes.ok) throw new Error(`Failed to fetch new subscriptions: ${newSubsRes.statusText}`);

        const summaryData = await summaryRes.json();
        const expenseSummaryData = await expenseSummaryRes.json();
        const monthlyData = await monthlyRes.json();
        const totalUsersData = await totalUsersRes.json();
        const activeUsersData = await activeUsersRes.json();
        const expiredUsersData = await expiredUsersRes.json();
        const newSubsData = await newSubsRes.json();

        setSummary(summaryData);
        setExpenseSummary(expenseSummaryData);
        setMonthlyData(monthlyData);
        setUserSummary({
          totalUsers: totalUsersData.totalUsers,
          activeUsers: activeUsersData.activeUsers,
          expiredUsers: expiredUsersData.expiredUsers,
          newSubscriptions: newSubsData.newSubscriptions
        });

      } catch (err: unknown) {
        setError((err instanceof Error) ? err.message : 'Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [selectedYear]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

  if (loading) return <div className="flex h-screen items-center justify-center bg-zinc-900 text-white">Loading dashboard...</div>;
  if (error) return <div className="flex h-screen items-center justify-center bg-zinc-900 text-red-400">{error}</div>;

  return (
    <div className="flex flex-col min-h-screen bg-zinc-900 text-white">
      <Topbar />
      <div className="flex-1 p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Dashboard</h1>
          <p className="text-sm text-zinc-400">An overview of your system's collections and expenses.</p>
        </div>

        <motion.div layout className="bg-zinc-900/50 backdrop-blur-lg border-zinc-700 shadow-2xl shadow-blue-500/10 rounded-xl overflow-hidden">
          <Card className="bg-transparent border-none">
            <CardHeader className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 border-b border-zinc-800">
              <StatCard title="Today's Collection" value={summary?.today || 0} icon={DollarSign} prefix="KES " color="text-green-400" />
              <StatCard title="This Week" value={summary?.weekly || 0} icon={TrendingUp} prefix="KES " color="text-blue-400" />
              <StatCard title="This Month" value={summary?.monthly || 0} icon={Calendar} prefix="KES " color="text-yellow-400" />
              <StatCard title="This Year" value={summary?.yearly || 0} icon={Globe} prefix="KES " color="text-purple-400" />
            </CardHeader>
            <CardHeader className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 border-b border-zinc-800">
              <StatCard title="Today's Expenses" value={expenseSummary?.today || 0} icon={DollarSign} prefix="KES " color="text-red-400" />
              <StatCard title="This Week's Expenses" value={expenseSummary?.weekly || 0} icon={TrendingUp} prefix="KES " color="text-orange-400" />
              <StatCard title="This Month's Expenses" value={expenseSummary?.monthly || 0} icon={Calendar} prefix="KES " color="text-pink-400" />
              <StatCard title="This Year's Expenses" value={expenseSummary?.yearly || 0} icon={Globe} prefix="KES " color="text-indigo-400" />
            </CardHeader>
            <CardHeader className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 border-b border-zinc-800">
              <StatCard title="Total Users" value={userSummary?.totalUsers || 0} icon={Users} />
              <StatCard title="Active Users" value={userSummary?.activeUsers || 0} icon={CheckCircle} color="text-green-400" />
              <StatCard title="Expired Users" value={userSummary?.expiredUsers || 0} icon={Clock} color="text-yellow-400" />
              <StatCard title="New This Month" value={userSummary?.newSubscriptions || 0} icon={UserPlus} color="text-blue-400" />
            </CardHeader>
            <CardContent className="p-4">
              <ChartCard selectedYear={selectedYear} onYearChange={setSelectedYear} years={years} data={monthlyData} />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

// --- Sub-components ---
const StatCard = ({ title, value, icon: Icon, prefix, color = "text-cyan-400" }: { title: string; value: number; icon: React.ElementType; prefix?: string, color?: string }) => (
  <div className="bg-zinc-800/50 p-3 rounded-lg flex items-center gap-4">
    <div className={`p-2 bg-zinc-700 rounded-md ${color}`}><Icon className="h-5 w-5" /></div>
    <div>
      <p className="text-xs text-zinc-400">{title}</p>
      <p className={`text-xl font-bold ${color}`}>{prefix || ''}{value.toLocaleString()}</p>
    </div>
  </div>
);

const ChartCard = ({ selectedYear, onYearChange, years, data }: any) => {
  return (
    <div className="bg-zinc-800/50 p-4 rounded-lg">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold text-cyan-400 flex items-center gap-2"><BarChart2 size={16}/> Monthly Trends</h3>
        <Select value={selectedYear} onValueChange={onYearChange}>
          <SelectTrigger className="w-32 h-8 text-xs bg-zinc-700 border-zinc-600"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-zinc-800 text-white border-zinc-700">{years.map((y: string) => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="month" tickFormatter={m => m.substring(0, 3)} style={{ fontSize: '0.75rem' }} stroke="#888" />
          <YAxis 
            style={{ fontSize: '0.75rem' }} 
            stroke="#888" 
            tickCount={8}
            tickFormatter={val => `KES ${val.toLocaleString()}`}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(100,100,100,0.1)' }} />
          <Legend />
          <Bar dataKey="collections" fill="#22d3ee" name="Collections" barSize={20} />
          <Bar dataKey="expenses" fill="#f97316" name="Expenses" barSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-800/80 backdrop-blur-sm text-white p-3 rounded-md text-xs border border-zinc-700 shadow-lg">
        <p className="font-bold text-sm mb-2">{label}</p>
        {payload.map((pld: any, i: number) => (
          <div key={i} style={{ color: pld.fill }}>
            {pld.name}: KES {pld.value.toLocaleString()}
          </div>
        ))}
      </div>
    );
  }
  return null;
};
