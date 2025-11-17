"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  PaginationState,
} from "@tanstack/react-table"
import { Topbar } from "@/components/topbar"
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTable } from "@/components/data-table"
import { DataTablePagination } from "@/components/ui/data-table-pagination"
import { columns } from "./columns"
import { CalendarDateRangePicker } from "@/components/date-range-picker"
import { DateRange } from "react-day-picker"
import { useToast } from "@/hooks/use-toast"
import { FileDown, Printer, Copy, MessageSquare, CheckCircle, XCircle } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// --- TYPE DEFINITIONS ---
export type SmsLog = {
  _id: string;
  mobileNumber: string;
  message: string;
  smsStatus: 'Success' | 'Failed' | 'Pending' | 'Submitted';
  messageType: 'Acknowledgement' | 'Expiry Alert' | 'Manual';
  createdAt: string;
};

// --- MAIN COMPONENT ---
export default function SentSmsLogPage() {
  const { toast } = useToast()
  
  // Data states
  const [data, setData] = useState<SmsLog[]>([])
  const [stats, setStats] = useState({ total: 0, success: 0, failed: 0 })
  const [pageCount, setPageCount] = useState(0)

  // Filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [messageTypeFilter, setMessageTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)

  // Table states
  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  const [sorting, setSorting] = useState<SortingState>([])

  // --- DATA FETCHING ---
  const fetchSmsLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: (pageIndex + 1).toString(),
        limit: pageSize.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(messageTypeFilter !== "all" && { messageType: messageTypeFilter }),
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(dateRange?.from && { startDate: dateRange.from.toISOString() }),
        ...(dateRange?.to && { endDate: dateRange.to.toISOString() }),
      })

      const response = await fetch(`/api/sms/log?${params.toString()}`)
      if (!response.ok) throw new Error("Failed to fetch sent SMS logs")
      
      const responseData = await response.json()
      setData(responseData.logs || [])
      setPageCount(responseData.pages || 0)
      setStats(responseData.stats || { total: 0, success: 0, failed: 0 })
    } catch {
      toast({ title: "Error", description: "Failed to load sent SMS logs.", variant: "destructive" })
    }
  }, [pageIndex, pageSize, searchQuery, messageTypeFilter, statusFilter, dateRange, toast])

  useEffect(() => {
    fetchSmsLogs()
  }, [fetchSmsLogs])

  const table = useReactTable({
    data,
    columns,
    pageCount,
    state: {
      sorting,
      pagination: { pageIndex, pageSize },
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
  })

  // --- EVENT HANDLERS ---
  const handleExportCsv = () => {
    const params = new URLSearchParams({
      ...(searchQuery && { search: searchQuery }),
      ...(messageTypeFilter !== "all" && { messageType: messageTypeFilter }),
      ...(statusFilter !== "all" && { status: statusFilter }),
      ...(dateRange?.from && { startDate: dateRange.from.toISOString() }),
      ...(dateRange?.to && { endDate: dateRange.to.toISOString() }),
    });
    const exportUrl = `/api/sms/log/export?${params.toString()}`;
    window.location.href = exportUrl;
  };

  const handleExportXlsx = () => {
    const params = new URLSearchParams({
      format: 'xlsx',
      ...(searchQuery && { search: searchQuery }),
      ...(messageTypeFilter !== "all" && { messageType: messageTypeFilter }),
      ...(statusFilter !== "all" && { status: statusFilter }),
      ...(dateRange?.from && { startDate: dateRange.from.toISOString() }),
      ...(dateRange?.to && { endDate: dateRange.to.toISOString() }),
    });
    const exportUrl = `/api/sms/log/export?${params.toString()}`;
    window.location.href = exportUrl;
  };

  const handleExportPdf = () => {
    const params = new URLSearchParams({
      format: 'pdf',
      ...(searchQuery && { search: searchQuery }),
      ...(messageTypeFilter !== "all" && { messageType: messageTypeFilter }),
      ...(statusFilter !== "all" && { status: statusFilter }),
      ...(dateRange?.from && { startDate: dateRange.from.toISOString() }),
      ...(dateRange?.to && { endDate: dateRange.to.toISOString() }),
    });
    const exportUrl = `/api/sms/log/export?${params.toString()}`;
    window.location.href = exportUrl;
  };

  const handlePrint = () => toast({ title: "Print", description: "Printing logs..." })
  const handleCopy = () => toast({ title: "Copy", description: "Copying logs to clipboard..." })

  // --- RENDER ---
  return (
    <div className="flex flex-col min-h-screen bg-zinc-900 text-white">
      <Topbar />
      <main className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Sent SMS Log</h1>
            <p className="text-sm text-zinc-400">Review and manage all outgoing SMS messages.</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg transition-all duration-300 hover:scale-105">
                <FileDown className="mr-2 h-4 w-4" /> Export / Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-zinc-800 text-white border-zinc-700">
              <DropdownMenuItem onClick={handleExportCsv}><Copy className="mr-2 h-4 w-4" /> Export as CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportXlsx}><Copy className="mr-2 h-4 w-4" /> Export as Excel</DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPdf}><FileDown className="mr-2 h-4 w-4" /> Export as PDF</DropdownMenuItem>
              <DropdownMenuItem onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Print</DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopy}><Copy className="mr-2 h-4 w-4" /> Copy to Clipboard</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="bg-zinc-900/50 backdrop-blur-lg shadow-2xl shadow-blue-500/10 rounded-xl">
          <Card className="bg-transparent border-none">
            <CardHeader className="p-4 border-b border-zinc-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard title="Total Sent" value={stats.total} icon={MessageSquare} />
              <StatCard title="Successful" value={stats.success} icon={CheckCircle} color="text-green-400" />
              <StatCard title="Failed" value={stats.failed} icon={XCircle} color="text-red-400" />
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <DataTableToolbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} messageTypeFilter={messageTypeFilter} setMessageTypeFilter={setMessageTypeFilter} statusFilter={statusFilter} setStatusFilter={setStatusFilter} dateRange={dateRange} setDateRange={setDateRange} />
              <div className="overflow-x-auto">
                <DataTable columns={columns} table={table} />
              </div>
              <DataTablePagination table={table} />
            </CardContent>
          </Card>
        </div>
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
  const { searchQuery, setSearchQuery, messageTypeFilter, setMessageTypeFilter, statusFilter, setStatusFilter, dateRange, setDateRange } = props;
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-2 bg-zinc-800/50 rounded-lg">
      <Input
        placeholder="Search..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="h-9 bg-zinc-800 border-zinc-700 w-full sm:max-w-xs"
      />
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Select value={messageTypeFilter} onValueChange={setMessageTypeFilter}>
          <SelectTrigger className="h-9 bg-zinc-800 border-zinc-700 w-full"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-zinc-800 text-white border-zinc-700">
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Acknowledgement">Acknowledgement</SelectItem>
            <SelectItem value="Expiry Alert">Expiry Alert</SelectItem>
            <SelectItem value="Manual">Manual</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 bg-zinc-800 border-zinc-700 w-full"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-zinc-800 text-white border-zinc-700">
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Success">Success</SelectItem>
            <SelectItem value="Failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        <CalendarDateRangePicker date={dateRange} setDate={setDateRange} />
      </div>
    </div>
  );
};