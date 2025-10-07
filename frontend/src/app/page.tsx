"use client";

import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Topbar } from "@/components/topbar";
import { DollarSign, TrendingUp, Calendar, Globe, BarChart2 } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from '@/components/auth-provider';

// --- Interface Definitions ---
interface CollectionsSummary { today: number; weekly: number; monthly: number; yearly: number; }
interface MonthlyDataPoint { month: string; collections: number; expenses: number; }

// --- Main Page Component ---
export default function DashboardPage() {
  const { token } = useAuth();
  const [summary, setSummary] = useState<CollectionsSummary | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyDataPoint[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!token) {
        setError("Authentication token not found. Please log in.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const [summaryRes, monthlyRes] = await Promise.all([
          fetch('/api/dashboard/collections/summary', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`/api/dashboard/collections-and-expenses/monthly?year=${selectedYear}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        if (!summaryRes.ok) throw new Error(`Failed to fetch summary: ${summaryRes.statusText}`);
        if (!monthlyRes.ok) throw new Error(`Failed to fetch monthly data: ${monthlyRes.statusText}`);

        setSummary(await summaryRes.json());
        setMonthlyData(await monthlyRes.json());

      } catch (err: unknown) {
        setError((err instanceof Error) ? err.message : 'Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [selectedYear, token]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

  if (loading) return <div className="flex h-screen items-center justify-center bg-zinc-900 text-white">Loading dashboard...</div>;
  if (error) return <div className="flex h-screen items-center justify-center bg-zinc-900 text-red-400">{error}</div>;

  return (
    <div className="flex flex-col min-h-screen bg-zinc-900 text-white">
      <Topbar />
      <div className="flex-1 p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Dashboard</h1>
          <p className="text-sm text-zinc-400">An overview of your system's collections and expenses.</p>
        </div>

        <motion.div layout className="bg-zinc-900/50 backdrop-blur-lg border-zinc-700 shadow-2xl shadow-blue-500/10 rounded-xl overflow-hidden">
          <Card className="bg-transparent border-none">
            <CardHeader className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 border-b border-zinc-800">
              <StatCard title="Today's Collection" value={summary?.today || 0} icon={DollarSign} />
              <StatCard title="This Week" value={summary?.weekly || 0} icon={TrendingUp} />
              <StatCard title="This Month" value={summary?.monthly || 0} icon={Calendar} />
              <StatCard title="This Year" value={summary?.yearly || 0} icon={Globe} />
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
const StatCard = ({ title, value, icon: Icon }: { title: string; value: number; icon: React.ElementType; }) => (
  <div className="bg-zinc-800/50 p-3 rounded-lg flex items-center gap-4">
    <div className="p-2 bg-zinc-700 rounded-md text-cyan-400"><Icon className="h-5 w-5" /></div>
    <div>
      <p className="text-xs text-zinc-400">{title}</p>
      <p className="text-xl font-bold text-white">KES {value.toLocaleString()}</p>
    </div>
  </div>
);

const ChartCard = ({ selectedYear, onYearChange, years, data }: any) => (
  <div className="bg-zinc-800/50 p-4 rounded-lg">
    <div className="flex justify-between items-center mb-2">
      <h3 className="text-sm font-semibold text-cyan-400 flex items-center gap-2"><BarChart2 size={16}/> Monthly Trends</h3>
      <Select value={selectedYear} onValueChange={onYearChange}>
        <SelectTrigger className="w-32 h-8 text-xs bg-zinc-700 border-zinc-600"><SelectValue /></SelectTrigger>
        <SelectContent className="bg-zinc-800 text-white border-zinc-700">{years.map((y: string) => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
      </Select>
    </div>
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
        <defs>
          <linearGradient id="colFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22d3ee" stopOpacity={0.8}/><stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/></linearGradient>
          <linearGradient id="expFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/><stop offset="95%" stopColor="#f97316" stopOpacity={0}/></linearGradient>
        </defs>
        <XAxis dataKey="month" tickFormatter={m => m.substring(0, 3)} style={{ fontSize: '0.75rem' }} stroke="#888" />
        <YAxis style={{ fontSize: '0.75rem' }} stroke="#888" tickFormatter={val => `KES ${val/1000}k`} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(100,100,100,0.1)' }} />
        <Area type="monotone" dataKey="collections" stroke="#22d3ee" fill="url(#colFill)" name="Collections" />
        <Area type="monotone" dataKey="expenses" stroke="#f97316" fill="url(#expFill)" name="Expenses" />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-800/80 backdrop-blur-sm text-white p-3 rounded-md text-xs border border-zinc-700 shadow-lg">
        <p className="font-bold text-sm mb-2">{label}</p>
        {payload.map((pld: any, i: number) => (
          <div key={i} style={{ color: pld.stroke }}>
            {pld.name}: KES {pld.value.toLocaleString()}
          </div>
        ))}"
      </div>
    );
  }
  return null;
};