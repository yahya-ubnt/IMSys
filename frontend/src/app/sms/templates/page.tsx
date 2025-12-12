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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import { DataTable } from "@/components/data-table"
import { SimpleDataTablePagination } from "@/components/ui/simple-data-table-pagination"
import { columns } from "./columns"
import { SmsTemplateForm, SmsTemplateFormData } from "./sms-template-form"
import { PlusCircle, FileText } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { getSmsTemplates, createSmsTemplate, updateSmsTemplate, deleteSmsTemplate } from "@/lib/api/sms"
import { SmsTemplate } from "@/types/sms"

// --- MAIN COMPONENT ---
export default function SmsTemplatesPage() {
  const { toast } = useToast()
  const { user } = useAuth()

  // Data states
  const [templates, setTemplates] = useState<SmsTemplate[]>([])
  
  // UI states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<SmsTemplate | null>(null)

  // Table states
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  // --- DATA FETCHING ---
  const fetchTemplates = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getSmsTemplates()
      setTemplates(data)
    } catch {
      toast({ title: "Error", description: "Failed to load templates.", variant: "destructive" })
    }
  }, [toast, user])

  useEffect(() => {
    if (user) {
      fetchTemplates()
    }
  }, [fetchTemplates, user])

  // --- EVENT HANDLERS ---
  const handleNewTemplate = () => {
    setSelectedTemplate(null)
    setIsModalOpen(true)
  }

  const handleEdit = (template: SmsTemplate) => {
    setSelectedTemplate(template)
    setIsModalOpen(true)
  }

  const handleDelete = async (template: SmsTemplate) => {
    if (!window.confirm("Are you sure you want to delete this template?")) return;
    if (!user) return;
    try {
      await deleteSmsTemplate(template._id!)
      toast({ title: "Success", description: "Template deleted successfully." })
      fetchTemplates()
    } catch {
      toast({ title: "Error", description: "Could not delete template.", variant: "destructive" })
    }
  }

  const handleFormSubmit = async (data: SmsTemplateFormData) => {
    if (!user) return;
    try {
      if (selectedTemplate) {
        await updateSmsTemplate(selectedTemplate._id!, data)
      } else {
        await createSmsTemplate(data)
      }
      
      toast({ title: "Success", description: `Template ${selectedTemplate ? 'updated' : 'created'} successfully.` })
      setIsModalOpen(false)
      fetchTemplates()
    } catch (error: unknown) {
      toast({ title: "Error", description: (error instanceof Error) ? error.message : "An unknown error occurred.", variant: "destructive" })
    }
  }

  const table = useReactTable({
    data: templates,
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

  // --- RENDER ---
  return (
    <div className="flex flex-col min-h-screen bg-zinc-900 text-white">
      <Topbar />
      <main className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">SMS Templates</h1>
            <p className="text-sm text-zinc-400">Create and manage reusable SMS message templates.</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Mobile: Icon-only button */}
            <Button onClick={handleNewTemplate} size="icon" className="sm:hidden bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg transition-all duration-300 hover:scale-105">
              <PlusCircle className="h-4 w-4" />
            </Button>
            {/* Desktop: Full button */}
            <Button onClick={handleNewTemplate} className="hidden sm:flex bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg transition-all duration-300 hover:scale-105">
              <PlusCircle className="mr-2 h-4 w-4" /> New Template
            </Button>
          </div>
        </div>

        <div className="bg-zinc-900/50 backdrop-blur-lg shadow-2xl shadow-blue-500/10 rounded-xl">
          <Card className="bg-transparent border-none">
            <CardHeader className="p-4 border-b border-zinc-800">
              <StatCard title="Total Templates" value={templates.length} icon={FileText} />
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="overflow-x-auto">
                <DataTable table={table} columns={columns({ handleEdit, handleDelete })} />
              </div>
              <SimpleDataTablePagination table={table} />
            </CardContent>
          </Card>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="bg-zinc-900/80 backdrop-blur-lg border-zinc-700 text-white">
            <DialogHeader>
              <DialogTitle className="text-cyan-400">{selectedTemplate ? "Edit Template" : "Create New Template"}</DialogTitle>
              <DialogDescription className="text-zinc-400">
                {selectedTemplate ? "Update the details for your SMS template." : "Fill in the details to create a new SMS template."}
              </DialogDescription>
            </DialogHeader>
            <SmsTemplateForm
              onSubmit={handleFormSubmit}
              initialData={selectedTemplate}
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