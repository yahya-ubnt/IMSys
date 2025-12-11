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
import { Topbar } from "@/components/topbar"
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { DataTable } from "@/components/data-table"
import { DataTablePagination } from "@/components/ui/data-table-pagination"
import { columns } from "./columns"
import { SmsExpiryScheduleForm, SmsExpiryScheduleFormData } from "./sms-expiry-schedule-form"
import { PlusCircle, CheckCircle, XCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

// --- TYPE DEFINITIONS ---
export type SmsExpirySchedule = {
  _id: string;
  name: string;
  days: number;
  timing: 'Before' | 'After' | 'Not Applicable';
  messageBody: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
};

export interface TriggerType {
  id: string;
  name: string;
}

// --- MAIN COMPONENT ---
export default function SmsExpiryPage() {
  const { toast } = useToast()

  // Data states
  const [schedules, setSchedules] = useState<SmsExpirySchedule[]>([])
  const [triggerTypes, setTriggerTypes] = useState<TriggerType[]>([])
  
  // UI states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState<SmsExpirySchedule | null>(null)

  // Table states
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  // --- DATA FETCHING ---
  const fetchSchedules = useCallback(async () => {
    try {
      const response = await fetch("/api/smsexpiryschedules")
      if (!response.ok) throw new Error("Failed to fetch schedules")
      setSchedules(await response.json())
    } catch {
      toast({ title: "Error", description: "Failed to load schedules.", variant: "destructive" })
    }
  }, [toast])

  const fetchTriggers = useCallback(async () => {
    try {
      const triggersRes = await fetch("/api/sms/triggers");
      if (!triggersRes.ok) throw new Error("Failed to fetch trigger types");
      setTriggerTypes(await triggersRes.json());
    } catch (error) {
      toast({ title: "Error", description: "Failed to load trigger types.", variant: "destructive" })
    }
  }, [toast]);

  useEffect(() => {
    fetchSchedules()
    fetchTriggers()
  }, [fetchSchedules, fetchTriggers])

  // --- EVENT HANDLERS ---
  const handleNewSchedule = () => {
    setSelectedSchedule(null)
    setIsModalOpen(true)
  }

  const handleEdit = (schedule: SmsExpirySchedule) => {
    setSelectedSchedule(schedule)
    setIsModalOpen(true)
  }

  const handleDelete = async (schedule: SmsExpirySchedule) => {
    if (!window.confirm("Are you sure you want to delete this schedule?")) return;
    try {
      const response = await fetch(`/api/smsexpiryschedules/${schedule._id}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Failed to delete schedule")
      toast({ title: "Success", description: "Schedule deleted successfully." })
      fetchSchedules()
    } catch {
      toast({ title: "Error", description: "Could not delete schedule.", variant: "destructive" })
    }
  }

  const handleFormSubmit = async (data: SmsExpiryScheduleFormData) => {
    const url = selectedSchedule ? `/api/smsexpiryschedules/${selectedSchedule._id}` : "/api/smsexpiryschedules"
    const method = selectedSchedule ? "PUT" : "POST"
    
    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error((await response.json()).message || "Failed to save schedule")
      
      toast({ title: "Success", description: `Schedule ${selectedSchedule ? 'updated' : 'created'} successfully.` })
      setIsModalOpen(false)
      fetchSchedules()
    } catch (error: unknown) {
      toast({ title: "Error", description: (error instanceof Error) ? error.message : "An unknown error occurred.", variant: "destructive" })
    }
  }

  const table = useReactTable({
    data: schedules,
    columns: columns({ handleEdit, handleDelete }),
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

  const activeSchedules = schedules.filter(s => s.status === 'Active').length
  const inactiveSchedules = schedules.length - activeSchedules

  // --- RENDER ---
  return (
    <div className="flex flex-col min-h-screen bg-zinc-900 text-white">
      <Topbar />
      <main className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">SMS Expiry Schedules</h1>
            <p className="text-sm text-zinc-400">Manage automated SMS expiry notifications.</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Mobile: Icon-only button */}
            <Button onClick={handleNewSchedule} size="icon" className="sm:hidden bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg transition-all duration-300 hover:scale-105">
              <PlusCircle className="h-4 w-4" />
            </Button>
            {/* Desktop: Full button */}
            <Button onClick={handleNewSchedule} className="hidden sm:flex bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg transition-all duration-300 hover:scale-105">
              <PlusCircle className="mr-2 h-4 w-4" /> New Schedule
            </Button>
          </div>
        </div>

        <div className="bg-zinc-900/50 backdrop-blur-lg shadow-2xl shadow-blue-500/10 rounded-xl">
          <Card className="bg-transparent border-none">
            <CardHeader className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard title="Total Schedules" value={schedules.length} icon={PlusCircle} />
              <StatCard title="Active" value={activeSchedules} icon={CheckCircle} color="text-green-400" />
              <StatCard title="Inactive" value={inactiveSchedules} icon={XCircle} color="text-yellow-400" />
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="overflow-x-auto">
                <DataTable table={table} columns={columns({ handleEdit, handleDelete })} />
              </div>
              <DataTablePagination table={table} />
            </CardContent>
          </Card>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="bg-zinc-900/80 backdrop-blur-lg border-zinc-700 text-white">
            <DialogHeader>
              <DialogTitle className="text-cyan-400">{selectedSchedule ? "Edit Schedule" : "Create New Schedule"}</DialogTitle>
              <DialogDescription className="text-zinc-400">
                {selectedSchedule ? "Update the details for your automated SMS schedule." : "Fill in the details to create a new automated SMS schedule."}
              </DialogDescription>
            </DialogHeader>
            <SmsExpiryScheduleForm
              onSubmit={handleFormSubmit}
              initialData={selectedSchedule}
              onClose={() => setIsModalOpen(false)}
            />
          </DialogContent>
        </Dialog>
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