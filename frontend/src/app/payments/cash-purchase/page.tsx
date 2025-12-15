"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Topbar } from "@/components/topbar"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Search, DollarSign, User } from "lucide-react"

// --- TYPE DEFINITIONS ---
interface User {
  _id: string;
  officialName: string;
  username: string;
  mobileNumber: string;
  package?: { price: number };
}

// --- MAIN COMPONENT ---
export default function CashPurchasePage() {
  const { toast } = useToast()

  // Data states
  const [users, setUsers] = useState<User[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  
  // UI states
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form states
  const [amount, setAmount] = useState('')
  const [transactionId, setTransactionId] = useState('')
  const [comment, setComment] = useState('')

  // --- DATA FETCHING ---
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/mikrotik/users')
        if (!response.ok) throw new Error('Failed to fetch users.')
        setUsers(await response.json())
      } catch (error) {
        toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' })
      } finally {
        setIsLoading(false)
      }
    }
    fetchUsers()
  }, [toast])

  // --- EVENT HANDLERS ---
  const handleUserSelect = () => {
    if (!selectedUserId) return toast({ title: 'Error', description: 'Please select a user.', variant: 'destructive' })
    const user = users.find(u => u._id === selectedUserId)
    setSelectedUser(user || null)
    setAmount(user?.package?.price?.toString() || '')
  }

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/payments/cash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser._id,
          amount: parseFloat(amount),
          transactionId,
          comment,
        }),
      })
      if (!response.ok) throw new Error((await response.json()).message || 'Failed to submit payment.')
      
      toast({ title: 'Success', description: `Payment for ${selectedUser.officialName} recorded.` })
      // Reset form
      setSelectedUser(null)
      setSelectedUserId(null)
      setAmount('')
      setTransactionId('')
      setComment('')
    } catch (error) {
      toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // --- RENDER ---
  return (
    <div className="flex flex-col min-h-screen bg-zinc-900 text-white">
      <Topbar />
      <main className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Record Cash Purchase</h1>
            <p className="text-sm text-zinc-400">Manually record a cash or direct bank payment from a user.</p>
          </div>
        </div>

        <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="bg-zinc-900/50 backdrop-blur-lg shadow-2xl shadow-blue-500/10 rounded-xl max-w-2xl mx-auto">
          <Card className="bg-transparent border-none">
            <AnimatePresence mode="wait">
              {!selectedUser ? (
                <motion.div key="selection" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <CardHeader>
                    <CardTitle className="text-cyan-400 flex items-center gap-2"><User className="w-5 h-5" /> Select User</CardTitle>
                    <CardDescription className="text-zinc-400">Choose the user who made the payment.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="user-select" className="text-zinc-300">User</Label>
                      <Select onValueChange={setSelectedUserId} value={selectedUserId || ''}>
                        <SelectTrigger id="user-select" className="bg-zinc-800 border-zinc-700 focus:ring-cyan-500">
                          <SelectValue placeholder="Select a user..." />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                          {isLoading ? <SelectItem value="loading" disabled>Loading...</SelectItem> : 
                           users.map(user => <SelectItem key={user._id} value={user._id}>{user.officialName} ({user.username})</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleUserSelect} disabled={!selectedUserId || isLoading} className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white">
                      <Search className="mr-2 h-4 w-4" /> Fetch Details
                    </Button>
                  </CardContent>
                </motion.div>
              ) : (
                <motion.div key="payment" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-cyan-400 flex items-center gap-2"><DollarSign className="w-5 h-5" /> Record Payment</CardTitle>
                        <CardDescription className="text-zinc-400">For {selectedUser.officialName}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="sm:hidden bg-transparent border-zinc-700 hover:bg-zinc-800" onClick={() => setSelectedUser(null)}>
                          <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="hidden sm:flex bg-transparent border-zinc-700 hover:bg-zinc-800" onClick={() => setSelectedUser(null)}>
                          <ArrowLeft className="mr-2 h-4 w-4" /> Change User
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmitPayment} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-3 bg-zinc-800/50 rounded-lg">
                        <div><Label className="text-xs text-zinc-400">Account #</Label><p className="font-mono text-sm">{selectedUser.username}</p></div>
                        <div><Label className="text-xs text-zinc-400">Mobile #</Label><p className="font-mono text-sm">{selectedUser.mobileNumber}</p></div>
                        <div><Label className="text-xs text-zinc-400">Monthly Bill</Label><p className="font-mono text-sm">KES {selectedUser.package?.price || 'N/A'}</p></div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="amount" className="text-zinc-300">Amount Received</Label>
                          <Input id="amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} required className="bg-zinc-800 border-zinc-700 focus:ring-cyan-500" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="transactionId" className="text-zinc-300">Transaction ID</Label>
                          <Input id="transactionId" type="text" value={transactionId} onChange={e => setTransactionId(e.target.value)} placeholder="e.g., Cash-..." required className="bg-zinc-800 border-zinc-700 focus:ring-cyan-500" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="comment" className="text-zinc-300">Comment (Optional)</Label>
                        <Input id="comment" type="text" value={comment} onChange={e => setComment(e.target.value)} className="bg-zinc-800 border-zinc-700 focus:ring-cyan-500" />
                      </div>
                      <div className="pt-4 border-t border-zinc-800 flex justify-end">
                        <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                          {isSubmitting ? 'Submitting...' : 'Submit Payment'}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>
      </main>
    </div>
  )
}