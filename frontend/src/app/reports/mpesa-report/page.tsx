"use client"

import { useState } from "react"
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  ColumnDef,
} from "@tanstack/react-table"
import { Topbar } from "@/components/topbar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/data-table"
import { columns } from "./columns"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import { Calendar, BarChart2, Download } from "lucide-react"

// --- TYPE DEFINITIONS ---
interface MpesaTransaction {
  Number: number;
  'Transaction ID': string;
  'Official Name': string;
  Amount: number;
  'Date & Time': string;
}

function isAccessorColumn(column: ColumnDef<MpesaTransaction>): column is ColumnDef<MpesaTransaction> & { accessorKey: string } {
    return 'accessorKey' in column;
}

// --- MAIN COMPONENT ---
export default function MpesaReportPage() {
  const { toast } = useToast()
  
  // Data states
  const [reportData, setReportData] = useState<MpesaTransaction[]>([])
  const [totalAmount, setTotalAmount] = useState(0)
  
  // UI states
  const [isLoading, setIsLoading] = useState(false)
  const [showReport, setShowReport] = useState(false)

  // Form states
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const table = useReactTable({
    data: reportData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  // --- EVENT HANDLERS ---
  const handleGenerateReport = async () => {
    if (!startDate || !endDate) {
      return toast({ title: 'Missing Information', description: 'Please select a start and end date.', variant: 'destructive' })
    }
    setIsLoading(true)
    setShowReport(false)
    try {
      const response = await fetch('/api/reports/mpesa-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate, endDate }),
      })
      if (!response.ok) throw new Error('Failed to generate report')
      
      const data = await response.json()
      setReportData(data.reportData)
      setTotalAmount(data.totalAmount)
      setShowReport(true)
    } catch {
      toast({ title: 'Error', description: 'Failed to generate report.', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = () => {
    if (!reportData || reportData.length === 0) {
      toast({ title: 'No Data', description: 'There is no data to export.', variant: 'destructive' });
      return;
    }

    const exportableColumns = columns.filter(isAccessorColumn);

    const csvHeader = exportableColumns.map(c => c.header as string).join(',');

    const csvRows = reportData.map(row => {
      return exportableColumns.map(col => {
        const cellValue = row[col.accessorKey as keyof MpesaTransaction];
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
    link.setAttribute('download', `mpesa_report_${startDate}_to_${endDate}.csv`);
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
            <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">M-Pesa Transaction Report</h1>
            <p className="text-sm text-zinc-400">Generate a report of all M-Pesa transactions within a date range.</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Mobile: Icon-only button */}
            <Button onClick={handleExport} size="icon" className="sm:hidden bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg transition-all duration-300 hover:scale-105" disabled={!showReport}>
              <Download className="h-4 w-4" />
            </Button>
            {/* Desktop: Full button */}
            <Button onClick={handleExport} className="hidden sm:flex bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg transition-all duration-300 hover:scale-105" disabled={!showReport}>
              <Download className="mr-2 h-4 w-4" /> Export Report
            </Button>
          </div>
        </div>

        <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="bg-zinc-900/50 backdrop-blur-lg shadow-2xl shadow-blue-500/10 rounded-xl">
          <Card className="bg-transparent border-none">
            <CardHeader>
              <CardTitle className="text-cyan-400">Report Filters</CardTitle>
              <CardDescription className="text-zinc-400">Select a date range to generate the report.</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InputGroup icon={Calendar} label="Start Date">
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-zinc-800 border-zinc-700 focus:ring-cyan-500" />
                </InputGroup>
                <InputGroup icon={Calendar} label="End Date">
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-zinc-800 border-zinc-700 focus:ring-cyan-500" />
                </InputGroup>
                <Button onClick={handleGenerateReport} disabled={isLoading} className="self-end w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white">
                  <BarChart2 className="mr-2 h-4 w-4" />
                  {isLoading ? 'Generating...' : 'Generate Report'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <AnimatePresence>
          {showReport && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="bg-zinc-900/50 backdrop-blur-lg shadow-2xl shadow-blue-500/10 rounded-xl">
              <Card className="bg-transparent border-none">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-cyan-400">Report Results</CardTitle>
                    <CardDescription className="text-zinc-400">
                      Transactions from {startDate} to {endDate}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-zinc-400">Total Amount</p>
                    <p className="text-2xl font-bold text-green-400">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'KES' }).format(totalAmount)}
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <DataTable table={table} columns={columns} />
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

// --- SUB-COMPONENTS ---
const InputGroup = ({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) => (
  <div className="space-y-2">
    <Label className="text-zinc-300 flex items-center gap-2"><Icon className="w-4 h-4" /> {label}</Label>
    {children}
  </div>
)
