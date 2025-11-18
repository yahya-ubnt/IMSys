"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Topbar } from "@/components/topbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Edit, User, Phone, Calendar, Info, FileSignature, Router as RouterIcon } from "lucide-react"
import { format } from "date-fns"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

// --- TYPE DEFINITIONS ---
interface StatusHistory {
  status: string;
  changedAt: string;
}
interface Lead {
  _id: string;
  name?: string;
  phoneNumber: string;
  leadSource: string;
  desiredPackage?: { name: string };
  currentIsp?: string;
  notes?: string;
  broughtInBy?: string;
  broughtInByContact?: string;
  agreedInstallationFee?: number;
  agreedMonthlySubscription?: number;
  totalAmount?: number;
  customerHasRouter?: boolean;
  routerType?: string;
  customerHasReceiver?: boolean;
  receiverType?: string;
  followUpDate?: string;
  status: string;
  statusHistory: StatusHistory[];
  createdAt: string;
  updatedAt?: string;
}

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
        const response = await fetch(`/api/leads/${id}`, { credentials: 'include' })
        if (!response.ok) throw new Error('Failed to fetch lead')
        setLead(await response.json())
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to fetch lead details.', variant: 'destructive' })
      } finally {
        setIsLoading(false)
      }
    }
    fetchLead()
  }, [id, toast])

  if (isLoading) return <div className="flex h-screen items-center justify-center bg-zinc-900 text-white">Loading...</div>
  if (!lead) return <div className="flex h-screen items-center justify-center bg-zinc-900 text-red-400">Lead not found.</div>

  return (
    <div className="flex flex-col min-h-screen bg-zinc-900 text-white">
      <Topbar />
      <main className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Lead Details</h1>
            <p className="text-sm text-zinc-400">A comprehensive overview of the lead.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push('/leads')} className="bg-transparent border-zinc-700 hover:bg-zinc-800">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Leads
            </Button>
            <Button onClick={() => router.push(`/leads/edit/${lead._id}`)} className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white">
              <Edit className="mr-2 h-4 w-4" />
              Edit Lead
            </Button>
          </div>
        </div>

        <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="bg-zinc-900/50 backdrop-blur-lg shadow-2xl shadow-blue-500/10 rounded-xl">
          <Card className="bg-transparent border-none">
            <CardHeader className="border-b border-zinc-800">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl text-cyan-400">{lead.name || 'Unnamed Lead'}</CardTitle>
                  <CardDescription className="text-zinc-400">{lead.phoneNumber}</CardDescription>
                </div>
                <Badge variant={lead.status === 'Converted' ? 'default' : 'secondary'} className="text-sm">{lead.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: At a Glance & Timeline */}
              <div className="lg:col-span-1 space-y-6">
                <Section title="At a Glance">
                  <InfoItem icon={User} label="Brought In By" value={lead.broughtInBy} />
                  <InfoItem icon={Phone} label="Brought In By Contact" value={lead.broughtInByContact} />
                  <InfoItem icon={Calendar} label="Follow-up Date" value={lead.followUpDate ? format(new Date(lead.followUpDate), "PPP") : undefined} />
                  <InfoItem icon={Info} label="Lead Source" value={lead.leadSource} />
                  <InfoItem icon={Info} label="Current ISP" value={lead.currentIsp} />
                </Section>
                <Section title="Status History">
                  <StatusTimeline history={lead.statusHistory} />
                </Section>
              </div>

              {/* Right Column: Accordion */}
              <div className="lg:col-span-2">
                <Accordion type="single" collapsible defaultValue="agreement" className="w-full">
                  <AccordionItem value="agreement">
                    <AccordionTrigger>Agreement Details</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <InfoItem icon={FileSignature} label="Desired Package" value={lead.desiredPackage?.name} />
                        <InfoItem icon={FileSignature} label="Installation Fee" value={lead.agreedInstallationFee} isCurrency />
                        <InfoItem icon={FileSignature} label="Monthly Subscription" value={lead.agreedMonthlySubscription} isCurrency />
                        <InfoItem icon={FileSignature} label="Total Amount" value={lead.totalAmount} isCurrency />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="equipment">
                    <AccordionTrigger>Equipment</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <InfoItem icon={RouterIcon} label="Has Router?" value={lead.customerHasRouter ? 'Yes' : 'No'} />
                        {lead.customerHasRouter && <InfoItem icon={RouterIcon} label="Router Type" value={lead.routerType} />}
                        <InfoItem icon={RouterIcon} label="Has Receiver?" value={lead.customerHasReceiver ? 'Yes' : 'No'} />
                        {lead.customerHasReceiver && <InfoItem icon={RouterIcon} label="Receiver Type" value={lead.receiverType} />}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="notes">
                    <AccordionTrigger>Notes</AccordionTrigger>
                    <AccordionContent>
                      <InfoItem label="Reason for Interest" value={lead.notes} isTextArea />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  )
}

// --- SUB-COMPONENTS ---
const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div>
    <h3 className="font-semibold text-cyan-400 border-b border-zinc-800 pb-2 mb-4">{title}</h3>
    <div className="space-y-4">{children}</div>
  </div>
)

const InfoItem = ({ icon: Icon, label, value, isCurrency = false, isTextArea = false }: { icon?: React.ElementType, label: string, value?: string | number | boolean, isCurrency?: boolean, isTextArea?: boolean }) => {
  const displayValue = value === null || value === undefined || value === '' ? 'N/A' : value;
  const formattedValue = isCurrency && typeof displayValue === 'number'
    ? new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(displayValue)
    : displayValue.toString();

  return (
    <div className="space-y-1">
      <Label className="text-xs text-zinc-400 flex items-center gap-2">{Icon && <Icon className="w-4 h-4" />} {label}</Label>
      {isTextArea ? (
        <p className="text-sm p-2 bg-zinc-800/50 rounded-md min-h-[60px]">{formattedValue}</p>
      ) : (
        <p className="text-sm font-medium">{formattedValue}</p>
      )}
    </div>
  )
}

const StatusTimeline = ({ history }: { history: StatusHistory[] }) => (
  <div className="relative pl-6">
    <div className="absolute left-0 top-0 h-full w-0.5 bg-zinc-700" />
    {history.map((item, index) => (
      <div key={index} className="relative mb-6">
        <div className="absolute -left-[29px] top-1.5 h-4 w-4 rounded-full bg-cyan-500 border-4 border-zinc-900" />
        <p className="font-semibold text-sm">{item.status}</p>
        <p className="text-xs text-zinc-400">{format(new Date(item.changedAt), "PPP p")}</p>
      </div>
    ))}
  </div>
)
