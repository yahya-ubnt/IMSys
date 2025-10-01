"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { createBill } from "@/lib/billService"
import { Topbar } from "@/components/topbar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, PlusCircle } from "lucide-react"
import { motion } from "framer-motion"

export default function AddNewCompanyBillPage() {
  const router = useRouter()
  const { token } = useAuth()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    dueDate: '',
    description: '',
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) {
      toast({ title: "Authentication Error", description: "Please log in.", variant: "destructive" })
      return
    }
    setIsLoading(true)
    try {
      const billData = {
        ...formData,
        amount: parseFloat(formData.amount),
        dueDate: parseInt(formData.dueDate),
        category: 'Company' as const,
      }
      await createBill(billData, token)
      toast({ title: "Bill Added", description: "New company bill has been successfully recorded." })
      router.push('/bills/company')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to add bill."
      toast({ title: "Error", description: errorMessage, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-zinc-900 text-white">
      <Topbar />
      <main className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Add New Company Bill</h1>
            <p className="text-sm text-zinc-400">Record a new recurring company bill.</p>
          </div>
          <Button variant="outline" onClick={() => router.push('/bills/company')} className="bg-transparent border-zinc-700 hover:bg-zinc-800">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Company Bills
          </Button>
        </div>

        <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="bg-zinc-900/50 backdrop-blur-lg border border-zinc-700 shadow-2xl shadow-blue-500/10 rounded-xl max-w-2xl mx-auto">
          <Card className="bg-transparent border-none">
            <CardHeader>
              <CardTitle className="text-cyan-400">Bill Details</CardTitle>
              <CardDescription className="text-zinc-400">Fill in the details for the new company bill.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-zinc-300">Bill Name</Label>
                    <Input id="name" name="name" placeholder="e.g., Rent, Electricity" value={formData.name} onChange={handleChange} required className="bg-zinc-800 border-zinc-700 focus:ring-cyan-500" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-zinc-300">Amount (KSh)</Label>
                    <Input id="amount" name="amount" type="number" step="0.01" placeholder="e.g., 15000.00" value={formData.amount} onChange={handleChange} required className="bg-zinc-800 border-zinc-700 focus:ring-cyan-500" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate" className="text-zinc-300">Due Date (Day of Month)</Label>
                  <Input id="dueDate" name="dueDate" type="number" min="1" max="31" placeholder="e.g., 5 (for 5th of month)" value={formData.dueDate} onChange={handleChange} required className="bg-zinc-800 border-zinc-700 focus:ring-cyan-500" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-zinc-300">Description (Optional)</Label>
                  <Textarea id="description" name="description" placeholder="e.g., Monthly office rent for July" value={formData.description} onChange={handleChange} rows={3} className="bg-zinc-800 border-zinc-700 focus:ring-cyan-500" />
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t border-zinc-800">
                  <Button type="button" variant="outline" onClick={() => router.push('/bills/company')} disabled={isLoading} className="bg-transparent border-zinc-700 hover:bg-zinc-800">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading} className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {isLoading ? 'Adding...' : 'Add Bill'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  )
}