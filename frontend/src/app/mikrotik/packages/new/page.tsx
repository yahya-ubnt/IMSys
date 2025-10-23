"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, ChevronRight, ChevronLeft, Loader2 } from "lucide-react";
import { Topbar } from "@/components/topbar";
import { motion, AnimatePresence } from "framer-motion";

// --- Interface Definitions ---
interface MikrotikRouter { _id: string; name: string; ipAddress: string; }
interface NewPackageData { mikrotikRouter: string; serviceType: 'pppoe' | 'static'; name: string; price: number; profile?: string; rateLimit?: string; status: 'active' | 'disabled'; }

// --- Step Indicator ---
const StepIndicator = ({ currentStep }: { currentStep: number }) => (
    <div className="flex items-center justify-center gap-3">
        <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all duration-300 ${currentStep === 1 ? 'bg-blue-600 text-white' : 'bg-zinc-700 text-zinc-400'}`}>1</div>
            <span className={`text-sm transition-colors ${currentStep === 1 ? 'text-blue-400' : 'text-zinc-500'}`}>Initial Setup</span>
        </div>
        <div className={`w-12 h-px transition-colors ${currentStep === 2 ? 'bg-blue-500' : 'bg-zinc-700'}`}></div>
        <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all duration-300 ${currentStep === 2 ? 'bg-blue-600 text-white' : 'bg-zinc-700 text-zinc-400'}`}>2</div>
            <span className={`text-sm transition-colors ${currentStep === 2 ? 'text-blue-400' : 'text-zinc-500'}`}>Package Details</span>
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
export default function NewPackagePage() {
    const [step, setStep] = useState(1);
    const [direction, setDirection] = useState(1);
    const [mikrotikRouterId, setMikrotikRouterId] = useState("");
    const [serviceType, setServiceType] = useState<"pppoe" | "static" | '' >('');
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [profile, setProfile] = useState("");
    const [rateLimit, setRateLimit] = useState("");
    const [status, setStatus] = useState<"active" | "disabled">("active");

    const [routers, setRouters] = useState<MikrotikRouter[]>([]);
    const [pppProfiles, setPppProfiles] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [routersLoading, setRoutersLoading] = useState(true);
    const [pppProfilesLoading, setPppProfilesLoading] = useState(false);

    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        const fetchRouters = async () => {
            try {
                const response = await fetch("/api/mikrotik/routers");
                if (!response.ok) throw new Error("Failed to fetch routers");
                setRouters(await response.json());
            } catch (err) {
                toast({ title: "Error", description: "Failed to load routers.", variant: "destructive" });
            } finally {
                setRoutersLoading(false);
            }
        };
        fetchRouters();
    }, [toast]);

    useEffect(() => {
        const fetchPppProfiles = async () => {
            if (!mikrotikRouterId) { setPppProfiles([]); return; }
            setPppProfilesLoading(true);
            try {
                const response = await fetch(`/api/mikrotik/routers/${mikrotikRouterId}/ppp-profiles`);
                if (!response.ok) throw new Error("Failed to fetch PPP profiles");
                setPppProfiles(await response.json());
            } catch (err) {
                toast({ title: "Error", description: "Failed to load PPP profiles.", variant: "destructive" });
            } finally {
                setPppProfilesLoading(false);
            }
        };
        if (serviceType === "pppoe") fetchPppProfiles();
    }, [toast, mikrotikRouterId, serviceType]);

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
        setLoading(true);
        const packageData: NewPackageData = { mikrotikRouter: mikrotikRouterId, serviceType, name, price: parseFloat(price), profile, rateLimit, status };
        try {
            const response = await fetch("/api/mikrotik/packages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(packageData),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to add package");
            }
            toast({ title: "Package Added", description: "Package added successfully." });
            router.push("/mikrotik/packages");
        } catch (error: unknown) {
            toast({ title: "Error", description: (error instanceof Error) ? error.message : "Failed to add package.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-zinc-900 text-white">
            <Topbar />
            <div className="flex-1 p-6 space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/mikrotik/packages"><Button variant="ghost" size="icon" className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700"><ArrowLeft className="h-4 w-4" /></Button></Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Add New Package</h1>
                        <p className="text-sm text-zinc-400">Create a new Mikrotik package record.</p>
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
                                                        <div className="space-y-1"><Label className="text-xs">Service Type</Label><Select onValueChange={(v: "pppoe" | "static") => setServiceType(v)} value={serviceType}><SelectTrigger className="bg-zinc-800 border-zinc-700 h-9 text-sm"><SelectValue placeholder="Select service type" /></SelectTrigger><SelectContent className="bg-zinc-800 text-white border-zinc-700"><SelectItem value="pppoe" className="text-sm">PPPoE</SelectItem><SelectItem value="static" className="text-sm">Static IP</SelectItem></SelectContent></Select></div>
                                                    </div>
                                                </motion.div>
                                            ) : (
                                                <motion.div key={2} custom={direction} variants={formVariants} initial="hidden" animate="visible" exit="exit" className="space-y-3">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        <div className="space-y-1"><Label className="text-xs">Name</Label><Input value={name} onChange={e => setName(e.target.value)} required className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
                                                        <div className="space-y-1"><Label className="text-xs">Price</Label><Input type="number" value={price} onChange={e => setPrice(e.target.value)} required className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
                                                        <div className="space-y-1"><Label className="text-xs">Status</Label><Select onValueChange={(v: "active" | "disabled") => setStatus(v)} value={status}><SelectTrigger className="bg-zinc-800 border-zinc-700 h-9 text-sm"><SelectValue placeholder="Select status" /></SelectTrigger><SelectContent className="bg-zinc-800 text-white border-zinc-700"><SelectItem value="active" className="text-sm">Active</SelectItem><SelectItem value="disabled" className="text-sm">Inactive</SelectItem></SelectContent></Select></div>
                                                        {serviceType === "pppoe" && <div className="space-y-1"><Label className="text-xs">Profile</Label><Select onValueChange={setProfile} value={profile} disabled={pppProfilesLoading || !mikrotikRouterId}><SelectTrigger className="bg-zinc-800 border-zinc-700 h-9 text-sm"><SelectValue placeholder="Select a profile" /></SelectTrigger><SelectContent className="bg-zinc-800 text-white border-zinc-700">{pppProfiles.map(p => <SelectItem key={p} value={p} className="text-sm">{p}</SelectItem>)}</SelectContent></Select></div>}
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
                                            {step === 2 && <Button type="submit" size="sm" disabled={loading} className="bg-gradient-to-r from-blue-600 to-cyan-500">{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}{loading ? "Saving..." : "Save Package"}</Button>}
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