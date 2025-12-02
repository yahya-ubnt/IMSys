"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Topbar } from "@/components/topbar"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { PlusCircle, FileText, AlertTriangle, CircleDollarSign, CheckCircle } from "lucide-react"
import { DataTable } from '@/components/data-table'
import { Invoice, getInvoiceColumns } from "./components/invoice-columns"
import { useReactTable, getCoreRowModel, getPaginationRowModel, getSortedRowModel, getFilteredRowModel, ColumnFiltersState, SortingState, PaginationState } from "@tanstack/react-table"
import { DataTablePagination } from "@/components/ui/data-table-pagination"
import { Card, CardContent, CardHeader } from "@/components/ui/card";

// A simple toolbar can be added later if needed, similar to TicketToolbar

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


export default function InvoicesPage() {
  const { toast } = useToast()
  const router = useRouter()

  // Data states
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [stats, setStats] = useState({ total: 0, unpaid: 0, overdue: 0, totalUnpaidAmount: 0 })
  
  // UI states
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Table states
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  // --- DATA FETCHING ---
  const fetchAllData = useCallback(async () => {
    setLoading(true)
    try {
      // TODO: Refactor into a dedicated service file e.g., /lib/invoiceService.ts
      const [invoicesRes, statsRes] = await Promise.all([
        fetch("/api/invoices"),
        fetch("/api/invoices/stats")
      ]);

      if (!invoicesRes.ok || !statsRes.ok) {
        throw new Error(`Failed to fetch data`)
      }

      const invoicesData = await invoicesRes.json()
      const statsData = await statsRes.json()

      setInvoices(invoicesData)
      setStats(statsData)

    } catch (err) {
      const msg = err instanceof Error ? err.message : "An unknown error occurred."
      setError(msg)
      toast({ title: "Error", description: msg, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  const columns = getInvoiceColumns({
    onViewDetails: (id) => router.push(`/invoices/${id}`)
  });

  const table = useReactTable({
    data: invoices,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      pagination,
    },
  })

  if (loading) return <div className="flex h-screen items-center justify-center bg-zinc-900 text-white">Loading...</div>
  if (error) return <div className="flex h-screen items-center justify-center bg-zinc-900 text-red-400">Error: {error}</div>

  // --- RENDER ---
  return (
    <>
      <div className="flex flex-col min-h-screen bg-zinc-900 text-white">
        <Topbar />
        <main className="flex-1 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Invoices</h1>
              <p className="text-sm text-zinc-400">Manage all customer invoices.</p>
            </div>
            <Button asChild className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg transition-all duration-300 hover:scale-105">
              {/* The link can be updated to the correct route for creating a new invoice */}
              <Link href="/invoices/new"><PlusCircle className="mr-2 h-4 w-4" /> Create Manual Invoice</Link>
            </Button>
          </div>

          <div className="bg-zinc-900/50 backdrop-blur-lg shadow-2xl shadow-blue-500/10 rounded-xl border border-zinc-800">
            <CardHeader className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Invoices" value={stats.total || 0} icon={FileText} />
                <StatCard title="Unpaid" value={stats.unpaid || 0} icon={AlertTriangle} color="text-yellow-400" />
                <StatCard title="Overdue" value={stats.overdue || 0} icon={AlertTriangle} color="text-red-400" />
                <StatCard 
                  title="Total Unpaid Amount" 
                  value={new Intl.NumberFormat("en-US", { style: "currency", currency: "KES" }).format(stats.totalUnpaidAmount || 0)} 
                  icon={CircleDollarSign} 
                  color="text-green-400" 
                />
            </CardHeader>
            <CardContent className="p-4">
              {/* A toolbar for filtering could be added here later */}
              <div className="overflow-x-auto">
                <DataTable table={table} columns={columns} />
              </div>
              <DataTablePagination table={table} />
            </CardContent>
          </div>
        </main>
      </div>
    </>
  )
}
