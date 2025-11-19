"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, ClipboardList, FileSignature, Router as RouterIcon, UserPlus, CalendarIcon, DollarSign } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { Topbar } from "@/components/topbar"
import { motion } from "framer-motion"
import { getPackages } from "@/lib/packageService"
import { Package } from "@/types/package"

// --- MAIN COMPONENT ---
export default function NewLeadPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    leadSource: 'Manual',
    desiredPackage: '',
    currentIsp: '',
    notes: '',
    broughtInBy: '',
    broughtInByContact: '',
    agreedInstallationFee: '' as number | '',
    agreedMonthlySubscription: '' as number | '',
    customerHasRouter: false,
    routerType: '',
    customerHasReceiver: false,
    receiverType: '',
    followUpDate: undefined as Date | undefined,
  })
  const [packages, setPackages] = useState<Package[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const pkgs = await getPackages()
        setPackages(pkgs)
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to fetch packages.', variant: 'destructive' })
      }
    }
    fetchPackages()
  }, [toast])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    const isNumeric = ['agreedInstallationFee', 'agreedMonthlySubscription'].includes(name)
    setFormData(prev => ({ ...prev, [name]: isNumeric && value !== '' ? Number(value) : value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    if (name === 'desiredPackage') {
      const selectedPackage = packages.find(p => p._id === value)
      setFormData(prev => ({
        ...prev,
        desiredPackage: value,
        agreedMonthlySubscription: selectedPackage ? selectedPackage.price : '',
      }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }
  const handleDateChange = (date: Date | undefined) => setFormData(prev => ({ ...prev, followUpDate: date }))
  const handleCheckboxChange = (field: 'customerHasRouter' | 'customerHasReceiver', checked: boolean) => setFormData(prev => ({ ...prev, [field]: checked }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const res = await fetch(`/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) throw new Error((await res.json()).message || 'Failed to create lead.')
      
      toast({ title: 'Success', description: 'Lead created successfully.' })
      router.push('/leads')
    } catch (error) {
      toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' })
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
            <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Add New Lead</h1>
            <p className="text-sm text-zinc-400">Create a new lead to track potential customers.</p>
          </div>
        </div>

        <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="bg-transparent border-none">
            <form onSubmit={handleSubmit}>
              <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                  <Section title="Primary Information" icon={ClipboardList}>
                    <InputGroup label="Phone Number *"><Input name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder="+254712345678" required className="text-lg" /></InputGroup>
                    <InputGroup label="Lead Name"><Input name="name" value={formData.name} onChange={handleChange} placeholder="Optional" /></InputGroup>
                  </Section>
                  <Section title="Source & Referral" icon={UserPlus}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InputGroup label="Lead Source">
                        <Select name="leadSource" value={formData.leadSource} onValueChange={(v) => handleSelectChange('leadSource', v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{['Manual', 'Caretaker', 'Field Sales', 'Referral', 'Website', 'WhatsApp/SMS'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                        </Select>
                      </InputGroup>
                      <InputGroup label="Brought In By"><Input name="broughtInBy" value={formData.broughtInBy} onChange={handleChange} placeholder="e.g., John Doe" /></InputGroup>
                      <InputGroup label="Brought In By Contact"><Input name="broughtInByContact" value={formData.broughtInByContact} onChange={handleChange} placeholder="Phone or Email" /></InputGroup>
                    </div>
                  </Section>
                  <Section title="Customer Background" icon={FileSignature}>
                    <InputGroup label="Current ISP"><Input name="currentIsp" value={formData.currentIsp} onChange={handleChange} placeholder="Optional" /></InputGroup>
                    <InputGroup label="Notes"><Textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} placeholder="e.g., Current provider is unreliable" /></InputGroup>
                  </Section>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  <Section title="Service & Financial" icon={DollarSign}>
                    <InputGroup label="Desired Package">
                      <Select name="desiredPackage" value={formData.desiredPackage} onValueChange={(v) => handleSelectChange('desiredPackage', v)}>
                        <SelectTrigger><SelectValue placeholder="Select a package" /></SelectTrigger>
                        <SelectContent>
                          {packages.map(pkg => <SelectItem key={pkg._id} value={pkg._id}>{pkg.name} - {pkg.price} KES</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </InputGroup>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InputGroup label="Agreed Monthly Subscription (KES)"><Input name="agreedMonthlySubscription" type="number" value={formData.agreedMonthlySubscription} onChange={handleChange} placeholder="0" /></InputGroup>
                      <InputGroup label="Agreed Installation Fee (KES)"><Input name="agreedInstallationFee" type="number" value={formData.agreedInstallationFee} onChange={handleChange} placeholder="0" /></InputGroup>
                    </div>
                  </Section>
                  <Section title="Equipment & Scheduling" icon={RouterIcon}>
                    <div className="space-y-4">
                      <h4 className="font-medium text-zinc-300">Existing Equipment</h4>
                      <div className="flex items-center space-x-2"><Checkbox id="customerHasRouter" checked={formData.customerHasRouter} onCheckedChange={(c) => handleCheckboxChange('customerHasRouter', !!c)} /><Label htmlFor="customerHasRouter">Customer Has Router?</Label></div>
                      {formData.customerHasRouter && <InputGroup label="Router Type"><Input name="routerType" value={formData.routerType} onChange={handleChange} placeholder="e.g., TP-Link" /></InputGroup>}
                      <div className="flex items-center space-x-2"><Checkbox id="customerHasReceiver" checked={formData.customerHasReceiver} onCheckedChange={(c) => handleCheckboxChange('customerHasReceiver', !!c)} /><Label htmlFor="customerHasReceiver">Customer Has Receiver?</Label></div>
                      {formData.customerHasReceiver && <InputGroup label="Receiver Type"><Input name="receiverType" value={formData.receiverType} onChange={handleChange} placeholder="e.g., Ubiquiti" /></InputGroup>}
                    </div>
                    <div className="space-y-4 mt-6">
                      <h4 className="font-medium text-zinc-300">Scheduling</h4>
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
                  </Section>
                </div>
              </CardContent>
              <div className="flex justify-end gap-2 p-4 border-t border-zinc-800">
                <Button type="button" variant="outline" onClick={() => router.push('/leads')} disabled={isLoading} className="bg-transparent border-zinc-700 hover:bg-zinc-800">Cancel</Button>
                <Button type="submit" disabled={isLoading} className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white">
                  <UserPlus className="mr-2 h-4 w-4" />
                  {isLoading ? 'Creating...' : 'Create Lead'}
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
    <h3 className="font-semibold text-lg text-cyan-400 flex items-center gap-2 mb-4"><Icon className="w-5 h-5" />{title}</h3>
    <div className="space-y-4">{children}</div>
  </div>
)

const InputGroup = ({ label, children }: { label: string, children: React.ReactNode }) => (
  <div className="space-y-2">
    <Label className="text-zinc-300 text-sm">{label}</Label>
    {children}
  </div>
)