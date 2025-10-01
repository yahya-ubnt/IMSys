"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, ClipboardList, FileSignature, Router as RouterIcon, UserPlus, CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { Topbar } from "@/components/topbar"
import { motion } from "framer-motion"

// --- MAIN COMPONENT ---
export default function EditLeadPage() {
  const router = useRouter()
  const params = useParams()
  const { id } = params
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: '', phoneNumber: '', leadSource: '', desiredPackage: '', currentIsp: '', notes: '',
    broughtInBy: '', broughtInByContact: '', agreedInstallationFee: '' as number | '',
    agreedMonthlySubscription: '' as number | '', customerHasRouter: false, routerType: '',
    customerHasReceiver: false, receiverType: '', followUpDate: undefined as Date | undefined, status: '',
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    const fetchLead = async () => {
      setIsLoading(true)
      try {
        const token = localStorage.getItem("token")
        if (!token) throw new Error("No token found")
        const response = await fetch(`/api/leads/${id}`, { headers: { "Authorization": `Bearer ${token}` } })
        if (!response.ok) throw new Error('Failed to fetch lead')
        const data = await response.json()
        setFormData({
          name: data.name || '',
          phoneNumber: data.phoneNumber || '',
          leadSource: data.leadSource || '',
          desiredPackage: data.desiredPackage?._id || '',
          currentIsp: data.currentIsp || '',
          notes: data.notes || '',
          broughtInBy: data.broughtInBy || '',
          broughtInByContact: data.broughtInByContact || '',
          agreedInstallationFee: data.agreedInstallationFee || '',
          agreedMonthlySubscription: data.agreedMonthlySubscription || '',
          customerHasRouter: data.customerHasRouter || false,
          routerType: data.routerType || '',
          customerHasReceiver: data.customerHasReceiver || false,
          receiverType: data.receiverType || '',
          followUpDate: data.followUpDate ? new Date(data.followUpDate) : undefined,
          status: data.status || '',
        })
} catch {
        toast({ title: 'Error', description: 'Failed to fetch lead details.', variant: 'destructive' })
      } finally {
        setIsLoading(false)
      }
    }
    fetchLead()
  }, [id, toast])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    const isNumeric = ['agreedInstallationFee', 'agreedMonthlySubscription'].includes(name)
    setFormData(prev => ({ ...prev, [name]: isNumeric && value !== '' ? Number(value) : value }))
  }

  const handleSelectChange = (name: string, value: string) => setFormData(prev => ({ ...prev, [name]: value }))
  const handleDateChange = (date: Date | undefined) => setFormData(prev => ({ ...prev, followUpDate: date }))
  const handleCheckboxChange = (field: 'customerHasRouter' | 'customerHasReceiver', checked: boolean) => setFormData(prev => ({ ...prev, [field]: checked }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) throw new Error("Authentication token not found.")
      const res = await fetch(`/api/leads/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData),
      })
      if (!res.ok) throw new Error((await res.json()).message || 'Failed to update lead.')
      toast({ title: 'Success', description: 'Lead updated successfully.' })
      router.push('/leads')
    } catch (error) {
      toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) return <div className="flex h-screen items-center justify-center bg-zinc-900 text-white">Loading...</div>

  return (
    <div className="flex flex-col min-h-screen bg-zinc-900 text-white">
      <Topbar />
      <main className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Edit Lead</h1>
            <p className="text-sm text-zinc-400">Update the details of an existing lead.</p>
          </div>
          <Button variant="outline" onClick={() => router.push('/leads')} className="bg-transparent border-zinc-700 hover:bg-zinc-800">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Leads
          </Button>
        </div>

        <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="bg-zinc-900/50 backdrop-blur-lg border border-zinc-700 shadow-2xl shadow-blue-500/10 rounded-xl max-w-4xl mx-auto">
          <Card className="bg-transparent border-none">
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle className="text-cyan-400">Lead Information</CardTitle>
                <CardDescription className="text-zinc-400">Update the relevant details for this lead.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <Section title="Lead Details" icon={ClipboardList}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputGroup label="Lead Name"><Input name="name" value={formData.name} onChange={handleChange} placeholder="Optional" /></InputGroup>
                    <InputGroup label="Phone Number *"><Input name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder="+254712345678" required /></InputGroup>
                    <InputGroup label="Lead Source">
                      <Select name="leadSource" value={formData.leadSource} onValueChange={(v) => handleSelectChange('leadSource', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{['Manual', 'Caretaker', 'Field Sales', 'Referral', 'Website', 'WhatsApp/SMS'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </InputGroup>
                    <InputGroup label="Current ISP"><Input name="currentIsp" value={formData.currentIsp} onChange={handleChange} placeholder="Optional" /></InputGroup>
                    <InputGroup label="Brought In By"><Input name="broughtInBy" value={formData.broughtInBy} onChange={handleChange} placeholder="e.g., John Doe" /></InputGroup>
                    <InputGroup label="Brought In By Contact"><Input name="broughtInByContact" value={formData.broughtInByContact} onChange={handleChange} placeholder="Phone or Email" /></InputGroup>
                  </div>
                  <InputGroup label="Reason for Interest/Dissatisfaction"><Textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} placeholder="e.g., Current provider is unreliable" /></InputGroup>
                </Section>

                <Section title="Agreement Details" icon={FileSignature}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputGroup label="Desired Package (Mbps)"><Input name="desiredPackage" value={formData.desiredPackage} onChange={handleChange} placeholder="e.g., 10" /></InputGroup>
                    <InputGroup label="Agreed Installation Fee (KES)"><Input name="agreedInstallationFee" type="number" value={formData.agreedInstallationFee} onChange={handleChange} placeholder="0" /></InputGroup>
                    <InputGroup label="Agreed Monthly Subscription (KES)"><Input name="agreedMonthlySubscription" type="number" value={formData.agreedMonthlySubscription} onChange={handleChange} placeholder="0" /></InputGroup>
                  </div>
                </Section>

                <Section title="Equipment & Follow-up" icon={RouterIcon}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium text-zinc-300">Equipment</h4>
                      <div className="flex items-center space-x-2"><Checkbox id="customerHasRouter" checked={formData.customerHasRouter} onCheckedChange={(c) => handleCheckboxChange('customerHasRouter', !!c)} /><Label htmlFor="customerHasRouter">Customer Has Router?</Label></div>
                      {formData.customerHasRouter && <InputGroup label="Router Type"><Input name="routerType" value={formData.routerType} onChange={handleChange} placeholder="e.g., TP-Link" /></InputGroup>}
                      <div className="flex items-center space-x-2"><Checkbox id="customerHasReceiver" checked={formData.customerHasReceiver} onCheckedChange={(c) => handleCheckboxChange('customerHasReceiver', !!c)} /><Label htmlFor="customerHasReceiver">Customer Has Receiver?</Label></div>
                      {formData.customerHasReceiver && <InputGroup label="Receiver Type"><Input name="receiverType" value={formData.receiverType} onChange={handleChange} placeholder="e.g., Ubiquiti" /></InputGroup>}
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-medium text-zinc-300">Follow-up</h4>
                      <InputGroup label="Follow-up Date">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.followUpDate && "text-zinc-400")}>
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {formData.followUpDate ? format(formData.followUpDate, "PPP") : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formData.followUpDate} onSelect={handleDateChange} initialFocus /></PopoverContent>
                        </Popover>
                      </InputGroup>
                    </div>
                  </div>
                </Section>
              </CardContent>
              <div className="flex justify-end gap-2 p-4 border-t border-zinc-800">
                <Button type="button" variant="outline" onClick={() => router.push('/leads')} disabled={isLoading} className="bg-transparent border-zinc-700 hover:bg-zinc-800">Cancel</Button>
                <Button type="submit" disabled={isLoading} className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white">
                  <UserPlus className="mr-2 h-4 w-4" />
                  {isLoading ? 'Updating...' : 'Update Lead'}
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      </main>
    </div>
  )
}

// --- SUB-COMPONENTS ---
const Section = ({ title, icon: Icon, children }: { title: string, icon: React.ElementType, children: React.ReactNode }) => (
  <div className="space-y-4">
    <h3 className="font-semibold text-cyan-400 flex items-center gap-2 border-b border-zinc-800 pb-2"><Icon className="w-5 h-5" />{title}</h3>
    <div className="p-4 bg-zinc-800/50 rounded-lg">{children}</div>
  </div>
)

const InputGroup = ({ label, children }: { label: string, children: React.ReactNode }) => (
  <div className="space-y-2">
    <Label className="text-zinc-300 text-sm">{label}</Label>
    {children}
  </div>
)
