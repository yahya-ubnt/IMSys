"use client"

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, ChevronRight, ChevronLeft, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- Interface Definitions ---
export interface MikrotikPackageFormData {
  mikrotikRouter: string;
  serviceType: 'pppoe' | 'static';
  name: string;
  price: number;
  durationInDays: number;
  profile?: string;
  rateLimit?: string;
  status: 'active' | 'disabled';
}

interface MikrotikRouter { _id: string; name: string; }

interface MikrotikPackageFormProps {
  isEditMode: boolean;
  initialData?: Partial<MikrotikPackageFormData>;
  onSubmit: (data: MikrotikPackageFormData) => Promise<void>;
  isSubmitting: boolean;
  routers: MikrotikRouter[];
  pppProfiles?: string[];
  isPppProfilesLoading?: boolean;
}

// --- Helper Functions & Components ---
const StepIndicator = ({ currentStep }: { currentStep: number }) => (
    <div className="flex items-center justify-center gap-3">
        <div className="flex items-center gap-2"><div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all duration-300 ${currentStep === 1 ? 'bg-blue-600 text-white' : 'bg-zinc-700 text-zinc-400'}`}>1</div><span className={`text-sm transition-colors ${currentStep === 1 ? 'text-blue-400' : 'text-zinc-500'}`}>Initial Setup</span></div>
        <div className={`w-12 h-px transition-colors ${currentStep === 2 ? 'bg-blue-500' : 'bg-zinc-700'}`}></div>
        <div className="flex items-center gap-2"><div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all duration-300 ${currentStep === 2 ? 'bg-blue-600 text-white' : 'bg-zinc-700 text-zinc-400'}`}>2</div><span className={`text-sm transition-colors ${currentStep === 2 ? 'text-blue-400' : 'text-zinc-500'}`}>Package Details</span></div>
    </div>
);

const formVariants = {
    hidden: (direction: number) => ({ opacity: 0, x: direction > 0 ? 50 : -50 }),
    visible: { opacity: 1, x: 0, transition: { duration: 0.2, ease: "easeInOut" } },
    exit: (direction: number) => ({ opacity: 0, x: direction < 0 ? 50 : -50, transition: { duration: 0.2, ease: "easeInOut" } }),
};

const deconstructDuration = (days: number | undefined) => {
    if (days === undefined) return { value: "30", unit: 'days' };
    if (days % 365 === 0) return { value: (days / 365).toString(), unit: 'years' };
    if (days % 30 === 0) return { value: (days / 30).toString(), unit: 'months' };
    if (days % 7 === 0) return { value: (days / 7).toString(), unit: 'weeks' };
    return { value: days.toString(), unit: 'days' };
};

