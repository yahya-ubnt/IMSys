"use client";

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import Image from 'next/image';
import { Topbar } from "@/components/topbar";
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, Calendar, Globe, BarChart2, Users, CheckCircle, Clock, UserPlus, ArrowUpCircle, ArrowDownCircle, Ticket as TicketIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from '@/components/auth-provider';

// --- Interface Definitions ---
interface CollectionsSummary { today: number; weekly: number; monthly: number; yearly: number; }
interface ExpenseSummary { today: number; weekly: number; monthly: number; yearly: number; }
interface MonthlyDataPoint { month: string; collections: number; expenses: number; }
interface DailyDataPoint { day: string; collections: number; expenses: number; }
interface UserSummary {
  totalUsers: number;
  activeUsers: number;
  expiredUsers: number;
  newSubscriptions: number;
}
interface Transaction {
  _id: string;
  transactionDate: string;
  officialName: string;
  amount: number;
  transactionId: string;
}
interface Ticket {
  _id: string;
  createdAt: string;
  clientName: string;
  issueType: string;
  status: string;
}

// --- Main Page Component ---
export default function DashboardPage() {
  const [summary, setSummary] = useState<CollectionsSummary | null>(null);
  const [expenseSummary, setExpenseSummary] = useState<ExpenseSummary | null>(null);
  const [userSummary, setUserSummary] = useState<UserSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummaries = async () => {
      setLoading(true);
      setError(null);
      try {
        const [summaryRes, expenseSummaryRes, userSummaryRes] = await Promise.all([
          fetch('/api/dashboard/collections/summary'),
          fetch('/api/dashboard/expenses/summary'),
          Promise.all([
            fetch('/api/dashboard/users/total'),
            fetch('/api/dashboard/users/active'),
            fetch('/api/dashboard/users/expired'),
            fetch('/api/dashboard/subscriptions/new')
          ]).then(async (responses) => {
            const [total, active, expired, newSubs] = await Promise.all(responses.map(res => res.json()));
            return {
              totalUsers: total.totalUsers,
              activeUsers: active.activeUsers,
              expiredUsers: expired.expiredUsers,
              newSubscriptions: newSubs.newSubscriptions
            };
          })
        ]);

        if (!summaryRes.ok) throw new Error(`Failed to fetch summary: ${summaryRes.statusText}`);
        if (!expenseSummaryRes.ok) throw new Error(`Failed to fetch expense summary: ${expenseSummaryRes.statusText}`);

        setSummary(await summaryRes.json());
        setExpenseSummary(await expenseSummaryRes.json());
        setUserSummary(userSummaryRes);

      } catch (err: unknown) {
        setError((err instanceof Error) ? err.message : 'Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchSummaries();
  }, []);

  if (loading) return <div className="flex h-screen items-center justify-center bg-background text-foreground">Loading dashboard...</div>;
  if (error) return <div className="flex h-screen items-center justify-center bg-background text-red-400">{error}</div>;

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Topbar />
      <div className="flex-1 p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Dashboard</h1>
          <p className="text-sm text-muted-foreground">An overview of your system's collections and expenses.</p>
        </div>

        <motion.div layout className="bg-card backdrop-blur-lg shadow-2xl shadow-blue-500/10 rounded-xl overflow-hidden">
          <Card className="bg-transparent border-none">
            <CardHeader className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 border-b border-border border-b-0">
              <FinancialStatCard title="Today's Summary" collections={summary?.today || 0} expenses={expenseSummary?.today || 0} icon={DollarSign} />
              <FinancialStatCard title="This Week's Summary" collections={summary?.weekly || 0} expenses={expenseSummary?.weekly || 0} icon={TrendingUp} />
              <FinancialStatCard title="This Month's Summary" collections={summary?.monthly || 0} expenses={expenseSummary?.monthly || 0} icon={Calendar} />
              <FinancialStatCard title="This Year's Summary" collections={summary?.yearly || 0} expenses={expenseSummary?.yearly || 0} icon={Globe} />
            </CardHeader>
            <CardHeader className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 border-b border-border border-b-0">
              <StatCard title="Total Users" value={userSummary?.totalUsers || 0} icon={Users} />
              <StatCard title="Active Users" value={userSummary?.activeUsers || 0} icon={CheckCircle} color="text-green-400" />
              <StatCard title="Expired Users" value={userSummary?.expiredUsers || 0} icon={Clock} color="text-yellow-400" />
              <StatCard title="New This Month" value={userSummary?.newSubscriptions || 0} icon={UserPlus} color="text-blue-400" />
            </CardHeader>
            <CardContent className="p-4 space-y-6">
              <FinancialChartCard />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RecentTransactions />
                <RecentTickets />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

// --- Sub-components ---
const StatCard = ({ title, value, icon: Icon, prefix, color = "text-cyan-400" }: { title: string; value: number; icon: React.ElementType; prefix?: string, color?: string }) => (
    <div className="bg-muted p-3 rounded-lg flex items-center gap-4">
      <div className={`p-2 bg-accent rounded-md ${color}`}><Icon className="h-5 w-5" /></div>
      <div>
        <p className="text-xs text-muted-foreground">{title}</p>
        <p className={`text-xl font-bold ${color}`}>{prefix || ''}{value.toLocaleString()}</p>
      </div>
    </div>
  );

const FinancialStatCard = ({ title, collections, expenses, icon: Icon }: { title: string; collections: number; expenses: number; icon: React.ElementType; }) => {
  const net = collections - expenses;
  const netColor = net >= 0 ? 'text-green-400' : 'text-red-400';

  return (
    <div className="bg-muted p-4 rounded-lg flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-accent rounded-md text-cyan-400"><Icon className="h-5 w-5" /></div>
          <p className="text-sm font-semibold text-muted-foreground">{title}</p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-green-400">
              <ArrowUpCircle size={16} />
              <span>Collections</span>
            </div>
            <span className="font-mono">KES {collections.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-red-400">
              <ArrowDownCircle size={16} />
              <span>Expenses</span>
            </div>
            <span className="font-mono">KES {expenses.toLocaleString()}</span>
          </div>
        </div>
      </div>
      <div className={`mt-3 pt-2 border-t border-border flex items-center justify-between text-base font-bold ${netColor}`}>
        <div className="flex items-center gap-2">
            <DollarSign size={16} />
            <span>Net</span>
        </div>
        <span className="font-mono">KES {net.toLocaleString()}</span>
      </div>
    </div>
  );
};

const FinancialChartCard = () => {
  const [view, setView] = useState<'monthly' | 'daily'>('daily');
  const [data, setData] = useState<(MonthlyDataPoint | DailyDataPoint)[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string>((new Date().getMonth() + 1).toString());

  useEffect(() => {
    const fetchData = async () => {
      try {
        let url = '';
        if (view === 'monthly') {
          url = `/api/dashboard/collections-expenses/monthly?year=${selectedYear}`;
        } else {
          url = `/api/dashboard/collections-expenses/daily?year=${selectedYear}&month=${selectedMonth}`;
        }
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch data: ${res.statusText}`);
        setData(await res.json());
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [view, selectedYear, selectedMonth]);

  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());
  const months = [
    { value: "1", label: "January" }, { value: "2", label: "February" }, { value: "3", label: "March" },
    { value: "4", label: "April" }, { value: "5", label: "May" }, { value: "6", label: "June" },
    { value: "7", label: "July" }, { value: "8", label: "August" }, { value: "9", label: "September" },
    { value: "10", label: "October" }, { value: "11", label: "November" }, { value: "12", label: "December" }
  ];

  return (
    <div className="bg-card p-4 rounded-lg">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-2">
        <div className="flex items-center gap-2">
          <Button onClick={() => setView('daily')} size="sm" className={view === 'daily' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-transparent border border-border text-muted-foreground hover:bg-accent'}>Daily</Button>
          <Button onClick={() => setView('monthly')} size="sm" className={view === 'monthly' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-transparent border border-border text-muted-foreground hover:bg-accent'}>Monthly</Button>
        </div>
        <div className="flex gap-2">
          {view === 'daily' && (
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-32 h-8 text-xs bg-accent border-border"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-popover text-popover-foreground border-border">
                {months.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32 h-8 text-xs bg-accent border-border"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-popover text-popover-foreground border-border">{years.map((y: string) => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey={view === 'monthly' ? 'month' : 'day'} tickFormatter={view === 'monthly' ? (m => m.substring(0, 3)) : undefined} style={{ fontSize: '0.75rem' }} stroke="var(--muted-foreground)" />
          <YAxis 
            style={{ fontSize: '0.75rem' }} 
            stroke="var(--muted-foreground)" 
            tickCount={8}
            tickFormatter={val => `KES ${val.toLocaleString()}`}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(100,100,100,0.1)' }} />
          <Legend />
          <Bar dataKey="collections" fill="var(--chart-collections)" name="Collections" barSize={2} />
          <Bar dataKey="expenses" fill="var(--chart-expenses)" name="Expenses" barSize={2} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const RecentTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await fetch('/api/payments/transactions?limit=5');
        const data = await res.json();
        setTransactions(data.transactions);
      } catch (error) {
        console.error("Failed to fetch recent transactions", error);
      }
    };
    fetchTransactions();
  }, []);

  return (
    <div className="bg-card p-4 rounded-lg">
      <h3 className="text-sm font-semibold text-cyan-400 mb-4">Recent Transactions</h3>
      <div className="space-y-3">
        {transactions.map((t) => (
          <TransactionCard key={t._id} transaction={t} />
        ))}
      </div>
    </div>
  )
}

const TransactionCard = ({ transaction }: { transaction: Transaction }) => {
  return (
    <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
      <img src="/mpesa-logo.svg" alt="M-Pesa Logo" className="w-10 h-10" />
      <div className="flex-grow">
        <p className="font-semibold">{transaction.officialName}</p>
        <p className="text-xs text-muted-foreground">{new Date(transaction.transactionDate).toLocaleString()}</p>
      </div>
      <div className="text-right">
        <p className="font-bold text-green-400">KES {transaction.amount.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground font-mono">{transaction.transactionId}</p>
      </div>
    </div>
  )
}

const RecentTickets = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await fetch('/api/tickets?limit=5');
        const data = await res.json();
        setTickets(data.tickets);
      } catch (error) {
        console.error("Failed to fetch recent tickets", error);
      }
    };
    fetchTickets();
  }, []);

  return (
    <div className="bg-card p-4 rounded-lg">
      <h3 className="text-sm font-semibold text-cyan-400 mb-4">Recent Tickets</h3>
      <div className="space-y-3">
        {tickets.map((t) => (
          <TicketCard key={t._id} ticket={t} />
        ))}
      </div>
    </div>
  )
}

const TicketCard = ({ ticket }: { ticket: Ticket }) => {
  const statusColor = {
    'New': 'text-blue-400',
    'In Progress': 'text-yellow-400',
    'Resolved': 'text-green-400',
    'Closed': 'text-zinc-500',
  }[ticket.status] || 'text-foreground';

  return (
    <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
      <div className="p-2 bg-accent rounded-md text-cyan-400">
        <TicketIcon className="h-6 w-6" />
      </div>
      <div className="flex-grow">
        <p className="font-semibold">{ticket.issueType}</p>
        <p className="text-xs text-muted-foreground">{ticket.clientName}</p>
      </div>
      <div className="text-right">
        <p className={`font-bold text-sm ${statusColor}`}>{ticket.status}</p>
        <p className="text-xs text-muted-foreground">{new Date(ticket.createdAt).toLocaleDateString()}</p>
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; fill: string }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover text-popover-foreground p-3 rounded-md text-xs border border-border shadow-lg">
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
