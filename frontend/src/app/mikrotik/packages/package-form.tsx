"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Package } from "@/types/mikrotik-package";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Save, Loader2 } from "lucide-react";

interface MikrotikRouter {
  _id: string;
  name: string;
  ipAddress: string;
}

export type PackageFormData = {
  mikrotikRouter: string;
  serviceType: 'pppoe' | 'static';
  name: string;
  price: number;
  status: 'active' | 'disabled';
  profile?: string;
  rateLimit?: string;
}

type FormState = Omit<PackageFormData, 'price'> & {
  price: string;
}

interface PackageFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: PackageFormData) => void
  initialData: Package | null
  isSubmitting: boolean
}

const StepIndicator = ({ currentStep }: { currentStep: number }) => (
    <div className="flex items-center justify-center gap-3">
        <div className="flex items-center gap-2"><div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all duration-300 ${currentStep === 1 ? 'bg-blue-600 text-white' : 'bg-zinc-700 text-zinc-400'}`}>1</div><span className={`text-sm transition-colors ${currentStep === 1 ? 'text-blue-400' : 'text-zinc-500'}`}>Basic Info</span></div>
        <div className={`w-12 h-px transition-colors ${currentStep === 2 ? 'bg-blue-500' : 'bg-zinc-700'}`}></div>
        <div className="flex items-center gap-2"><div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all duration-300 ${currentStep === 2 ? 'bg-blue-600 text-white' : 'bg-zinc-700 text-zinc-400'}`}>2</div><span className={`text-sm transition-colors ${currentStep === 2 ? 'text-blue-400' : 'text-zinc-500'}`}>Service Details</span></div>
    </div>
);

const formVariants = {
    hidden: (direction: number) => ({ opacity: 0, x: direction > 0 ? 50 : -50 }),
    visible: { opacity: 1, x: 0, transition: { duration: 0.2, ease: "easeInOut" } },
    exit: (direction: number) => ({ opacity: 0, x: direction < 0 ? 50 : -50, transition: { duration: 0.2, ease: "easeInOut" } }),
};

