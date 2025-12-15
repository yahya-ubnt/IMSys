"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { motion } from "framer-motion"
import {
  useReactTable,
  getCoreRowModel,
  PaginationState,
  ColumnFiltersState,
} from "@tanstack/react-table";
import { Topbar } from "@/components/topbar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/data-table";
import { getColumns } from "./columns";
import { CalendarDateRangePicker } from "@/components/date-range-picker";
import { DateRange } from "react-day-picker";
import { useToast } from "@/hooks/use-toast";
import { Download, Search, TrendingUp } from "lucide-react";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// --- TYPE DEFINITIONS ---
export interface WalletTransaction {
  _id: string;
  userId: { _id: string; officialName: string; username: string; };
  transactionId: string;
  type: 'Credit' | 'Debit' | 'Adjustment';
  amount: number;
  source: string;
  balanceAfter: number;
  comment?: string;
  processedBy?: { _id: string; name: string; };
  createdAt: string;
}

// --- MAIN COMPONENT ---
export default function WalletTransactionsPage() {
  const { toast } = useToast()

  // Data states
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [pageCount, setPageCount] = useState(0)

  // Filter and table states
  const [searchTerm, setSearchTerm] = useState("")
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
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
    setIsLoading(true)
    try {
      const typeFilter = columnFilters.find(f => f.id === 'type')?.value
      const dateFilter = columnFilters.find(f => f.id === 'createdAt')?.value as DateRange | undefined

      const params = new URLSearchParams({
        page: (pageIndex + 1).toString(),
        limit: pageSize.toString(),
        ...(searchTerm && { searchTerm }),
        ...(typeFilter ? { type: typeFilter as string } : {}),
        ...(dateFilter?.from && { startDate: dateFilter.from.toISOString() }),
        ...(dateFilter?.to && { endDate: dateFilter.to.toISOString() }),
      })

      const response = await fetch(`/api/payments/wallet?${params.toString()}`)
      if (!response.ok) throw new Error("Failed to fetch wallet transactions")
      
      const data = await response.json()
      setTransactions(data.transactions || [])
      setPageCount(data.pages || 1)
    } catch {
      toast({ title: "Error", description: "Failed to load wallet transactions.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }, [pageIndex, pageSize, searchTerm, columnFilters, toast])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const table = useReactTable({
    data: transactions,
    columns: getColumns(),
    pageCount,
    state: {
      pagination,
      columnFilters,
    },
    onPaginationChange: setPagination,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualFiltering: true,
  })

  // --- RENDER ---
  return (
    <div className="flex flex-col min-h-screen bg-zinc-900 text-white">
      <Topbar />
      <main className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Wallet Transactions</h1>
            <p className="text-sm text-zinc-400">Review all credit, debit, and adjustment wallet transactions.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="icon" className="sm:hidden bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg transition-all duration-300 hover:scale-105">
              <Download className="h-4 w-4" />
            </Button>
            <Button className="hidden sm:flex bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg transition-all duration-300 hover:scale-105">
              <Download className="mr-2 h-4 w-4" /> Export Data
            </Button>
          </div>
        </div>

        <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="bg-zinc-900/50 backdrop-blur-lg shadow-2xl shadow-blue-500/10 rounded-xl">
          <Card className="bg-transparent border-none">
            <CardHeader className="p-4 border-b border-zinc-800">
                <StatCard title="Total Transactions" value={table.getRowCount()} icon={TrendingUp} />
            </CardHeader>
            <CardContent className="p-4">
              <DataTableToolbar table={table} searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
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

const DataTableToolbar = ({ table, searchTerm, setSearchTerm }: { table: ReturnType<typeof useReactTable<WalletTransaction>>, searchTerm: string, setSearchTerm: (value: string) => void }) => {
  const transactionTypes = ['Credit', 'Debit', 'Adjustment'];
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-2 bg-zinc-800/50 rounded-lg">
      <div className="relative w-full sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <Input
          placeholder="Search by user, type, source..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-9 bg-zinc-800 border-zinc-700 w-full"
        />
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
        <Select
          value={(table.getColumn("type")?.getFilterValue() as string) ?? "all"}
          onValueChange={(value) => {
            table.getColumn("type")?.setFilterValue(value === "all" ? null : value)
          }}
        >
          <SelectTrigger className="h-9 bg-zinc-800 border-zinc-700 w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-800 text-white border-zinc-700">
            <SelectItem value="all">All Types</SelectItem>
            {transactionTypes.map(type => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <CalendarDateRangePicker
          date={table.getColumn("createdAt")?.getFilterValue() as DateRange}
          setDate={(date) => table.getColumn("createdAt")?.setFilterValue(date)}
          className="w-full"
        />
      </div>
    </div>
  );
};