"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { createTicket } from "@/lib/ticketService"
import { getMikrotikUsers } from "@/lib/mikrotikUserService"
import { Topbar } from "@/components/topbar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, PlusCircle } from "lucide-react"
import { motion } from "framer-motion"

// --- TYPE DEFINITIONS ---
interface MikrotikUser {
  _id: string;
  officialName: string;
  mobileNumber: string;
  mPesaRefNo: string;
  emailAddress?: string;
}

interface TicketFormData {
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  clientAccountId: string;
  issueType: string;
  description: string;
  status: 'New' | 'Open' | 'Pending' | 'Resolved' | 'Closed';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
}

import { Ticket } from "@/types/ticket";
// --- MAIN COMPONENT ---
export default function NewTicketPage() {
  const router = useRouter()
  const { token } = useAuth()
  const { toast } = useToast()

  const [formData, setFormData] = useState<TicketFormData>({
    clientName: '', clientPhone: '', clientEmail: '', clientAccountId: '',
    issueType: '', description: '', status: 'New', priority: 'Medium',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [mikrotikUsers, setMikrotikUsers] = useState<MikrotikUser[]>([])
  const [selectedClient, setSelectedClient] = useState<string>('')

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return
      setIsLoading(true)
      try {
        setMikrotikUsers(await getMikrotikUsers(token))
} catch {
        toast({ title: 'Error', description: 'Failed to fetch client data.', variant: 'destructive' })
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [token, toast])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value })
  }

  const handleClientSelectChange = (userId: string) => {
    setSelectedClient(userId)
    const client = mikrotikUsers.find(user => user._id === userId)
    if (client) {
      setFormData(prev => ({
        ...prev,
        clientName: client.officialName,
        clientPhone: client.mobileNumber,
        clientEmail: client.emailAddress || '',
        clientAccountId: client.mPesaRefNo || '',
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return toast({ title: "Authentication Error", description: "Please log in.", variant: "destructive" })
    setIsLoading(true)
    try {
      await createTicket(formData as Ticket, token)
      toast({ title: 'Ticket Created', description: 'New ticket has been successfully logged.' })
      router.push('/tickets')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create ticket."
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' })
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
            <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Create New Ticket</h1>
            <p className="text-sm text-zinc-400">Log a new client support ticket.</p>
          </div>
          <Button variant="outline" onClick={() => router.push('/tickets')} className="bg-transparent border-zinc-700 hover:bg-zinc-800">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tickets
          </Button>
        </div>

        <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="bg-zinc-900/50 backdrop-blur-lg border border-zinc-700 shadow-2xl shadow-blue-500/10 rounded-xl max-w-4xl mx-auto">
          <Card className="bg-transparent border-none">
            <CardHeader>
              <CardTitle className="text-cyan-400">Ticket Details</CardTitle>
              <CardDescription className="text-zinc-400">Fill in the details to create a new support ticket.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="selectClient" className="text-zinc-300">Select Existing Client (Optional)</Label>
                  <Select name="selectClient" value={selectedClient} onValueChange={handleClientSelectChange}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 focus:ring-cyan-500"><SelectValue placeholder="Select a client to auto-fill details" /></SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                      {mikrotikUsers.map((user) => <SelectItem key={user._id} value={user._id}>{user.officialName} ({user.mobileNumber})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label htmlFor="clientName" className="text-zinc-300">Client Name</Label><Input id="clientName" name="clientName" value={formData.clientName} onChange={handleChange} required className="bg-zinc-800 border-zinc-700 focus:ring-cyan-500" /></div>
                  <div className="space-y-2"><Label htmlFor="clientPhone" className="text-zinc-300">Client Phone</Label><Input id="clientPhone" name="clientPhone" value={formData.clientPhone} onChange={handleChange} required className="bg-zinc-800 border-zinc-700 focus:ring-cyan-500" /></div>
                  <div className="space-y-2"><Label htmlFor="clientEmail" className="text-zinc-300">Client Email</Label><Input id="clientEmail" name="clientEmail" type="email" value={formData.clientEmail} onChange={handleChange} className="bg-zinc-800 border-zinc-700 focus:ring-cyan-500" /></div>
                  <div className="space-y-2"><Label htmlFor="clientAccountId" className="text-zinc-300">Client Account ID</Label><Input id="clientAccountId" name="clientAccountId" value={formData.clientAccountId} onChange={handleChange} className="bg-zinc-800 border-zinc-700 focus:ring-cyan-500" /></div>
                  <div className="space-y-2"><Label htmlFor="issueType" className="text-zinc-300">Issue Type</Label><Input id="issueType" name="issueType" value={formData.issueType} onChange={handleChange} required className="bg-zinc-800 border-zinc-700 focus:ring-cyan-500" /></div>
                  <div className="space-y-2">
                    <Label htmlFor="priority" className="text-zinc-300">Priority</Label>
                    <Select name="priority" value={formData.priority} onValueChange={(value) => handleSelectChange('priority', value)}>
                      <SelectTrigger className="bg-zinc-800 border-zinc-700 focus:ring-cyan-500"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-zinc-300">Description</Label>
                  <Textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={5} required className="bg-zinc-800 border-zinc-700 focus:ring-cyan-500" />
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t border-zinc-800">
                  <Button type="button" variant="outline" onClick={() => router.push('/tickets')} disabled={isLoading} className="bg-transparent border-zinc-700 hover:bg-zinc-800">Cancel</Button>
                  <Button type="submit" disabled={isLoading} className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {isLoading ? 'Creating...' : 'Create Ticket'}
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
