'use client'

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/data-table";
import { useAuth } from "@/components/auth-provider";
import { Topbar } from "@/components/topbar";
import { motion } from "framer-motion";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, Percent, Calendar, Hash, DollarSign, Loader2 } from 'lucide-react';

interface PaymentStat {
    userId: string;
    name: string;
    totalPayments: number;
    onTimePayments: number;
    latePayments: number;
    onTimePaymentPercentage: number;
    averagePaymentDelay: number;
    lifetimeValue: number;
    paymentHistory: PaymentHistoryEntry[];
}

interface PaymentHistoryEntry {
    billId: string;
    dueDate: string;
    paidDate: string | null;
    amount: number;
    status: 'Paid (On-Time)' | 'Paid (Late)' | 'Pending';
    daysDelayed: number;
}

const StatCard = ({ title, value, icon: Icon, color, suffix = '' }: any) => (
    <motion.div
        variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
        className="bg-zinc-800/50 p-4 rounded-lg flex items-center gap-4 border border-zinc-700 hover:bg-zinc-800 transition-colors"
    >
        <div className={`p-3 bg-zinc-700 rounded-md ${color}`}>
            <Icon className="h-6 w-6" />
        </div>
        <div>
            <p className="text-sm text-zinc-400">{title}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}{suffix}</p>
        </div>
    </motion.div>
);

export default function PaymentStatsPage() {
    const [stats, setStats] = useState<PaymentStat | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { token } = useAuth();
    const params = useParams();
    const userId = params.id;

    const fetchStats = useCallback(async () => {
        if (!token || !userId) return;
        try {
            setLoading(true);
            const response = await fetch(`/api/mikrotik/users/${userId}/payment-stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error(`Failed to fetch stats: ${response.statusText}`);
            setStats(await response.json());
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to fetch payment stats');
        } finally {
            setLoading(false);
        }
    }, [token, userId]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const columns: ColumnDef<PaymentHistoryEntry>[] = [
        { accessorKey: "dueDate", header: "Due Date", cell: ({ row }) => new Date(row.original.dueDate).toLocaleDateString() },
        { accessorKey: "paidDate", header: "Paid Date", cell: ({ row }) => row.original.paidDate ? new Date(row.original.paidDate).toLocaleDateString() : 'N/A' },
        {
            accessorKey: "daysDelayed",
            header: "Days Delayed",
            cell: ({ row }) => {
                const days = parseInt(row.original.daysDelayed as any, 10);
                if (isNaN(days) || days <= 0) {
                    return <Badge variant="secondary">On-Time</Badge>;
                }
                const variant = days > 7 ? 'destructive' : 'outline';
                return <Badge variant={variant}>{days} {days === 1 ? 'day' : 'days'} late</Badge>
            }
        },
        { accessorKey: "amount", header: "Amount", cell: ({ row }) => `KES ${row.original.amount.toLocaleString()}` },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.original.status;
                const variant = status.includes('Late') ? 'destructive' : status.includes('On-Time') ? 'default' : 'secondary';
                return <Badge variant={variant}>{status}</Badge>
            }
        },
    ];
    if (loading) return <div className="flex h-screen items-center justify-center bg-zinc-900 text-white"><Loader2 className="h-8 w-8 animate-spin mr-4" />Loading payment insights...</div>;
    if (error) return <div className="flex h-screen items-center justify-center bg-zinc-900 text-red-400">{error}</div>;
    if (!stats) return null;

    return (
        <div className="flex flex-col min-h-screen bg-zinc-900 text-white">
            <Topbar />
            <div className="flex-1 p-6 space-y-6">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-teal-500">Payment Insights: {stats.name}</h1>
                    <p className="text-sm text-zinc-400">A complete financial history and analysis of payment behavior.</p>
                </motion.div>

                <motion.div 
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                    initial="hidden"
                    animate="visible"
                    variants={{
                        visible: { transition: { staggerChildren: 0.05 } }
                    }}
                >
                    <StatCard title="On-Time Payments" value={stats.onTimePayments} icon={ArrowUp} color="text-green-400" />
                    <StatCard title="Late Payments" value={stats.latePayments} icon={ArrowDown} color="text-red-400" />
                    <StatCard title="On-Time Rate" value={stats.onTimePaymentPercentage.toFixed(1)} icon={Percent} color="text-green-400" suffix="%" />
                    <StatCard title="Avg. Delay" value={`${stats.averagePaymentDelay.toFixed(1)} days`} icon={Calendar} color="text-yellow-400" />
                    <StatCard title="Total Payments" value={stats.totalPayments} icon={Hash} color="text-blue-400" />
                    <StatCard title="Lifetime Value" value={`KES ${stats.lifetimeValue.toLocaleString()}`} icon={DollarSign} color="text-cyan-400" />
                </motion.div>

                <motion.div 
                    layout 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: 0.3 }}
                    className="bg-zinc-900/50 backdrop-blur-lg border-zinc-700 shadow-2xl shadow-blue-500/10 rounded-xl"
                >
                    <Card className="bg-transparent border-none">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Detailed Payment History</CardTitle>
                            <Badge variant="secondary">{stats.paymentHistory.length} entries</Badge>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[500px] overflow-y-auto">
                                <DataTable columns={columns} data={stats.paymentHistory} filterColumn="status" />
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}