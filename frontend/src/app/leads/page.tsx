"use client"

import { useState, useEffect, useCallback } from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  PaginationState,
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
} from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { DataTablePagination } from "@/components/ui/data-table-pagination"
import { getColumns } from "./columns"
import { Lead, DashboardStatsProps, MonthlyLeadData } from "@/types/lead"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { getLeads, updateLeadStatus } from "@/lib/leadService"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts"
import { List, UserPlus, CheckCircle, PlusCircle, BarChart2, Users } from "lucide-react"
import { Topbar } from "@/components/topbar"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

// --- MAIN COMPONENT ---
export default function LeadsPage() {
  const { toast } = useToast()
  const router = useRouter()

  // Data states
  const [leads, setLeads] = useState<Lead[]>([])
  const [dashboardStats, setDashboardStats] = useState<DashboardStatsProps>({ totalLeads: 0, newLeadsThisMonth: 0, totalConvertedLeads: 0 })
  const [chartData, setChartData] = useState<MonthlyLeadData[]>([])
  
  // UI states
  const [isLoading, setIsLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);
  const [convertCandidate, setConvertCandidate] = useState<Lead | null>(null);
  
  // Table states
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  // --- DATA FETCHING ---
  const fetchLeads = useCallback(async () => {
    setIsLoading(true)
    try {
      const { leads, dashboardStats, chartData } = await getLeads(selectedYear)
      setLeads(leads)
      setDashboardStats(dashboardStats)
      setChartData(chartData)
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch leads.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }, [selectedYear, toast])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  // --- EVENT HANDLERS ---
  const handleDeleteLead = async () => {
    if (!deleteCandidateId) return
    try {
      const response = await fetch(`/api/leads/${deleteCandidateId}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Failed to delete lead")
      toast({ title: "Lead Deleted", description: "Lead has been successfully deleted." })
      fetchLeads()
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete lead.", variant: "destructive" })
    }
    finally {
      setDeleteCandidateId(null)
    }
  }

  const handleConvertLead = async () => {
    if (!convertCandidate) return
    try {
      await updateLeadStatus(convertCandidate._id, "Converted", false)
      toast({ title: "Lead Converted", description: "Lead has been successfully converted." })
      fetchLeads()
    } catch (error) {
      toast({ title: "Error", description: "Failed to convert lead.", variant: "destructive" })
    }
    finally {
      setConvertCandidate(null)
    }
  }

  const table = useReactTable({
    data: leads,
    columns: getColumns((id) => setDeleteCandidateId(id), (lead) => setConvertCandidate(lead)),
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

  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString())

  if (isLoading) return <div className="flex h-screen items-center justify-center bg-zinc-900 text-white">Loading...</div>

  return (
    <>
      <div className="flex flex-col min-h-screen bg-zinc-900 text-white">
        <Topbar />
        <main className="flex-1 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">All Leads</h1>
              <p className="text-sm text-zinc-400">Manage and track all your potential customers.</p>
            </div>
            <Button asChild className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg transition-all duration-300 hover:scale-105">
              <Link href="/leads/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Lead
              </Link>
            </Button>
          </div>

          <div className="bg-zinc-900/50 backdrop-blur-lg rounded-xl">
            <Card className="bg-transparent border-none">
              <CardHeader className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard title="Total Leads" value={dashboardStats.totalLeads} icon={List} />
                  <StatCard title="New This Month" value={dashboardStats.newLeadsThisMonth} icon={UserPlus} color="text-yellow-400" />
                  <StatCard title="Converted This Month" value={dashboardStats.totalConvertedLeads} icon={CheckCircle} color="text-green-400" />
                  <StatCard title="Total Converted" value={dashboardStats.totalConvertedLeads} icon={CheckCircle} color="text-green-400" />
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-zinc-800/50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-semibold text-cyan-400 flex items-center gap-2"><BarChart2 size={16}/> Monthly Lead Trends</h3>
                      <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger className="w-32 h-8 text-xs bg-zinc-700 border-zinc-600"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-zinc-800 text-white border-zinc-700">{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <defs>
                          <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="month" tickFormatter={m => new Date(2000, m - 1).toLocaleString('default', { month: 'short' })} style={{ fontSize: '0.75rem' }} stroke="#888" />
                        <YAxis style={{ fontSize: '0.75rem' }} stroke="#888" />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(100,100,100,0.1)' }} />
                        <Area type="monotone" dataKey="newLeads" stroke="#22d3ee" fill="url(#chartFill)" name="New Leads" fillOpacity={1} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <DonutChartCard 
                    total={dashboardStats.totalLeads} 
                    converted={dashboardStats.totalConvertedLeads} 
                  />
                </div>
                <div className="p-4 mt-4">
                  <DataTable
                    table={table}
                    columns={getColumns((id) => setDeleteCandidateId(id), (lead) => setConvertCandidate(lead))}
                  />
                  <DataTablePagination table={table} />
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
      <AlertDialog open={!!deleteCandidateId} onOpenChange={() => setDeleteCandidateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the lead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLead}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={!!convertCandidate} onOpenChange={() => setConvertCandidate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Convert Lead</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to convert "{convertCandidate?.name}" to a client?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConvertLead}>Convert</AlertDialogAction>
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

const DonutChartCard = ({ total, converted }: { total: number, converted: number }) => {
    const other = total - converted;
    const data = [
        { name: 'Converted', value: converted },
        { name: 'Other', value: other },
    ];
    return (
        <div className="bg-zinc-800/50 p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-cyan-400 mb-2 flex items-center gap-2"><Users size={16}/> Lead Status</h3>
            <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                    <defs>
                        <linearGradient id="convertedFill"><stop offset="0%" stopColor="#10b981" /><stop offset="100%" stopColor="#34d399" /></linearGradient>
                        <linearGradient id="otherFill"><stop offset="0%" stopColor="#f59e0b" /><stop offset="100%" stopColor="#fbbf24" /></linearGradient>
                    </defs>
                    <Pie data={data} dataKey="value" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} stroke="none">
                        <Cell key="converted" fill="url(#convertedFill)" />
                        <Cell key="other" fill="url(#otherFill)" />
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: '0.75rem' }} />
                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize="24" fontWeight="bold">{total}</text>
                    <text x="50%" y="65%" textAnchor="middle" dominantBaseline="middle" fill="#aaa" fontSize="12">Total Leads</text>
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const monthName = new Date(2000, label - 1).toLocaleString('default', { month: 'long' });
    const newLeads = payload.find((p: any) => p.dataKey === 'newLeads')?.value || 0;
    return (
      <div className="bg-zinc-800/80 backdrop-blur-sm text-white p-2 rounded-md text-xs border border-zinc-700">
        <p className="font-bold">{monthName || payload[0].name}</p>
        <p style={{ color: '#22d3ee' }}>{payload[0].name}: {payload[0].value}</p>
      </div>
    );
  }
  return null;
};
