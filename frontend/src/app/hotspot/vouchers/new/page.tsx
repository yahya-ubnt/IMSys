"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save, ChevronRight, ChevronLeft, Loader2 } from "lucide-react";
import { Topbar } from "@/components/topbar";
import { motion, AnimatePresence } from "framer-motion";

// --- Interface Definitions ---
interface MikrotikRouter { _id: string; name: string; ipAddress: string; }
interface HotspotPlan { _id: string; name: string; server: string; profile: string; price: number; timeLimitValue: number; timeLimitUnit: string; dataLimitValue: number; dataLimitUnit: string; }

// --- Step Indicator ---
const StepIndicator = ({ currentStep }: { currentStep: number }) => (
    <div className="flex items-center justify-center gap-3">
        <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all duration-300 ${currentStep === 1 ? 'bg-blue-600 text-white' : 'bg-zinc-700 text-zinc-400'}`}>1</div>
            <span className={`text-sm transition-colors ${currentStep === 1 ? 'text-blue-400' : 'text-zinc-500'}`}>Router & Plan</span>
        </div>
        <div className={`w-12 h-px transition-colors ${currentStep === 2 ? 'bg-blue-500' : 'bg-zinc-700'}`}></div>
        <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all duration-300 ${currentStep === 2 ? 'bg-blue-600 text-white' : 'bg-zinc-700 text-zinc-400'}`}>2</div>
            <span className={`text-sm transition-colors ${currentStep === 2 ? 'text-blue-400' : 'text-zinc-500'}`}>Voucher Details</span>
        </div>
    </div>
);

// --- Framer Motion Variants ---
const formVariants = {
    hidden: (direction: number) => ({ opacity: 0, x: direction > 0 ? 50 : -50 }),
    visible: { opacity: 1, x: 0, transition: { duration: 0.2, ease: "easeInOut" } },
    exit: (direction: number) => ({ opacity: 0, x: direction < 0 ? 50 : -50, transition: { duration: 0.2, ease: "easeInOut" } }),
};

