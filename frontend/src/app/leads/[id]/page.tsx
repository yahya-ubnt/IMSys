"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Topbar } from "@/components/topbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Edit, Phone, Calendar, Info, FileSignature, Router as RouterIcon, CheckCircle, XCircle, Package as PackageIcon, DollarSign, Users } from "lucide-react"
import { format } from "date-fns"
import { motion } from "framer-motion";
import { Lead } from "@/types/lead";

// --- MAIN COMPONENT ---
export default function ViewLeadPage() {
  const router = useRouter()
  const params = useParams()
  const { id } = params
  const { toast } = useToast()

  const [lead, setLead] = useState<Lead | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    const fetchLead = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/leads/${id}`)
        if (!response.ok) throw new Error('Failed to fetch lead')
        setLead(await response.json())
      } catch {
        toast({ title: 'Error', description: 'Failed to fetch lead details.', variant: 'destructive' })
      } finally {
        setIsLoading(false)
      }
    }
    fetchLead()
  }, [id, toast])

  if (isLoading) return <div className="flex h-screen items-center justify-center bg-zinc-900 text-white">Loading...</div>
  if (!lead) return <div className="flex h-screen items-center justify-center bg-zinc-900 text-red-400">Lead not found.</div>

  const statusConfig = {
    'New': { color: 'bg-blue-500' },
    'Contacted': { color: 'bg-yellow-500' },
    'Interested': { color: 'bg-green-500' },
    'Site Survey Scheduled': { color: 'bg-purple-500' },
    'Converted': { color: 'bg-emerald-500' },
    'Not Interested': { color: 'bg-red-500' },
    'Future Prospect': { color: 'bg-gray-500' },
  }

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-white">
      <Topbar />
      <main className="flex-1 p-4 md:p-8 space-y-6">
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">{lead.name || 'Unnamed Lead'}</h1>
            <p className="text-base text-zinc-400 flex items-center gap-2"><Phone size={14} /> {lead.phoneNumber}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push('/leads')} className="bg-transparent border-zinc-700 hover:bg-zinc-800">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button onClick={() => router.push(`/leads/edit/${lead._id}`)} className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white">
              <Edit className="mr-2 h-4 w-4" /> Edit
            </Button>
          </div>
        </div>

        {/* --- MAIN CONTENT GRID --- */}
        <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* --- LEFT COLUMN --- */}
          <div className="lg:col-span-2 space-y-6">
            <InfoCard title="Lead Information" icon={Users}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InfoItem label="Lead Source" value={lead.leadSource} />
                    <InfoItem label="Current ISP" value={lead.currentIsp} />
                    <InfoItem label="Brought In By" value={lead.broughtInBy} />
                    <InfoItem label="Brought In By Contact" value={lead.broughtInByContact} />
                </div>
            </InfoCard>
            <InfoCard title="Agreement" icon={FileSignature}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InfoItem label="Desired Package" value={lead.desiredPackage?.name} icon={PackageIcon} />
                    <InfoItem label="Agreed Monthly Subscription" value={lead.agreedMonthlySubscription} isCurrency icon={DollarSign} />
                    <InfoItem label="Agreed Installation Fee" value={lead.agreedInstallationFee} isCurrency icon={DollarSign} />
                </div>
            </InfoCard>
            <InfoCard title="Notes" icon={Info}>
                <p className="text-zinc-300 whitespace-pre-wrap">{lead.notes || 'No notes provided.'}</p>
            </InfoCard>
          </div>

          {/* --- RIGHT COLUMN --- */}
          <div className="space-y-6">
            <InfoCard title="Status" icon={Info}>
                <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${statusConfig[lead.status]?.color || 'bg-gray-400'}`} />
                    <span className="text-base font-semibold">{lead.status}</span>
                </div>
            </InfoCard>
            <InfoCard title="Equipment" icon={RouterIcon}>
                <div className="space-y-3">
                    <BooleanItem value={lead.customerHasRouter} label={`Customer Has Router ${lead.routerType ? `(${lead.routerType})` : ''}`} />
                    <BooleanItem value={lead.customerHasReceiver} label={`Customer Has Receiver ${lead.receiverType ? `(${lead.receiverType})` : ''}`} />
                </div>
            </InfoCard>
            <InfoCard title="Scheduling & History" icon={Calendar}>
                <InfoItem label="Follow-up Date" value={lead.followUpDate ? format(new Date(lead.followUpDate), "PPP") : 'Not set'} />
                {lead.statusHistory && lead.statusHistory.length > 0 && (
                    <div className="mt-6">
                        <h4 className="font-medium text-zinc-300 mb-3">Status History</h4>
                        <StatusTimeline history={lead.statusHistory} />
                    </div>
                )}
            </InfoCard>
          </div>
        </motion.div>
      </main>
    </div>
  )
}

// --- SUB-COMPONENTS ---
const InfoCard = ({ title, icon: Icon, children }: { title: string, icon: React.ElementType, children: React.ReactNode }) => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="bg-zinc-900 border border-zinc-800 shadow-lg">
            <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-4 border-b border-zinc-800">
                <Icon className="w-5 h-5 text-cyan-400" />
                <CardTitle className="text-lg text-zinc-200">{title}</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
                {children}
            </CardContent>
        </Card>
    </motion.div>
)

const InfoItem = ({ label, value, isCurrency = false, icon: Icon }: { label: string, value?: string | number | boolean, isCurrency?: boolean, icon?: React.ElementType }) => {
  const displayValue = value === null || value === undefined || value === '' ? <span className="text-zinc-500">N/A</span> : value;
  
  const formattedValue = isCurrency && typeof displayValue === 'number'
    ? new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(displayValue)
    : displayValue.toString();

  return (
    <div className="flex flex-col space-y-1">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-zinc-400" />}
        <label className="text-sm font-medium text-zinc-400">{label}</label>
      </div>
      <p className="text-base text-zinc-100 pl-6">{formattedValue}</p>
    </div>
  )
}

const BooleanItem = ({ value, label }: { value?: boolean, label: string }) => (
    <div className="flex items-center gap-3">
        {value ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
        <span className="text-sm text-zinc-200">{label}</span>
    </div>
)

const StatusTimeline = ({ history }: { history: Lead['statusHistory'] }) => (
  <div className="relative pl-4 border-l-2 border-zinc-700">
    {history && history.map((item, index) => (
      <div key={index} className="relative mb-6 ml-6">
        <div className="absolute -left-[34px] top-1 flex items-center justify-center w-4 h-4 bg-zinc-700 rounded-full">
            <div className="w-2 h-2 bg-cyan-400 rounded-full" />
        </div>
        <p className="font-semibold text-base">{item.status}</p>
        <p className="text-xs text-zinc-400">{format(new Date(item.changedAt), "PPP 'at' p")}</p>
      </div>
    ))}
  </div>
)
