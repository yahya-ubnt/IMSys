"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { getBills, deleteBill } from "@/lib/billService"
import { Bill } from "@/types/bill"
import { Topbar } from "@/components/topbar"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table"
import { columns } from "../columns"
import { PlusCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BillsSummaryCards } from "@/components/bills-summary-cards"
import { BillsChart } from "@/components/bills-chart"
import { motion } from "framer-motion"

export default function CompanyBillsPage() {
  const router = useRouter()
  const { token } = useAuth()
  const { toast } = useToast()

  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())

  const fetchBills = useCallback(async () => {
    if (!token) {
      setError("Authentication token not found. Please log in.")
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const data = await getBills(token, selectedMonth, selectedYear)
      setBills(data.filter(bill => bill.category === 'Company'))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch bills."
      setError(errorMessage)
      toast({ title: "Error", description: errorMessage, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [token, selectedMonth, selectedYear, toast])

  useEffect(() => {
    fetchBills()
  }, [fetchBills])

  const handleDelete = async (id: string) => {
    if (!token) return toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" })
    if (confirm("Are you sure you want to delete this bill?")) {
      try {
        await deleteBill(id, token)
        toast({ title: "Bill Deleted", description: "Bill has been successfully deleted." })
        fetchBills()
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to delete bill."
        setError(errorMessage)
        toast({ title: "Error", description: errorMessage, variant: "destructive" })
      }
    }
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)
  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  if (loading) return <div className="flex h-screen items-center justify-center bg-zinc-900 text-white">Loading...</div>
  if (error) return <div className="flex h-screen items-center justify-center bg-zinc-900 text-red-400">{error}</div>

  return (
    <div className="flex flex-col min-h-screen bg-zinc-900 text-white">
      <Topbar />
      <main className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Company Bills</h1>
            <p className="text-sm text-zinc-400">Manage your recurring company bills.</p>
          </div>
          <Button onClick={() => router.push('/bills/company/new')} className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg transition-all duration-300 hover:scale-105">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Bill
          </Button>
        </div>

        <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="bg-zinc-900/50 backdrop-blur-lg border border-zinc-700 shadow-2xl shadow-blue-500/10 rounded-xl">
          <Card className="bg-transparent border-none">
            <CardHeader className="p-4 border-b border-zinc-800">
              <BillsSummaryCards bills={bills} />
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 bg-zinc-800/50 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-cyan-400 mb-2">Bills Chart</h3>
                <BillsChart bills={bills} />
              </div>
              <div className="space-y-4 bg-zinc-800/50 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-cyan-400">Filters</h3>
                <div className="flex items-center gap-2">
                  <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                      {months.map(m => <SelectItem key={m} value={m.toString()}>{new Date(selectedYear, m - 1, 1).toLocaleString('default', { month: 'long' })}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 w-32"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                      {years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <div className="p-4 border-t border-zinc-800">
              <h3 className="text-sm font-semibold text-cyan-400 mb-2">Bills Overview</h3>
              <DataTable columns={columns(handleDelete)} data={bills} onRowClick={(bill: Bill) => router.push(`/bills/${bill._id}`)} />
            </div>
          </Card>
        </motion.div>
      </main>
    </div>
  )
}