"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { motion } from "framer-motion"
import { Topbar } from "@/components/topbar"
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/data-table"
import { getColumns } from "./columns"
import { CalendarDateRangePicker } from "@/components/date-range-picker"
import { DateRange } from "react-day-picker"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import { Download, Search, DollarSign, TrendingUp, User } from "lucide-react"

// --- TYPE DEFINITIONS ---
export interface Transaction {
  _id: string;
  transactionId: string;
  amount: number;
  referenceNumber: string;
  officialName: string;
  msisdn: string;
  transactionDate: string;
  balance?: number;
}

// --- MAIN COMPONENT ---
export default function MpesaTransactionsPage() {
  const { toast } = useToast()
  const { token } = useAuth()

  // Data states
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState({ totalVolume: 0, transactionCount: 0, averageTransaction: 0 });

  // UI states

  // Filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [page, setPage] = useState(1)
  const pageSize = 15
  const [totalPages, setTotalPages] = useState(1)

  // --- DATA FETCHING ---
  const fetchTransactions = useCallback(async () => {
    if (!token) return
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        ...(searchTerm && { searchTerm }),
        ...(dateRange?.from && { startDate: dateRange.from.toISOString() }),
        ...(dateRange?.to && { endDate: dateRange.to.toISOString() }),
      })

      const response = await fetch(`/api/payments/transactions?${params.toString()}`, {
        headers: { "Authorization": `Bearer ${token}` },
      })
      if (!response.ok) throw new Error("Failed to fetch transactions")
      
      const data = await response.json()
      setTransactions(data.transactions || [])
      setTotalPages(data.pages || 1)
      setStats(data.stats || { totalVolume: 0, transactionCount: 0, averageTransaction: 0 })
    } catch (error) {
      toast({ title: "Error", description: "Failed to load transactions.", variant: "destructive" })
    }
  }, [token, page, pageSize, searchTerm, dateRange, toast])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const filteredTransactions = useMemo(() => {
    return transactions;
  }, [transactions]);

  // --- RENDER ---
  return (
    <div className="flex flex-col min-h-screen bg-zinc-900 text-white">
      <Topbar />
      <main className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">M-Pesa Transactions</h1>
            <p className="text-sm text-zinc-400">Review and manage all M-Pesa payment transactions.</p>
          </div>
          <Button className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg transition-all duration-300 hover:scale-105">
            <Download className="mr-2 h-4 w-4" /> Export Data
          </Button>
        </div>

        <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="bg-zinc-900/50 backdrop-blur-lg border border-zinc-700 shadow-2xl shadow-blue-500/10 rounded-xl">
          <Card className="bg-transparent border-none">
            <CardHeader className="p-4 border-b border-zinc-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard title="Total Volume" value={`Ksh ${stats.totalVolume.toLocaleString()}`} icon={DollarSign} color="text-green-400" />
              <StatCard title="Transactions" value={stats.transactionCount.toLocaleString()} icon={TrendingUp} />
              <StatCard title="Avg. Transaction" value={`Ksh ${stats.averageTransaction.toLocaleString()}`} icon={User} />
            </CardHeader>
            <CardContent className="p-4">
              <DataTableToolbar searchTerm={searchTerm} setSearchTerm={setSearchTerm} dateRange={dateRange} setDateRange={setDateRange} />
              <div className="mt-4 overflow-x-auto">
                <DataTable columns={getColumns()} data={filteredTransactions} />
              </div>
              <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  )
}

// --- SUB-COMPONENTS ---
const StatCard = ({ title, value, icon: Icon, color = "text-white" }: any) => (
  <div className="bg-zinc-800/50 p-3 rounded-lg flex items-center gap-4">
    <div className={`p-2 bg-zinc-700 rounded-md ${color}`}><Icon className="h-5 w-5" /></div>
    <div>
      <p className="text-xs text-zinc-400">{title}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  </div>
);

const DataTableToolbar = (props: any) => {
  const { searchTerm, setSearchTerm, dateRange, setDateRange } = props;
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-2 bg-zinc-800/50 rounded-lg border border-zinc-700">
      <div className="relative w-full sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <Input
          placeholder="Search by name, phone, ref..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-9 bg-zinc-800 border-zinc-700 w-full"
        />
      </div>
      <div className="w-full sm:w-auto">
        <CalendarDateRangePicker date={dateRange} setDate={setDateRange} />
      </div>
    </div>
  );
};

const PaginationControls = ({ page, totalPages, onPageChange }: any) => (
  <div className="flex items-center justify-end space-x-2 py-4 border-t border-zinc-800 mt-4">
    <Button variant="outline" size="sm" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1}
      className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 disabled:opacity-50">
      Previous
    </Button>
    <span className="text-sm text-zinc-400">Page {page} of {totalPages}</span>
    <Button variant="outline" size="sm" onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page === totalPages}
      className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 disabled:opacity-50">
      Next
    </Button>
  </div>
);
