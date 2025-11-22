"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
} from "@tanstack/react-table"
import { Topbar } from "@/components/topbar"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { DataTable } from "@/components/data-table"
import { columns } from "./columns"
import { PlusCircle, DollarSign } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Expense, ExpenseType } from "@/types/expenses"
import moment from "moment"

const EMPTY_EXPENSE: Partial<Expense> = { title: "", amount: 0, description: "", expenseDate: moment().format("YYYY-MM-DDTHH:mm") };

// --- MAIN COMPONENT ---
export default function AllExpensesPage() {
  const { toast } = useToast()

  // Data states
  const [data, setData] = useState<Expense[]>([])
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([])
  
  // UI states
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Partial<Expense> | null>(null)
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);

  // --- DATA FETCHING ---
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [expensesRes, typesRes] = await Promise.all([
        fetch("/api/expenses"),
        fetch("/api/expensetypes"),
      ])
      if (!expensesRes.ok || !typesRes.ok) throw new Error("Failed to fetch data")
      
      setData(await expensesRes.json())
      setExpenseTypes(await typesRes.json())
    } catch {
      toast({ title: "Error", description: "Could not fetch data.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    meta: {
      handleEdit: (expense: Expense) => {
        setEditingExpense(expense);
        setIsDialogOpen(true);
      },
      handleDelete: (id: string) => setDeleteCandidateId(id),
    },
  })

  // --- EVENT HANDLERS ---
  const handleSave = async () => {
    if (!editingExpense) return;
    const isEditing = !!editingExpense._id;
    const url = isEditing ? `/api/expenses/${editingExpense._id}` : "/api/expenses";
    const method = isEditing ? "PUT" : "POST";

    const payload = {
      ...editingExpense,
      expenseType: typeof editingExpense.expenseType === 'object' ? editingExpense.expenseType._id : editingExpense.expenseType,
    };

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error((await response.json()).message || "Failed to save expense type");
      
      toast({ title: "Success", description: `Expense ${isEditing ? 'updated' : 'added'}.` });
      fetchData();
      setIsDialogOpen(false);
    } catch (error: unknown) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setIsDialogOpen(true);
  };

  const handleNew = () => {
    setEditingExpense(EMPTY_EXPENSE);
    setIsDialogOpen(true);
  }

  const handleDelete = async () => {
    if (!deleteCandidateId) return;
    try {
      const response = await fetch(`/api/expenses/${deleteCandidateId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete expense");
      toast({ title: "Success", description: "Expense deleted." });
      fetchData();
    } catch {
      toast({ title: "Error", description: "Could not delete expense.", variant: "destructive" });
    }
    finally {
      setDeleteCandidateId(null);
    }
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES" }).format(amount);

  const stats = {
    totalAmount: data.reduce((acc, curr) => acc + curr.amount, 0),
  }

  // --- RENDER ---
  return (
    <>
      <div className="flex flex-col min-h-screen bg-zinc-900 text-white">
        <Topbar />
        <main className="flex-1 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">All Expenses</h1>
              <p className="text-sm text-zinc-400">Track and manage all your expenses.</p>
            </div>
            <Button onClick={handleNew} className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg transition-all duration-300 hover:scale-105">
              <PlusCircle className="mr-2 h-4 w-4" /> New Expense
            </Button>
          </div>

          <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="bg-zinc-900/50 backdrop-blur-lg border border-zinc-700 shadow-2xl shadow-blue-500/10 rounded-xl">
            <Card className="bg-transparent border-none">
              <CardHeader className="p-4 border-b border-zinc-800 grid grid-cols-1">
                <StatCard title="Total Amount" value={formatCurrency(stats.totalAmount)} icon={DollarSign} />
              </CardHeader>
              <CardContent className="p-4">
                <div className="overflow-x-auto">
                  <DataTable table={table} columns={columns} />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="bg-zinc-900/80 backdrop-blur-lg border-zinc-700 text-white">
              <DialogHeader>
                <DialogTitle className="text-cyan-400">{editingExpense?._id ? "Edit Expense" : "Add New Expense"}</DialogTitle>
                <DialogDescription className="text-zinc-400">Record or update an expense.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-zinc-300">Expense Name</Label>
                    <Input id="title" placeholder="e.g., Router" value={editingExpense?.title || ''} onChange={(e) => setEditingExpense({ ...editingExpense, title: e.target.value })} className="bg-zinc-800 border-zinc-700 focus:ring-cyan-500" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-zinc-300">Amount</Label>
                    <Input id="amount" type="number" placeholder="e.g., 15000" value={editingExpense?.amount || ''} onChange={(e) => setEditingExpense({ ...editingExpense, amount: Number(e.target.value) })} className="bg-zinc-800 border-zinc-700 focus:ring-cyan-500" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Expense Type</Label>
                    <Select value={typeof editingExpense?.expenseType === 'object' ? editingExpense.expenseType._id : editingExpense?.expenseType} onValueChange={(value) => {
                      const selectedType = expenseTypes.find(type => type._id === value);
                      setEditingExpense({ ...editingExpense, expenseType: selectedType })
                    }}>
                      <SelectTrigger className="bg-zinc-800 border-zinc-700 focus:ring-cyan-500"><SelectValue placeholder="Select a type" /></SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                        {expenseTypes.map(type => <SelectItem key={type._id} value={type._id}>{type.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expenseDate" className="text-zinc-300">Expense Date</Label>
                    <Input id="expenseDate" type="datetime-local" value={editingExpense?.expenseDate?.toString().slice(0, 16) || ''} onChange={(e) => setEditingExpense({ ...editingExpense, expenseDate: e.target.value })} className="bg-zinc-800 border-zinc-700" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-zinc-300">Description</Label>
                  <Textarea id="description" placeholder="" value={editingExpense?.description || ''} onChange={(e) => setEditingExpense({ ...editingExpense, description: e.target.value })} className="bg-zinc-800 border-zinc-700 focus:ring-cyan-500" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-800">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="bg-transparent border-zinc-700 hover:bg-zinc-800">Cancel</Button>
                <Button onClick={handleSave} className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white">{editingExpense?._id ? "Update Expense" : "Add Expense"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </main>
      </div>
      <AlertDialog open={!!deleteCandidateId} onOpenChange={() => setDeleteCandidateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the expense.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Continue</AlertDialogAction>
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