// --- Main Component ---
export default function NewVoucherPage() {
    const [step, setStep] = useState(1);
    const [direction, setDirection] = useState(1);
    const [mikrotikRouterId, setMikrotikRouterId] = useState("");
    const [planId, setPlanId] = useState("");
    const [server, setServer] = useState("");
    const [profile, setProfile] = useState("");
    const [numberOfVouchers, setNumberOfVouchers] = useState("1");
    const [withPassword, setWithPassword] = useState(true);
    const [nameLength, setNameLength] = useState("6");
    const [price, setPrice] = useState("0");
    const [timeLimitValue, setTimeLimitValue] = useState("1");
    const [timeLimitUnit, setTimeLimitUnit] = useState("hours");
    const [dataLimitValue, setDataLimitValue] = useState("0");
    const [dataLimitUnit, setDataLimitUnit] = useState("GB");

    const [routers, setRouters] = useState<MikrotikRouter[]>([]);
    const [plans, setPlans] = useState<HotspotPlan[]>([]);
    const [loading, setLoading] = useState(false);
    const [routersLoading, setRoutersLoading] = useState(true);
    const [plansLoading, setPlansLoading] = useState(false);

    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        const fetchRouters = async () => {
            try {
                const response = await fetch("/api/mikrotik/routers");
                if (!response.ok) throw new Error("Failed to fetch routers");
                setRouters(await response.json());
            } catch {
                toast({ title: "Error", description: "Failed to load routers.", variant: "destructive" });
            } finally {
                setRoutersLoading(false);
            }
        };
        fetchRouters();
    }, [toast]);

    useEffect(() => {
        const fetchPlans = async () => {
            if (!mikrotikRouterId) return;
            setPlansLoading(true);
            try {
                const response = await fetch(`/api/hotspot/plans?router=${mikrotikRouterId}`);
                if (!response.ok) throw new Error("Failed to fetch Hotspot plans");
                setPlans(await response.json());
            } catch {
                toast({ title: "Error", description: "Failed to load hotspot plans.", variant: "destructive" });
            } finally {
                setPlansLoading(false);
            }
        };
        fetchPlans();
    }, [toast, mikrotikRouterId]);

    useEffect(() => {
        if (planId) {
            const selectedPlan = plans.find(p => p._id === planId);
            if (selectedPlan) {
                setServer(selectedPlan.server);
                setProfile(selectedPlan.profile);
                setPrice(selectedPlan.price.toString());
                setTimeLimitValue(selectedPlan.timeLimitValue.toString());
                setTimeLimitUnit(selectedPlan.timeLimitUnit);
                setDataLimitValue(selectedPlan.dataLimitValue.toString());
                setDataLimitUnit(selectedPlan.dataLimitUnit);
            }
        }
    }, [planId, plans]);

    const handleNext = () => {
        if (mikrotikRouterId && planId) {
            setDirection(1);
            setStep(2);
        } else {
            toast({ title: "Missing Information", description: "Please select a router and a plan.", variant: "destructive" });
        }
    };

    const handleBack = () => {
        setDirection(-1);
        setStep(1);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const voucherData = { 
            mikrotikRouter: mikrotikRouterId, 
            plan: planId, 
            quantity: parseInt(numberOfVouchers), 
            server, 
            profile, 
            withPassword, 
            nameLength: parseInt(nameLength), 
            price: parseFloat(price), 
            timeLimitValue: parseInt(timeLimitValue), 
            timeLimitUnit, 
            dataLimitValue: parseInt(dataLimitValue), 
            dataLimitUnit 
        };
        try {
            const response = await fetch("/api/hotspot/vouchers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(voucherData),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to create vouchers");
            }
            toast({ title: "Vouchers Created", description: "Vouchers created successfully." });
            router.push("/hotspot/vouchers");
        } catch (error: unknown) {
            toast({ title: "Error", description: (error instanceof Error) ? error.message : "Failed to create vouchers.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-zinc-900 text-white">
            <Topbar />
            <div className="flex-1 p-6 space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/hotspot/vouchers"><Button variant="ghost" size="icon" className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700"><ArrowLeft className="h-4 w-4" /></Button></Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Create Hotspot Vouchers</h1>
                        <p className="text-sm text-zinc-400">Create a new batch of hotspot vouchers.</p>
                    </div>
                </div>

                <div className="flex justify-center">
                    <div className="w-full max-w-2xl">
                        <form onSubmit={handleSubmit}>
                            <motion.div layout className="bg-zinc-900/50 backdrop-blur-lg border-zinc-700 shadow-2xl shadow-blue-500/10 rounded-xl overflow-hidden">
                                <Card className="bg-transparent border-none">
                                    <CardHeader className="p-4 border-b border-zinc-800"><StepIndicator currentStep={step} /></CardHeader>
                                    <CardContent className="p-5">
                                        <AnimatePresence mode="wait" custom={direction}>
                                            {step === 1 ? (
                                                <motion.div key={1} custom={direction} variants={formVariants} initial="hidden" animate="visible" exit="exit" className="space-y-4">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        <div className="space-y-1"><Label className="text-xs">Mikrotik Router</Label><Select onValueChange={setMikrotikRouterId} value={mikrotikRouterId} disabled={routersLoading}><SelectTrigger className="bg-zinc-800 border-zinc-700 h-9 text-sm"><SelectValue placeholder="Select a router" /></SelectTrigger><SelectContent className="bg-zinc-800 text-white border-zinc-700">{routers.map(r => <SelectItem key={r._id} value={r._id} className="text-sm">{r.name}</SelectItem>)}</SelectContent></Select></div>
                                                        <div className="space-y-1"><Label className="text-xs">Hotspot Plan</Label><Select onValueChange={setPlanId} value={planId} disabled={plansLoading}><SelectTrigger className="bg-zinc-800 border-zinc-700 h-9 text-sm"><SelectValue placeholder="Select a plan" /></SelectTrigger><SelectContent className="bg-zinc-800 text-white border-zinc-700">{plans.map(p => <SelectItem key={p._id} value={p._id} className="text-sm">{p.name}</SelectItem>)}</SelectContent></Select></div>
                                                    </div>
                                                </motion.div>
                                            ) : (
                                                <motion.div key={2} custom={direction} variants={formVariants} initial="hidden" animate="visible" exit="exit" className="space-y-3">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        <div className="space-y-1"><Label className="text-xs">Number of Vouchers</Label><Input type="number" value={numberOfVouchers} onChange={e => setNumberOfVouchers(e.target.value)} required className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
                                                        <div className="space-y-1"><Label className="text-xs">Username Length</Label><Input type="number" value={nameLength} onChange={e => setNameLength(e.target.value)} required className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
                                                        <div className="space-y-1"><Label className="text-xs">Price</Label><Input type="number" value={price} onChange={e => setPrice(e.target.value)} required className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
                                                        <div className="items-center flex space-x-2 pt-2"><Checkbox id="withPassword" checked={withPassword} onCheckedChange={(checked: boolean) => setWithPassword(checked)} /><label htmlFor="withPassword" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Generate Password</label></div>
                                                    </div>
                                                    <div className="space-y-1"><Label className="text-xs">Time Limit</Label><div className="flex gap-2"><Input type="number" value={timeLimitValue} onChange={e => setTimeLimitValue(e.target.value)} required className="h-9 bg-zinc-800 border-zinc-700 text-sm" /><Select onValueChange={setTimeLimitUnit} value={timeLimitUnit}><SelectTrigger className="bg-zinc-800 border-zinc-700 h-9 text-sm w-[120px]"><SelectValue /></SelectTrigger><SelectContent className="bg-zinc-800 text-white border-zinc-700"><SelectItem value="minutes">Minutes</SelectItem><SelectItem value="hours">Hours</SelectItem><SelectItem value="days">Days</SelectItem></SelectContent></Select></div></div>
                                                    <div className="space-y-1"><Label className="text-xs">Data Limit</Label><div className="flex gap-2"><Input type="number" value={dataLimitValue} onChange={e => setDataLimitValue(e.target.value)} required className="h-9 bg-zinc-800 border-zinc-700 text-sm" /><Select onValueChange={setDataLimitUnit} value={dataLimitUnit}><SelectTrigger className="bg-zinc-800 border-zinc-700 h-9 text-sm w-[120px]"><SelectValue /></SelectTrigger><SelectContent className="bg-zinc-800 text-white border-zinc-700"><SelectItem value="MB">MB</SelectItem><SelectItem value="GB">GB</SelectItem></SelectContent></Select></div></div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </CardContent>
                                    <CardFooter className="p-4 flex items-center justify-between border-t border-zinc-800">
                                        <div>{step > 1 && <Button type="button" variant="outline" size="sm" onClick={handleBack}><ChevronLeft className="mr-1 h-4 w-4" />Back</Button>}</div>
                                        <div>
                                            {step === 1 && <Button type="button" size="sm" onClick={handleNext}>Next<ChevronRight className="ml-1 h-4 w-4" /></Button>}
                                            {step === 2 && <Button type="submit" size="sm" disabled={loading} className="bg-gradient-to-r from-blue-600 to-cyan-500">{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}{loading ? "Creating..." : "Create Vouchers"}</Button>}
                                        </div>
                                    </CardFooter>
                                </Card>
                            </motion.div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
