"use client"

import { useState, useEffect } from "react"
import { Topbar } from "@/components/topbar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/data-table"
import { columns } from "./columns"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import { Building, Calendar, BarChart2, Download } from "lucide-react"

// --- TYPE DEFINITIONS ---
interface Building {
  _id: string;
  name: string;
}

interface ReportData {
  SN: number;
  'Official Name': string;
  'Total Amount': number;
  Type: string;
  'Reference Number': string;
}

// --- MAIN COMPONENT ---
export default function LocationReportPage() {
  const { toast } = useToast()
  
  // Data states
  const [buildings, setBuildings] = useState<Building[]>([])
  const [reportData, setReportData] = useState<ReportData[]>([])
  const [totalAmount, setTotalAmount] = useState(0)
  
  // UI states
  const [isLoading, setIsLoading] = useState(false)
  const [showReport, setShowReport] = useState(false)

  // Form states
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedBuilding, setSelectedBuilding] = useState('')

  // --- DATA FETCHING ---
  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) throw new Error('Authentication token not found.')
        const response = await fetch('/api/buildings', { headers: { 'Authorization': `Bearer ${token}` } })
        if (!response.ok) throw new Error('Failed to fetch buildings')
        setBuildings(await response.json())
      } catch {
        toast({ title: 'Error', description: 'Failed to load buildings.', variant: 'destructive' })
      }
    }
    fetchBuildings()
  }, [toast])

  // --- EVENT HANDLERS ---
  const handleGenerateReport = async () => {
    if (!startDate || !endDate || !selectedBuilding) {
      return toast({ title: 'Missing Information', description: 'Please select a date range and location.', variant: 'destructive' })
    }
    setIsLoading(true)
    setShowReport(false)
    try {
      const token = localStorage.getItem('token')
      if (!token) throw new Error('Authentication token not found.')
      const response = await fetch('/api/reports/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ startDate, endDate, buildingId: selectedBuilding }),
      })
      if (!response.ok) throw new Error('Failed to generate report')
      
      const data = await response.json()
      setReportData(data.reportData)
      setTotalAmount(data.totalAmount)
      setShowReport(true)
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to generate report.', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  // --- RENDER ---
  return (
    <div className="flex flex-col min-h-screen bg-zinc-900 text-white">
      <Topbar />
      <main className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Location Revenue Report</h1>
            <p className="text-sm text-zinc-400">Generate a report of revenue from a specific location.</p>
          </div>
          <Button className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg transition-all duration-300 hover:scale-105" disabled={!showReport}>
            <Download className="mr-2 h-4 w-4" /> Export Report
          </Button>
        </div>

        <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="bg-zinc-900/50 backdrop-blur-lg border border-zinc-700 shadow-2xl shadow-blue-500/10 rounded-xl">
          <Card className="bg-transparent border-none">
            <CardHeader className="border-b border-zinc-800">
              <CardTitle className="text-cyan-400">Report Filters</CardTitle>
              <CardDescription className="text-zinc-400">Select your criteria to generate the report.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <InputGroup icon={Calendar} label="Start Date">
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-zinc-800 border-zinc-700 focus:ring-cyan-500" />
                </InputGroup>
                <InputGroup icon={Calendar} label="End Date">
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-zinc-800 border-zinc-700 focus:ring-cyan-500" />
                </InputGroup>
                <InputGroup icon={Building} label="Location">
                  <Select value={selectedBuilding} onValueChange={setSelectedBuilding}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 focus:ring-cyan-500"><SelectValue placeholder="Select Location" /></SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                      {buildings.map((b) => <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
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
              className="bg-zinc-900/50 backdrop-blur-lg border border-zinc-700 shadow-2xl shadow-blue-500/10 rounded-xl">
              <Card className="bg-transparent border-none">
                <CardHeader className="border-b border-zinc-800 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-cyan-400">Report Results</CardTitle>
                    <CardDescription className="text-zinc-400">
                      For {buildings.find(b => b._id === selectedBuilding)?.name} from {startDate} to {endDate}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-zinc-400">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-400">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'KES' }).format(totalAmount)}
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <DataTable columns={columns} data={reportData} />
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
const InputGroup = ({ icon: Icon, label, children }: any) => (
  <div className="space-y-2">
    <Label className="text-zinc-300 flex items-center gap-2"><Icon className="w-4 h-4" /> {label}</Label>
    {children}
  </div>
)