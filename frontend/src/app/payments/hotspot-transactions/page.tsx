"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { motion } from "framer-motion"
import {
  useReactTable,
  getCoreRowModel,
  PaginationState,
} from "@tanstack/react-table"
import { Topbar } from "@/components/topbar"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/data-table"
import { getColumns, HotspotTransaction } from "./columns"
import { useToast } from "@/hooks/use-toast"
import { Search, DollarSign, TrendingUp, Wifi } from "lucide-react"
import { DateRange } from "react-day-picker"
import { CalendarDateRangePicker } from "@/components/date-range-picker"
import { DataTablePagination } from "@/components/ui/data-table-pagination"

// --- MAIN COMPONENT ---
export default function HotspotTransactionsPage() {
  const { toast } = useToast()

  // Data states
  const [transactions, setTransactions] = useState<HotspotTransaction[]>([])
  const [stats, setStats] = useState({ totalVolume: 0, transactionCount: 0, averageTransaction: 0 });
  const [pageCount, setPageCount] = useState(0)

  // Filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  
  // Table states
  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  const pagination = useMemo(
    () => ({
      pageIndex,
      pageSize,
    }),
    [pageIndex, pageSize]
  )

  // --- DATA FETCHING ---
  const fetchTransactions = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: (pageIndex + 1).toString(),
        limit: pageSize.toString(),
        ...(searchTerm && { searchTerm }),
        ...(dateRange?.from && { startDate: dateRange.from.toISOString() }),
        ...(dateRange?.to && { endDate: dateRange.to.toISOString() }),
      })

      const response = await fetch(`/api/hotspot?${params.toString()}`)
      if (!response.ok) throw new Error("Failed to fetch transactions")
      
      const data = await response.json()
      setTransactions(data.transactions || [])
      setPageCount(data.pages || 0)
      setStats(data.stats || { totalVolume: 0, transactionCount: 0, averageTransaction: 0 })
    } catch {
      toast({ title: "Error", description: "Failed to load hotspot transactions.", variant: "destructive" })
    }
  }, [pageIndex, pageSize, searchTerm, dateRange, toast])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const table = useReactTable({
    data: transactions,
    columns: getColumns(),
    pageCount,
    state: {
      pagination,
    },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  })

  // --- RENDER ---
  return (
    <div className="flex flex-col min-h-screen bg-zinc-900 text-white">
      <Topbar />
      <main className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Hotspot Transactions</h1>
            <p className="text-sm text-zinc-400">Review and manage all hotspot transactions.</p>
          </div>
        </div>

        <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="bg-zinc-900/50 backdrop-blur-lg shadow-2xl shadow-blue-500/10 rounded-xl">
          <Card className="bg-transparent border-none">
            <CardHeader className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard title="Total Volume" value={`Ksh ${stats.totalVolume.toLocaleString()}`} icon={DollarSign} color="text-green-400" />
              <StatCard title="Transactions" value={stats.transactionCount.toLocaleString()} icon={TrendingUp} />
              <StatCard title="Avg. Transaction" value={`Ksh ${stats.averageTransaction.toLocaleString()}`} icon={Wifi} />
            </CardHeader>
            <CardContent className="p-4">
              <DataTableToolbar searchTerm={searchTerm} setSearchTerm={setSearchTerm} dateRange={dateRange} setDateRange={setDateRange} />
              <div className="mt-4 overflow-x-auto">
                <DataTable table={table} columns={getColumns()} />
              </div>
              <DataTablePagination table={table} />
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  )
}

// --- SUB-COMPONENTS ---
const StatCard = ({ title, value, icon: Icon, color = "text-white" }: { title: string; value: string | number; icon: React.ElementType; color?: string }) => (
  <div className="bg-zinc-800/50 p-3 rounded-lg flex items-center gap-4">
    <div className={`p-2 bg-zinc-700 rounded-md ${color}`}><Icon className="h-5 w-5" /></div>
    <div>
      <p className="text-xs text-zinc-400">{title}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  </div>
);

const DataTableToolbar = (props: { searchTerm: string; setSearchTerm: (value: string) => void; dateRange: DateRange | undefined; setDateRange: (value: DateRange | undefined) => void; }) => {
  const { searchTerm, setSearchTerm, dateRange, setDateRange } = props;
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-2 bg-zinc-800/50 rounded-lg">
      <div className="relative w-full sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <Input
          placeholder="Search by phone, mac..."
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

