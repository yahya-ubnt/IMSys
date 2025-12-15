"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarDateRangePicker } from "@/components/date-range-picker"
import { BarChart2 } from "lucide-react"
import { DateRange } from "react-day-picker"
import { Label } from "@/components/ui/label";
import { Topbar } from "@/components/topbar";
import { motion } from "framer-motion";

interface ReportData {
  SN: number;
  'Official Name': string;
  'Total Amount': number;
  Type: string;
  'Reference Number': string;
}

interface MikrotikUser {
    _id: string;
    officialName: string;
    apartment_house_number?: string;
  }

export default function LocationReportPage() {
  const { toast } = useToast()
  const [date, setDate] = useState<DateRange | undefined>()
  const [apartmentHouseNumbers, setApartmentHouseNumbers] = useState<string[]>([])
  const [selectedApartmentHouseNumber, setSelectedApartmentHouseNumber] = useState('')
  const [reportData, setReportData] = useState<ReportData[]>([])
  const [totalAmount, setTotalAmount] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchApartmentHouseNumbers = async () => {
      try {
        const response = await fetch('/api/mikrotik/users')
        if (!response.ok) throw new Error('Failed to fetch users')
        const users: MikrotikUser[] = await response.json()
        const uniqueApartmentHouseNumbers = ['All', ...Array.from(new Set(users.map(user => user.apartment_house_number).filter(Boolean)))];
        setApartmentHouseNumbers(uniqueApartmentHouseNumbers as string[]);
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to load locations.', variant: 'destructive' })
      }
    }
    fetchApartmentHouseNumbers()
  }, [toast])

  const handleGenerateReport = async () => {
    if (!date?.from || !date?.to || !selectedApartmentHouseNumber) {
      toast({ title: 'Missing Information', description: 'Please select a date range and location.', variant: 'destructive' })
      return
    }
    setLoading(true)
    try {
      const response = await fetch('/api/reports/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate: date.from, endDate: date.to, apartment_house_number: selectedApartmentHouseNumber }),
      })
      if (!response.ok) throw new Error('Failed to generate report')
      const { reportData, totalAmount } = await response.json()
      setReportData(reportData)
      setTotalAmount(totalAmount)
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to generate report.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-zinc-900 text-white">
      <Topbar />
      <main className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Location-Based Revenue Report</h1>
            <p className="text-sm text-zinc-400">View revenue generated from specific apartment/house numbers.</p>
          </div>
        </div>

        <motion.div
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-zinc-900/50 backdrop-blur-lg shadow-2xl shadow-blue-500/10 rounded-xl"
        >
          <Card className="bg-transparent border-none text-white">
            <CardHeader>
              <CardTitle className="text-cyan-400 flex items-center gap-2"><BarChart2 /> Report Filters</CardTitle>
              <CardDescription className="text-zinc-400">Select criteria to generate the revenue report.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                <div className="space-y-1">
                  <Label htmlFor="date-range">Date Range</Label>
                  <CalendarDateRangePicker date={date} setDate={setDate} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="location-select">Location</Label>
                  <Select value={selectedApartmentHouseNumber || ''} onValueChange={setSelectedApartmentHouseNumber}>
                    <SelectTrigger id="location-select" className="bg-zinc-800 border-zinc-700 focus:ring-cyan-500">
                      <SelectValue placeholder="Select a location" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                      {apartmentHouseNumbers.map((ahn) => <SelectItem key={ahn} value={ahn} className="focus:bg-zinc-800">{ahn}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleGenerateReport} disabled={loading} className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:scale-100 md:col-span-2 lg:col-span-1">
                  {loading ? 'Generating...' : 'Generate Report'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

          {reportData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-zinc-900/50 backdrop-blur-lg shadow-2xl shadow-blue-500/10 rounded-xl mt-6"
            >
              <Card className="bg-transparent border-none text-white">
                <CardHeader>
                  <CardTitle className="text-cyan-400">Report Results</CardTitle>
                  <CardDescription className="text-zinc-400">
                    Total revenue from {selectedApartmentHouseNumber} from {date?.from ? date.from.toLocaleDateString() : 'N/A'} to {date?.to ? date.to.toLocaleDateString() : 'N/A'} is KES {totalAmount.toLocaleString()}.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-zinc-400">
                      <thead className="text-xs uppercase bg-zinc-800 text-zinc-300">
                        <tr>
                          <th scope="col" className="px-6 py-3">SN</th>
                          <th scope="col" className="px-6 py-3">Official Name</th>
                          <th scope="col" className="px-6 py-3">Total Amount</th>
                          <th scope="col" className="px-6 py-3">Type</th>
                          <th scope="col" className="px-6 py-3">Reference Number</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.map((row) => (
                          <tr key={row.SN} className="bg-zinc-900 border-b border-zinc-700 hover:bg-zinc-800">
                            <td className="px-6 py-4 font-medium text-white whitespace-nowrap">{row.SN}</td>
                            <td className="px-6 py-4">{row['Official Name']}</td>
                            <td className="px-6 py-4">KES {row['Total Amount'].toLocaleString()}</td>
                            <td className="px-6 py-4">{row.Type}</td>
                            <td className="px-6 py-4">{row['Reference Number']}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </main>
    </div>
  )
}
