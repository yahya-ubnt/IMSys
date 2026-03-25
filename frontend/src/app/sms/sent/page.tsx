"use client"

import { useState, useEffect, useCallback } from "react"
import {
  SortingState,
  useReactTable,
  getCoreRowModel,
  PaginationState,
  getFilteredRowModel,
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
import { FileDown, Printer, Copy, MessageSquare, CheckCircle, XCircle, Search } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { SmsDetailsModal } from "@/components/SmsDetailsModal"
import { retrySms } from "@/lib/api/sms"

// --- TYPE DEFINITIONS ---
export type SmsLog = {
  _id: string;
  mobileNumber: string;
  message: string;
  smsStatus: 'Success' | 'Failed' | 'Pending' | 'Submitted' | 'RequiresManualIntervention';
  messageType: 'Acknowledgement' | 'Expiry Alert' | 'Compose';
  createdAt: string;
  providerResponse: {
    message?: string;
  };
  retryCount: number;
};

// --- MAIN COMPONENT ---
export default function SentSmsLogPage() {
  const { toast } = useToast()
  
  // Data states
  const [data, setData] = useState<SmsLog[]>([])
  const [stats, setStats] = useState({ total: 0, success: 0, failed: 0 })
  const [pageCount, setPageCount] = useState(0)

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedSms, setSelectedSms] = useState<SmsLog | null>(null)

  // Filter states
  const [globalFilter, setGlobalFilter] = useState("")
  const [messageTypeFilter, setMessageTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)

  // Table states
  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  const [sorting, setSorting] = useState<SortingState>([])

  const [retryingId, setRetryingId] = useState<string | null>(null);

  const handleViewDetails = (sms: SmsLog) => {
    setSelectedSms(sms)
    setIsModalOpen(true)
  }

  const handleRetry = async (logId: string) => {
    setRetryingId(logId);
    try {
      const result = await retrySms(logId); // retrySms now returns { message, status }
      if (result.status === 'Success') {
        toast({
          title: "Success",
          description: "SMS sent successfully.",
        });
      } else if (result.status === 'RequiresManualIntervention') {
        toast({
          title: "Failed",
          description: "SMS failed, requires manual intervention.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Info",
          description: result.message || "SMS retry processed.",
        });
      }

      // Directly update the status of the specific log in the data array
      setData(prevData => prevData.map(log => 
        log._id === logId ? { ...log, smsStatus: result.status as SmsLog['smsStatus'] } : log
      ));

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to retry SMS.",
        variant: "destructive",
      });
    } finally {
      setRetryingId(null);
    }
  };

  // --- DATA FETCHING ---
  const fetchSmsLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: (pageIndex + 1).toString(),
        limit: pageSize.toString(),
        ...(globalFilter && { search: globalFilter }), // Use globalFilter as search term
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
  }, [pageIndex, pageSize, globalFilter, messageTypeFilter, statusFilter, dateRange, toast])

  useEffect(() => {
    fetchSmsLogs()
  }, [fetchSmsLogs])

  const table = useReactTable({
    data,
    columns: columns(handleViewDetails, handleRetry, retryingId),
    pageCount,
    state: {
      sorting,
      pagination: { pageIndex, pageSize },
      globalFilter,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(), // Add this for global filter
    globalFilterFn: fuzzyFilter, // Add this line
    manualPagination: true,
    manualSorting: true,
  })

  // --- EVENT HANDLERS ---
  const handleExportCsv = () => {
    const params = new URLSearchParams({
      ...(globalFilter && { search: globalFilter }),
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
      ...(globalFilter && { search: globalFilter }),
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
      ...(globalFilter && { search: globalFilter }),
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
              <div className="flex items-center">
                <Button size="icon" className="sm:hidden bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg transition-all duration-300 hover:scale-105">
                  <FileDown className="h-4 w-4" />
                </Button>
                <Button className="hidden sm:flex bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg transition-all duration-300 hover:scale-105">
                  <FileDown className="mr-2 h-4 w-4" /> Export / Actions
                </Button>
              </div>
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
              <DataTableToolbar table={table} messageTypeFilter={messageTypeFilter} setMessageTypeFilter={setMessageTypeFilter} statusFilter={statusFilter} setStatusFilter={setStatusFilter} dateRange={dateRange} setDateRange={setDateRange} />
              <div className="overflow-x-auto">
                <DataTable columns={columns(handleViewDetails, handleRetry, retryingId)} table={table} />
              </div>
              <DataTablePagination table={table} />
            </CardContent>
          </Card>
        </div>
      </main>
      <SmsDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        sms={selectedSms}
      />
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

const DataTableToolbar = ({ table, messageTypeFilter, setMessageTypeFilter, statusFilter, setStatusFilter, dateRange, setDateRange }: { table: ReturnType<typeof useReactTable<SmsLog>>; messageTypeFilter: string; setMessageTypeFilter: (value: string) => void; statusFilter: string; setStatusFilter: (value: string) => void; dateRange: DateRange | undefined; setDateRange: (value: DateRange | undefined) => void; }) => {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-2 bg-zinc-800/50 rounded-lg">
      <div className="relative w-full sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <Input
          placeholder="Search all columns..."
          value={(table.getState().globalFilter as string) ?? ""}
          onChange={(event) => table.setGlobalFilter(event.target.value)}
          className="pl-10 h-9 bg-zinc-800 border-zinc-700 w-full"
        />
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
        <Select value={messageTypeFilter} onValueChange={setMessageTypeFilter}>
          <SelectTrigger className="h-9 bg-zinc-800 border-zinc-700 w-full"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-zinc-800 text-white border-zinc-700">
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Acknowledgement">Acknowledgement</SelectItem>
            <SelectItem value="Expiry Alert">Expiry Alert</SelectItem>
            <SelectItem value="Compose">Compose</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 bg-zinc-800/50 border-zinc-700 w-full"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-zinc-800 text-white border-zinc-700">
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Success">Success</SelectItem>
            <SelectItem value="Failed">Failed</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="RequiresManualIntervention">Retry Needed</SelectItem>
          </SelectContent>
        </Select>
        <CalendarDateRangePicker date={dateRange} setDate={setDateRange} className="w-full" />
      </div>
    </div>
  );
};

// Custom fuzzy filter function for global search
const fuzzyFilter = (row: any, columnId: string, filterValue: string) => {
  const search = filterValue.toLowerCase();

  // Fields to search across
  const mobileNumber = row.original.mobileNumber?.toLowerCase() || '';
  const message = row.original.message?.toLowerCase() || '';
  const smsStatus = row.original.smsStatus?.toLowerCase() || '';
  const messageType = row.original.messageType?.toLowerCase() || '';

  return (
    mobileNumber.includes(search) ||
    message.includes(search) ||
    smsStatus.includes(search) ||
    messageType.includes(search)
  );
};