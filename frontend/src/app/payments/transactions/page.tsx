"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { motion } from "framer-motion"
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  ColumnDef,
} from "@tanstack/react-table"
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
import { DataTablePagination } from "@/components/ui/data-table-pagination"

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

function isAccessorColumn(column: ColumnDef<Transaction>): column is ColumnDef<Transaction> & { accessorKey: string } {
    return 'accessorKey' in column;
}

// --- MAIN COMPONENT ---
export default function MpesaTransactionsPage() {
  const { toast } = useToast()

  // Data states
  const [transactions, setTransactions] = useState<Transaction[]>([])
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

      const response = await fetch(`/api/payments/transactions?${params.toString()}`)
      if (!response.ok) throw new Error("Failed to fetch transactions")
      
      const data = await response.json()
      setTransactions(data.transactions || [])
      setPageCount(data.pages || 0)
      setStats(data.stats || { totalVolume: 0, transactionCount: 0, averageTransaction: 0 })
    } catch (error) {
      toast({ title: "Error", description: "Failed to load transactions.", variant: "destructive" })
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

  const handleExport = () => {
    if (!transactions || transactions.length === 0) {
      toast({ title: 'No Data', description: 'There is no data to export.', variant: 'destructive' });
      return;
    }

    const columns = getColumns();
    const exportableColumns = columns.filter(isAccessorColumn);

    const csvHeader = exportableColumns.map(c => c.header as string).join(',');

    const csvRows = transactions.map(row => {
      return exportableColumns.map(col => {
        const cellValue = row[col.accessorKey as keyof Transaction];
        // Handle potential commas in string values
        if (typeof cellValue === 'string' && cellValue.includes(',')) {
          return `"${cellValue}"`;
        }
        return cellValue;
      }).join(',');
    });

    const csvContent = [csvHeader, ...csvRows].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const startDate = dateRange?.from?.toISOString().split('T')[0] || 'start';
    const endDate = dateRange?.to?.toISOString().split('T')[0] || 'end';
    link.setAttribute('download', `transactions_report_${startDate}_to_${endDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- RENDER ---
  return (
    <div className="flex flex-col min-h-screen bg-zinc-900 text-white">
      <Topbar />
      <main className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Payment Transactions</h1>
            <p className="text-sm text-zinc-400">Review and manage all payment transactions.</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Mobile: Icon-only button */}
            <Button onClick={handleExport} size="icon" className="sm:hidden bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg transition-all duration-300 hover:scale-105">
              <Download className="h-4 w-4" />
            </Button>
            {/* Desktop: Full button */}
            <Button onClick={handleExport} className="hidden sm:flex bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg transition-all duration-300 hover:scale-105">
              <Download className="mr-2 h-4 w-4" /> Export Data
            </Button>
          </div>
        </div>

        <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="bg-zinc-900/50 backdrop-blur-lg shadow-2xl shadow-blue-500/10 rounded-xl">
          <Card className="bg-transparent border-none">
            <CardHeader className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard title="Total Volume" value={`Ksh ${stats.totalVolume.toLocaleString()}`} icon={DollarSign} color="text-green-400" />
              <StatCard title="Transactions" value={stats.transactionCount.toLocaleString()} icon={TrendingUp} />
              <StatCard title="Avg. Transaction" value={`Ksh ${stats.averageTransaction.toLocaleString()}`} icon={User} />
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
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-2 bg-zinc-800/50 rounded-lg">
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