// --- Main Form Component ---
export function MikrotikPackageForm({ isEditMode, initialData, onSubmit, isSubmitting, routers, pppProfiles = [], isPppProfilesLoading = false }: MikrotikPackageFormProps) {
    const { toast } = useToast();
    const [step, setStep] = useState(1);
    const [direction, setDirection] = useState(1);

    // --- State Management ---
    const [mikrotikRouterId, setMikrotikRouterId] = useState(initialData?.mikrotikRouter || "");
    const [serviceType, setServiceType] = useState<'pppoe' | 'static' | ''>(initialData?.serviceType || '');
    const [name, setName] = useState(initialData?.name || "");
    const [price, setPrice] = useState(initialData?.price?.toString() || "");
    const [durationValue, setDurationValue] = useState(deconstructDuration(initialData?.durationInDays).value);
    const [durationUnit, setDurationUnit] = useState(deconstructDuration(initialData?.durationInDays).unit);
    const [profile, setProfile] = useState(initialData?.profile || "");
    const [rateLimit, setRateLimit] = useState(initialData?.rateLimit || "");
    const [status, setStatus] = useState<'active' | 'disabled'>(initialData?.status || "active");

    // --- Event Handlers ---
    const handleNext = () => {
        if (mikrotikRouterId && serviceType) {
            setDirection(1);
            setStep(2);
        } else {
            toast({ title: "Missing Information", description: "Please select a router and service type.", variant: "destructive" });
        }
    };

    const handleBack = () => {
        setDirection(-1);
        setStep(1);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!serviceType) {
            toast({ title: "Validation Error", description: "Please select a service type.", variant: "destructive" });
            return;
        }

        let durationInDays = 0;
        const value = parseInt(durationValue, 10);
        switch (durationUnit) {
            case 'days': durationInDays = value; break;
            case 'weeks': durationInDays = value * 7; break;
            case 'months': durationInDays = value * 30; break;
            case 'years': durationInDays = value * 365; break;
        }

        const packageData: MikrotikPackageFormData = { mikrotikRouter: mikrotikRouterId, serviceType, name, price: parseFloat(price), durationInDays, profile, rateLimit, status };
        await onSubmit(packageData);
    };

    return (
        <motion.div layout className="bg-zinc-900/50 backdrop-blur-lg border-zinc-700 shadow-2xl shadow-blue-500/10 rounded-xl overflow-hidden">
            <Card className="bg-transparent border-none">
                <CardHeader className="p-4 border-b border-zinc-800"><StepIndicator currentStep={step} /></CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="p-5">
                        <AnimatePresence mode="wait" custom={direction}>
                            {step === 1 ? (
                                <motion.div key={1} custom={direction} variants={formVariants} initial="hidden" animate="visible" exit="exit" className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="space-y-1"><Label className="text-xs">Mikrotik Router</Label><Select onValueChange={setMikrotikRouterId} value={mikrotikRouterId} disabled={isEditMode}><SelectTrigger className="bg-zinc-800 border-zinc-700 h-9 text-sm"><SelectValue placeholder="Select a router" /></SelectTrigger><SelectContent className="bg-zinc-800 text-white border-zinc-700">{routers.map(r => <SelectItem key={r._id} value={r._id} className="text-sm">{r.name}</SelectItem>)}</SelectContent></Select></div>
                                        <div className="space-y-1"><Label className="text-xs">Service Type</Label><Select onValueChange={(v: "pppoe" | "static") => setServiceType(v)} value={serviceType} disabled={isEditMode}><SelectTrigger className="bg-zinc-800 border-zinc-700 h-9 text-sm"><SelectValue placeholder="Select service type" /></SelectTrigger><SelectContent className="bg-zinc-800 text-white border-zinc-700"><SelectItem value="pppoe" className="text-sm">PPPoE</SelectItem><SelectItem value="static" className="text-sm">Static IP</SelectItem></SelectContent></Select></div>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div key={2} custom={direction} variants={formVariants} initial="hidden" animate="visible" exit="exit" className="space-y-3">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="space-y-1"><Label className="text-xs">Name</Label><Input value={name} onChange={e => setName(e.target.value)} required className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
                                        <div className="space-y-1"><Label className="text-xs">Price</Label><Input type="number" value={price} onChange={e => setPrice(e.target.value)} required className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
                                        <div className="space-y-1 col-span-2">
                                            <Label className="text-xs">Duration</Label>
                                            <div className="grid grid-cols-3 gap-2">
                                                <Select onValueChange={setDurationUnit} value={durationUnit}><SelectTrigger className="bg-zinc-800 border-zinc-700 h-9 text-sm col-span-1"><SelectValue /></SelectTrigger><SelectContent className="bg-zinc-800 text-white border-zinc-700"><SelectItem value="days">Days</SelectItem><SelectItem value="weeks">Weeks</SelectItem><SelectItem value="months">Months</SelectItem><SelectItem value="years">Years</SelectItem></SelectContent></Select>
                                                <Input type="number" value={durationValue} onChange={e => setDurationValue(e.target.value)} required className="h-9 bg-zinc-800 border-zinc-700 text-sm col-span-2" />
                                            </div>
                                        </div>
                                        <div className="space-y-1"><Label className="text-xs">Status</Label><Select onValueChange={(v: "active" | "disabled") => setStatus(v)} value={status}><SelectTrigger className="bg-zinc-800 border-zinc-700 h-9 text-sm"><SelectValue placeholder="Select status" /></SelectTrigger><SelectContent className="bg-zinc-800 text-white border-zinc-700"><SelectItem value="active" className="text-sm">Active</SelectItem><SelectItem value="disabled" className="text-sm">Inactive</SelectItem></SelectContent></Select></div>
                                        {serviceType === "pppoe" && <div className="space-y-1"><Label className="text-xs">Profile</Label><Select onValueChange={setProfile} value={profile} disabled={isPppProfilesLoading}><SelectTrigger className="bg-zinc-800 border-zinc-700 h-9 text-sm"><SelectValue placeholder="Select a profile" /></SelectTrigger><SelectContent className="bg-zinc-800 text-white border-zinc-700">{pppProfiles.map(p => <SelectItem key={p} value={p} className="text-sm">{p}</SelectItem>)}</SelectContent></Select></div>}
                                        {serviceType === "static" && <div className="space-y-1"><Label className="text-xs">Rate Limit</Label><Input value={rateLimit} onChange={e => setRateLimit(e.target.value)} required className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </CardContent>
                    <CardFooter className="p-4 flex items-center justify-between border-t border-zinc-800">
                        <div>{step > 1 && <Button type="button" variant="outline" size="sm" onClick={handleBack}><ChevronLeft className="mr-1 h-4 w-4" />Back</Button>}</div>
                        <div>
                            {step === 1 && <Button type="button" size="sm" onClick={handleNext}>Next<ChevronRight className="ml-1 h-4 w-4" /></Button>}
                            {step === 2 && <Button type="submit" size="sm" disabled={isSubmitting} className="bg-gradient-to-r from-blue-600 to-cyan-500">{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}{isSubmitting ? "Saving..." : (isEditMode ? "Save Changes" : "Save Package")}</Button>}
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </motion.div>
    );
}