export function PackageForm({ isOpen, onClose, onSubmit, initialData, isSubmitting }: PackageFormProps) {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const { toast } = useToast();
  const [formData, setFormData] = useState<FormState>({
    mikrotikRouter: "",
    serviceType: "pppoe",
    name: "",
    price: "",
    status: "active",
    profile: "",
    rateLimit: "",
  })
  const [routers, setRouters] = useState<MikrotikRouter[]>([])
  const [pppoeProfiles, setPppoeProfiles] = useState<string[]>([])
  const [isProfilesLoading, setIsProfilesLoading] = useState(false)

  useEffect(() => {
    if (initialData) {
      setFormData({
        mikrotikRouter: typeof initialData.mikrotikRouter === 'string' ? initialData.mikrotikRouter : initialData.mikrotikRouter._id,
        serviceType: initialData.serviceType,
        name: initialData.name,
        price: initialData.price.toString(),
        status: initialData.status,
        profile: initialData.profile || "",
        rateLimit: initialData.rateLimit || "",
      })
    } else {
      setFormData({
        mikrotikRouter: "",
        serviceType: "pppoe",
        name: "",
        price: "",
        status: "active",
        profile: "",
        rateLimit: "",
      })
    }
  }, [initialData])

  useEffect(() => {
    const fetchRouters = async () => {
      try {
        const response = await fetch("/api/mikrotik/routers", {
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error("Failed to fetch routers")
        }

        const data = await response.json()
        setRouters(data)
      } catch (error) {
        console.error("Error fetching routers:", error)
      }
    }
    if (isOpen) {
      fetchRouters()
    }
  }, [isOpen])

  useEffect(() => {
    const fetchPppoeProfiles = async () => {
      if (formData.mikrotikRouter && formData.serviceType === 'pppoe') {
        setIsProfilesLoading(true);
        try {
          const response = await fetch(`/api/mikrotik/routers/${formData.mikrotikRouter}/ppp-profiles`, {
            credentials: 'include',
          });

          if (!response.ok) {
            throw new Error("Failed to fetch PPPoE profiles");
          }

          const data = await response.json();
          setPppoeProfiles(data);
        } catch (error) {
          console.error("Error fetching PPPoE profiles:", error);
          setPppoeProfiles([]);
        } finally {
          setIsProfilesLoading(false);
        }
      } else {
        setPppoeProfiles([]);
      }
    };

    fetchPppoeProfiles();
  }, [formData.mikrotikRouter, formData.serviceType]);

  const handleNext = () => {
      setDirection(1);
      setStep(2);
  };
  const handleBack = () => { setDirection(-1); setStep(1); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const priceAsNumber = parseFloat(formData.price);
    if (isNaN(priceAsNumber) || formData.price.trim() === "") {
      toast({
        title: "Validation Error",
        description: "Price is required and must be a valid number.",
        variant: "destructive",
      });
      return;
    }
    const dataToSubmit: PackageFormData = {
      ...formData,
      price: priceAsNumber,
    };
    onSubmit(dataToSubmit)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-zinc-900/50 backdrop-blur-lg border-zinc-700 text-white shadow-2xl shadow-blue-500/10 rounded-xl">
        <DialogHeader className="p-4 border-b border-zinc-800">
          <DialogTitle className="text-lg font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">{initialData ? "Edit Package" : "Create New Package"}</DialogTitle>
          <DialogDescription className="text-zinc-400">
            {initialData ? "Update the details for this package." : "Fill out the form to add a new package."}
          </DialogDescription>
        </DialogHeader>
        <div className="p-4 border-b border-zinc-800">
            <StepIndicator currentStep={step} />
        </div>
        <form onSubmit={handleSubmit}>
            <div className="p-5 min-h-[250px]">
                <AnimatePresence mode="wait" custom={direction}>
                    {step === 1 ? (
                        <motion.div key={1} custom={direction} variants={formVariants} initial="hidden" animate="visible" exit="exit" className="space-y-3">
                            <div className="space-y-1"><Label className="text-xs">Package Name</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1"><Label className="text-xs">Price</Label><Input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
                                <div className="space-y-1"><Label className="text-xs">Status</Label><Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as 'active' | 'disabled' })}><SelectTrigger className="bg-zinc-800 border-zinc-700 h-9 text-sm"><SelectValue /></SelectTrigger><SelectContent className="bg-zinc-800 text-white border-zinc-700"><SelectItem value="active">Active</SelectItem><SelectItem value="disabled">Disabled</SelectItem></SelectContent></Select></div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div key={2} custom={direction} variants={formVariants} initial="hidden" animate="visible" exit="exit" className="space-y-3">
                            <div className="space-y-1"><Label className="text-xs">Mikrotik Router</Label><Select value={formData.mikrotikRouter} onValueChange={(v) => setFormData({ ...formData, mikrotikRouter: v, profile: '' })} required><SelectTrigger className="bg-zinc-800 border-zinc-700 h-9 text-sm"><SelectValue placeholder="Select a router" /></SelectTrigger><SelectContent className="bg-zinc-800 text-white border-zinc-700">{routers.map(r => <SelectItem key={r._id} value={r._id}>{r.name}</SelectItem>)}</SelectContent></Select></div>
                            <div className="space-y-1"><Label className="text-xs">Service Type</Label><Select value={formData.serviceType} onValueChange={(v) => setFormData({ ...formData, serviceType: v as 'pppoe' | 'static', profile: '' })}><SelectTrigger className="bg-zinc-800 border-zinc-700 h-9 text-sm"><SelectValue /></SelectTrigger><SelectContent className="bg-zinc-800 text-white border-zinc-700"><SelectItem value="pppoe">PPPoE</SelectItem><SelectItem value="static">Static IP</SelectItem></SelectContent></Select></div>
                            {formData.serviceType === 'pppoe' && (
                                <div className="space-y-1">
                                    <Label className="text-xs">PPPoE Profile</Label>
                                    <Select 
                                        value={formData.profile} 
                                        onValueChange={(v) => setFormData({ ...formData, profile: v })}
                                        disabled={isProfilesLoading || !formData.mikrotikRouter}
                                    >
                                        <SelectTrigger className="bg-zinc-800 border-zinc-700 h-9 text-sm">
                                            <SelectValue placeholder={isProfilesLoading ? "Loading profiles..." : "Select a profile"} />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-800 text-white border-zinc-700">
                                            {pppoeProfiles.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            {formData.serviceType === 'static' && <div className="space-y-1"><Label className="text-xs">Rate Limit</Label><Input value={formData.rateLimit} onChange={(e) => setFormData({ ...formData, rateLimit: e.target.value })} className="h-9 bg-zinc-800 border-zinc-700 text-sm" placeholder="e.g., 10M/10M"/></div>}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <DialogFooter className="p-4 flex items-center justify-between border-t border-zinc-800">
                <div>{step > 1 && <Button type="button" variant="outline" size="sm" onClick={handleBack}><ChevronLeft className="mr-1 h-4 w-4" />Back</Button>}</div>
                <div>
                    {step === 1 && <Button type="button" size="sm" onClick={handleNext}>Next<ChevronRight className="ml-1 h-4 w-4" /></Button>}
                    {step === 2 && <Button type="submit" size="sm" disabled={isSubmitting} className="bg-gradient-to-r from-blue-600 to-cyan-500">{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}{isSubmitting ? "Saving..." : "Save Changes"}</Button>}
                </div>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}