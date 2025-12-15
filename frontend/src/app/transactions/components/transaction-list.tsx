'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { Topbar } from '@/components/topbar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { DataTable } from '@/components/data-table';
import { getTransactionColumns, CommonTransaction } from './transaction-columns';
import { TransactionStats, MonthlyTotalData } from '@/types/transaction';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Calendar, Globe, BarChart2, Search } from 'lucide-react';
import { useReactTable, getCoreRowModel } from '@tanstack/react-table';

// --- Type Definitions & Interfaces ---
interface TransactionService<T> {
  getTransactions: (token: string, params: string) => Promise<T[]>;
  deleteTransaction: (id: string, token: string) => Promise<{ message: string }>;
  getStats: (token: string, category?: string) => Promise<TransactionStats>;
  getMonthlyTotals: (year: string, token: string, category?: string) => Promise<MonthlyTotalData[]>;
}


interface TransactionListProps<T> {
  title: string;
  description: string;
  addTransactionLink: string;
  transactionService: TransactionService<T>;
  category?: 'Company' | 'Personal';
}

// --- Main Component ---
export function TransactionList<T extends CommonTransaction>({
  title,
  description,
  addTransactionLink,
  transactionService,
  category,
}: TransactionListProps<T>) {
  const [transactions, setTransactions] = useState<T[]>([]);
  const [stats, setStats] = useState<TransactionStats | null>(null);
  const [monthlyTotals, setMonthlyTotals] = useState<MonthlyTotalData[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const { token, isLoggingOut } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const timerId = setTimeout(() => setDebouncedSearchTerm(searchTerm), 500);
    return () => clearTimeout(timerId);
  }, [searchTerm]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (!token) {
        return;
      }
      const params = new URLSearchParams({ year: selectedYear });
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
      if (category) params.append('category', category);
      
      const [transData, statsData, monthlyData] = await Promise.all([
        transactionService.getTransactions(token, params.toString()),
        transactionService.getStats(token, category),
        transactionService.getMonthlyTotals(selectedYear, token, category),
      ]);
      
      setTransactions(transData);
      setStats(statsData);
      setMonthlyTotals(monthlyData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data.');
    } finally {
      setLoading(false);
    }
  }, [selectedYear, debouncedSearchTerm, category, transactionService, token]);

  useEffect(() => {
    if (!isLoggingOut) fetchData();
  }, [fetchData, isLoggingOut]);

  const handleDeleteTransaction = async (transactionId: string) => {
    try {
      if (!token) {
        return;
      }
      await transactionService.deleteTransaction(transactionId, token);
      toast({ title: 'Transaction Deleted' });
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to delete transaction.', variant: 'destructive' });
    }
  };

  const columns = getTransactionColumns<T>(handleDeleteTransaction, category?.toLowerCase() || 'personal');

  const table = useReactTable({
    data: transactions,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  if (loading && !transactions.length) return <div className="flex h-screen items-center justify-center bg-zinc-900 text-white">Loading transactions...</div>;
  if (error) return <div className="flex h-screen items-center justify-center bg-zinc-900 text-red-400">{error}</div>;

  return (
    <div className="flex flex-col min-h-screen bg-zinc-900 text-white">
      <Topbar />
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">{title}</h1>
            <p className="text-sm text-zinc-400">{description}</p>
          </div>
          <Button asChild className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg transition-all duration-300 hover:scale-105">
            <Link href={addTransactionLink}><Plus className="mr-2 h-4 w-4" />Add New Transaction</Link>
          </Button>
        </div>

        <motion.div layout className="bg-zinc-900/50 backdrop-blur-lg border-zinc-700 shadow-2xl shadow-blue-500/10 rounded-xl overflow-hidden">
          <Card className="bg-transparent border-none">
            <CardHeader className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 border-b border-zinc-800">
              <StatCard title="Today's Transactions" value={stats?.today.total || 0} icon={DollarSign} />
              <StatCard title="This Week" value={stats?.thisWeek.total || 0} icon={TrendingUp} />
              <StatCard title="This Month" value={stats?.thisMonth.total || 0} icon={Calendar} />
              <StatCard title="This Year" value={stats?.thisYear.total || 0} icon={Globe} />
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <ChartCard selectedYear={selectedYear} onYearChange={setSelectedYear} data={monthlyTotals} />
              <div className="p-4 border-t border-zinc-800">
                <DataTableToolbar searchTerm={searchTerm} onSearch={setSearchTerm} />
              </div>
              <div className="overflow-x-auto">
                <DataTable table={table} columns={columns} />
              </div>
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

const ChartCard = ({ selectedYear, onYearChange, data }: { selectedYear: string; onYearChange: (value: string) => void; data: MonthlyTotalData[] }) => {
    const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());
    return (
        <div className="bg-zinc-800/50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-semibold text-cyan-400 flex items-center gap-2"><BarChart2 size={16}/> Monthly Trends</h3>
                <Select value={selectedYear} onValueChange={onYearChange}>
                    <SelectTrigger className="w-32 h-8 text-xs bg-zinc-700 border-zinc-600"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-zinc-800 text-white border-zinc-700">{years.map((y: string) => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                </Select>
            </div>
            <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <defs><linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22d3ee" stopOpacity={0.8}/><stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/></linearGradient></defs>
                    <XAxis dataKey="month" tickFormatter={m => new Date(2000, m - 1).toLocaleString('default', { month: 'short' })} style={{ fontSize: '0.75rem' }} stroke="#888" />
                    <YAxis style={{ fontSize: '0.75rem' }} stroke="#888" tickFormatter={val => `KES ${val/1000}k`} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(100,100,100,0.1)' }} />
                    <Area type="monotone" dataKey="total" stroke="#22d3ee" fill="url(#chartFill)" name="Total" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

const DataTableToolbar = ({ searchTerm, onSearch }: { searchTerm: string; onSearch: (value: string) => void }) => (
  <div className="flex items-center justify-end">
    <div className="relative w-full sm:max-w-xs">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
      <Input
        placeholder="Search transactions..."
        value={searchTerm}
        onChange={e => onSearch(e.target.value)}
        className="pl-10 h-9 bg-zinc-800 border-zinc-700"
      />
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: number }) => {
  if (active && payload && payload.length && label) {
    const monthName = new Date(2000, label - 1).toLocaleString('en-US', { month: 'long' });
    return (
      <div className="bg-zinc-800/80 backdrop-blur-sm text-white p-2 rounded-md text-xs border border-zinc-700">
        <p className="font-bold">{monthName}</p>
        <p>Total: KES {payload[0].value.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};
