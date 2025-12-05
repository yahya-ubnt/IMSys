"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { Topbar } from "@/components/topbar"
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle, List, AlertTriangle, Wrench, CheckCircle } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ResponsiveContainer, AreaChart, XAxis, YAxis, Tooltip, Area } from 'recharts';
import { DataTable } from '@/components/data-table';
import { Ticket } from "@/types/ticket";
import { getTickets, getTicketStats, getMonthlyTicketTotals, updateTicket, deleteTicket, getTicketById } from "@/lib/ticketService";
import { getTicketColumns } from "./components/ticket-columns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useReactTable, getCoreRowModel, getPaginationRowModel, getSortedRowModel, getFilteredRowModel, ColumnFiltersState, SortingState, PaginationState } from "@tanstack/react-table";
import { TicketToolbar } from "./components/ticket-toolbar"
import { DataTablePagination } from "@/components/ui/data-table-pagination"

export default function TicketsPage() {
  const { toast } = useToast()


  // Data states
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [stats, setStats] = useState({ total: 0, new: 0, inprogress: 0, resolved: 0 })
  const [monthlyTotals, setMonthlyTotals] = useState<Array<{ month: string; count: number }>>([])
  
  // UI states
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);

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
      const [ticketsData, statsData, monthlyTotalsData] = await Promise.all([
        getTickets(),
        getTicketStats(),
        getMonthlyTicketTotals(selectedYear)
      ]);
      setTickets(ticketsData)
      if (typeof statsData === 'object' && statsData !== null && 'total' in statsData && 'new' in statsData && 'inprogress' in statsData && 'resolved' in statsData) {
        setStats(statsData as { total: number; new: number; inprogress: number; resolved: number; });
      }
      setMonthlyTotals(monthlyTotalsData)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to fetch ticket data."
      setError(msg)
      toast({ title: "Error", description: msg, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [selectedYear, toast])

  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  // --- EVENT HANDLERS ---
  const handleUpdateStatus = async (id: string, status: Ticket['status']) => {
    try {
      await updateTicket(id, { status })
      toast({ title: "Status Updated", description: `Ticket status changed to ${status}.` })
      fetchAllData()
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update status."
      toast({ title: "Error", description: msg, variant: "destructive" })
    }
  }

  const handleDeleteTicket = async () => {
    if (!deleteCandidateId) return;
    try {
      await deleteTicket(deleteCandidateId)
      toast({ title: "Ticket Deleted", description: "Ticket has been successfully deleted." })
      fetchAllData()
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete ticket."
      toast({ title: "Error", description: msg, variant: "destructive" })
    }
    finally {
      setDeleteCandidateId(null)
    }
  }

  const columns = getTicketColumns({ onUpdateStatus: handleUpdateStatus, onDeleteTicket: (id) => setDeleteCandidateId(id) })
  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString())

  const table = useReactTable({
    data: tickets,
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

  if (loading) return <div className="flex h-screen items-center justify-center bg-zinc-900 text-white"></div>
  if (error) return <div className="flex h-screen items-center justify-center bg-zinc-900 text-red-400">{error}</div>

  // --- RENDER ---
  return (
    <>
      <div className="flex flex-col min-h-screen bg-zinc-900 text-white">
        <Topbar />
        <main className="flex-1 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Tickets Dashboard</h1>
              <p className="text-sm text-zinc-400">Manage all client support tickets.</p>
            </div>
            <Button asChild className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg transition-all duration-300 hover:scale-105">
              <Link href="/tickets/new"><PlusCircle className="mr-2 h-4 w-4" /> Create New Ticket</Link>
            </Button>
          </div>

          <div className="bg-zinc-900/50 backdrop-blur-lg shadow-2xl shadow-blue-500/10 rounded-xl">
            <Card className="bg-transparent border-none">
              <CardHeader className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Tickets" value={stats.total || 0} icon={List} />
                <StatCard title="New" value={stats.new || 0} icon={AlertTriangle} color="text-yellow-400" />
                <StatCard title="In Progress" value={stats.inprogress || 0} icon={Wrench} color="text-orange-400" />
                <StatCard title="Resolved" value={stats.resolved || 0} icon={CheckCircle} color="text-green-400" />
              </CardHeader>
              <CardContent className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-zinc-800/50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-semibold text-cyan-400">Monthly Ticket Trends</h3>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                      <SelectTrigger className="w-32 h-8 text-xs bg-zinc-700 border-zinc-600"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-zinc-800 text-white border-zinc-700">{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={monthlyTotals} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                      <defs><linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22d3ee" stopOpacity={0.8}/><stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/></linearGradient></defs>
                      <XAxis dataKey="month" tickFormatter={m => new Date(2000, m - 1).toLocaleString('default', { month: 'short' })} style={{ fontSize: '0.75rem' }} stroke="#888" />
                      <YAxis style={{ fontSize: '0.75rem' }} stroke="#888" />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(100,100,100,0.1)' }} />
                      <Area type="monotone" dataKey="total" stroke="#22d3ee" fill="url(#chartFill)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-zinc-800/50 p-4 rounded-lg">
                  <h3 className="text-sm font-semibold text-cyan-400 mb-2">Quick Actions</h3>
                  <p className="text-xs text-zinc-400">Feature coming soon.</p>
                </div>
              </CardContent>
              <div className="p-4">
                <h3 className="text-sm font-semibold text-cyan-400 mb-2">All Tickets</h3>
                <TicketToolbar table={table} />
                <div className="overflow-x-auto mt-4">
                  <DataTable table={table} columns={columns} />
                </div>
                <DataTablePagination table={table} />
              </div>
            </Card>
          </div>
        </main>
      </div>
      <AlertDialog open={!!deleteCandidateId} onOpenChange={() => setDeleteCandidateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the ticket.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTicket}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const monthName = new Date(2000, label - 1).toLocaleString('default', { month: 'long' });
    return (
      <div className="bg-zinc-800/80 backdrop-blur-sm text-white p-2 rounded-md text-xs border border-zinc-700">
        <p className="font-bold">{monthName}</p>
        <p>{`Tickets: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};
