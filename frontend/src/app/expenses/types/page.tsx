"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Topbar } from "@/components/topbar"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import { DataTable } from "@/components/data-table"
import { columns } from "./columns"
import { PlusCircle, List, CheckCircle, XCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ExpenseType } from "@/types/expenses"

const EMPTY_EXPENSE_TYPE: Partial<ExpenseType> = { name: "", description: "", status: "Active" };

// --- MAIN COMPONENT ---
export default function ExpenseTypesPage() {
  const { toast } = useToast()

  // Data states
  const [data, setData] = useState<ExpenseType[]>([])
  
  // UI states
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingExpenseType, setEditingExpenseType] = useState<Partial<ExpenseType> | null>(null)

  // --- DATA FETCHING ---
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/expensetypes")
      if (!response.ok) throw new Error("Failed to fetch expense types")
      setData(await response.json())
    } catch {
      toast({ title: "Error", description: "Could not fetch expense types.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // --- EVENT HANDLERS ---
  const handleSave = async () => {
    if (!editingExpenseType) return;
    const isEditing = !!editingExpenseType._id;
    const url = isEditing ? `/api/expensetypes/${editingExpenseType._id}` : "/api/expensetypes";
    const method = isEditing ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingExpenseType),
      });
      if (!response.ok) throw new Error((await response.json()).message || "Failed to save expense type");
      
      toast({ title: "Success", description: `Expense type ${isEditing ? 'updated' : 'added'}.` });
      fetchData();
      setIsDialogOpen(false);
    } catch (error: unknown) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    }
  };

  const handleEdit = (expenseType: ExpenseType) => {
    setEditingExpenseType(expenseType);
    setIsDialogOpen(true);
  };

  const handleNew = () => {
    setEditingExpenseType(EMPTY_EXPENSE_TYPE);
    setIsDialogOpen(true);
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      const response = await fetch(`/api/expensetypes/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete expense type");
      toast({ title: "Success", description: "Expense type deleted." });
      fetchData();
    } catch {
      toast({ title: "Error", description: "Could not delete expense type.", variant: "destructive" });
    }
  };

  const stats = {
    total: data.length,
    active: data.filter(d => d.status === 'Active').length,
    inactive: data.length - data.filter(d => d.status === 'Active').length,
  }

  // --- RENDER ---
  return (
    <div className="flex flex-col min-h-screen bg-zinc-900 text-white">
      <Topbar />
      <main className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Expense Types</h1>
            <p className="text-sm text-zinc-400">Manage your expense categories.</p>
          </div>
          <Button onClick={handleNew} className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg transition-all duration-300 hover:scale-105">
            <PlusCircle className="mr-2 h-4 w-4" /> New Expense Type
          </Button>
        </div>

        <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="bg-zinc-900/50 backdrop-blur-lg border border-zinc-700 shadow-2xl shadow-blue-500/10 rounded-xl">
          <Card className="bg-transparent border-none">
            <CardHeader className="p-4 border-b border-zinc-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard title="Total Types" value={stats.total} icon={List} />
              <StatCard title="Active" value={stats.active} icon={CheckCircle} color="text-green-400" />
              <StatCard title="Inactive" value={stats.inactive} icon={XCircle} color="text-yellow-400" />
            </CardHeader>
            <CardContent className="p-4">
              <div className="overflow-x-auto">
                <DataTable columns={columns} data={data} filterColumn="name" meta={{ handleEdit, handleDelete }} />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="bg-zinc-900/80 backdrop-blur-lg border-zinc-700 text-white">
            <DialogHeader>
              <DialogTitle className="text-cyan-400">{editingExpenseType?._id ? "Edit Expense Type" : "Add New Expense Type"}</DialogTitle>
              <DialogDescription className="text-zinc-400">Create or update a category for your expenses.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-zinc-300">Name</Label>
                  <Input id="name" placeholder="e.g., Network Equipment" value={editingExpenseType?.name || ''} onChange={(e) => setEditingExpenseType({ ...editingExpenseType, name: e.target.value })} className="bg-zinc-800 border-zinc-700 focus:ring-cyan-500" />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">Status</Label>
                  <Select value={editingExpenseType?.status || 'Active'} onValueChange={(value) => setEditingExpenseType({ ...editingExpenseType, status: value as 'Active' | 'Inactive' })}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 focus:ring-cyan-500"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-zinc-300">Description</Label>
                <Textarea id="description" placeholder="e.g., Costs for routers, switches, and cables." value={editingExpenseType?.description || ''} onChange={(e) => setEditingExpenseType({ ...editingExpenseType, description: e.target.value })} className="bg-zinc-800 border-zinc-700 focus:ring-cyan-500" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-zinc-800">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="bg-transparent border-zinc-700 hover:bg-zinc-800">Cancel</Button>
              <Button onClick={handleSave} className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white">{editingExpenseType?._id ? "Update Type" : "Add Type"}</Button>
            </div>
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