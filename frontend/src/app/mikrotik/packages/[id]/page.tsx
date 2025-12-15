"use client"

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, ChevronRight, ChevronLeft, Loader2 } from "lucide-react";
import { Topbar } from "@/components/topbar";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

// --- Interface Definitions ---
interface Package {
    _id: string;
    mikrotikRouter: { _id: string; name: string; };
    serviceType: 'pppoe' | 'static';
    name: string;
    price: number;
    profile?: string;
    rateLimit?: string;
    status: 'active' | 'disabled';
}

// --- Step Indicator ---
const StepIndicator = ({ currentStep }: { currentStep: number }) => (
    <div className="flex items-center justify-center gap-3">
        <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all duration-300 ${currentStep === 1 ? 'bg-blue-600 text-white' : 'bg-zinc-700 text-zinc-400'}`}>1</div>
            <span className={`text-sm transition-colors ${currentStep === 1 ? 'text-blue-400' : 'text-zinc-500'}`}>Router Info</span>
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
export default function EditPackagePage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
    const params = React.use(paramsPromise);
    const { id } = params;

    const [step, setStep] = useState(1);
    const [direction, setDirection] = useState(1);

    const [packageData, setPackageData] = useState<Package | null>(null);
    const [serviceType, setServiceType] = useState<'pppoe' | 'static' | undefined>(undefined);
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [profile, setProfile] = useState("");
    const [rateLimit, setRateLimit] = useState("");
    const [status, setStatus] = useState<'active' | 'disabled'>("active");
    const [pppProfiles, setPppProfiles] = useState<string[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [pppProfilesLoading, setPppProfilesLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        const fetchPackage = async () => {
            try {
                const response = await fetch(`/api/mikrotik/packages/${id}`);
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || "Failed to fetch package");
                }
                const data: Package = await response.json();
                setPackageData(data);
                setName(data.name);
                setServiceType(data.serviceType);
                setPrice(data.price.toString());
                setProfile(data.profile || "");
                setRateLimit(data.rateLimit || "");
                setStatus(data.status);
            } catch (err: unknown) {
                setError((err instanceof Error) ? err.message : "Failed to load package data.");
            }
        };
        if (id) fetchPackage();
    }, [id]);

    useEffect(() => {
        const fetchPppProfiles = async () => {
            if (!packageData?.mikrotikRouter?._id) {
                setPppProfiles([]);
                return;
            }
            setPppProfilesLoading(true);
            try {
                const response = await fetch(`/api/mikrotik/routers/${packageData.mikrotikRouter._id}/ppp-profiles`);
                if (!response.ok) throw new Error("Failed to fetch PPP profiles");
                setPppProfiles(await response.json());
            } catch {
                toast({ title: "Error", description: "Failed to load PPP profiles.", variant: "destructive" });
            } finally {
                setPppProfilesLoading(false);
            }
        };
        if (serviceType === "pppoe") fetchPppProfiles();
    }, [toast, packageData, serviceType]);

    const handleNext = () => {
        if (serviceType) {
            setDirection(1);
            setStep(2);
        } else {
            toast({ title: "Missing Information", description: "Please select a service type.", variant: "destructive" });
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
        const updatedPackageData = { name, serviceType, price: parseFloat(price), profile, rateLimit, status };
        try {
            const response = await fetch(`/api/mikrotik/packages/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedPackageData),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to update package");
            }
            toast({ title: "Package Updated", description: "Package updated successfully." });
            router.push("/mikrotik/packages");
        } catch (error: unknown) {
            toast({ title: "Error", description: (error instanceof Error) ? error.message : "Failed to update package.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen bg-zinc-900 text-white">
                <Topbar />
                <div className="flex-1 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col min-h-screen bg-zinc-900 text-white">
                <Topbar />
                <div className="flex-1 flex items-center justify-center text-center">
                    <div>
                        <p className="text-red-500">{error}</p>
                        <Button onClick={() => window.location.reload()} className="mt-4">Retry</Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-zinc-900 text-white">
            <Topbar />
            <div className="flex-1 p-6 space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/mikrotik/packages"><Button variant="ghost" size="icon" className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700"><ArrowLeft className="h-4 w-4" /></Button></Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Edit Package</h1>
                        <p className="text-sm text-zinc-400">Update the details for {packageData?.name}.</p>
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
                                                        <div className="space-y-1"><Label className="text-xs">Mikrotik Router</Label><Input value={packageData?.mikrotikRouter?.name || 'Loading...'} disabled className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
                                                        <div className="space-y-1"><Label className="text-xs">Service Type</Label><Select onValueChange={(v: "pppoe" | "static") => setServiceType(v)} value={serviceType}><SelectTrigger className="bg-zinc-800 border-zinc-700 h-9 text-sm"><SelectValue placeholder="Select service type" /></SelectTrigger><SelectContent className="bg-zinc-800 text-white border-zinc-700"><SelectItem value="pppoe" className="text-sm">PPPoE</SelectItem><SelectItem value="static" className="text-sm">Static IP</SelectItem></SelectContent></Select></div>
                                                    </div>
                                                </motion.div>
                                            ) : (
                                                <motion.div key={2} custom={direction} variants={formVariants} initial="hidden" animate="visible" exit="exit" className="space-y-3">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        <div className="space-y-1"><Label className="text-xs">Name</Label><Input value={name} onChange={e => setName(e.target.value)} required className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
                                                        <div className="space-y-1"><Label className="text-xs">Price</Label><Input type="number" value={price} onChange={e => setPrice(e.target.value)} required className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
                                                        <div className="space-y-1"><Label className="text-xs">Status</Label><Select onValueChange={(v: "active" | "disabled") => setStatus(v)} value={status}><SelectTrigger className="bg-zinc-800 border-zinc-700 h-9 text-sm"><SelectValue placeholder="Select status" /></SelectTrigger><SelectContent className="bg-zinc-800 text-white border-zinc-700"><SelectItem value="active" className="text-sm">Active</SelectItem><SelectItem value="disabled" className="text-sm">Inactive</SelectItem></SelectContent></Select></div>
                                                        {serviceType === "pppoe" && <div className="space-y-1"><Label className="text-xs">Profile</Label><Select onValueChange={setProfile} value={profile} disabled={pppProfilesLoading}><SelectTrigger className="bg-zinc-800 border-zinc-700 h-9 text-sm"><SelectValue placeholder="Select a profile" /></SelectTrigger><SelectContent className="bg-zinc-800 text-white border-zinc-700">{pppProfiles.map(p => <SelectItem key={p} value={p} className="text-sm">{p}</SelectItem>)}</SelectContent></Select></div>}
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
                                            {step === 2 && <Button type="submit" size="sm" disabled={loading} className="bg-gradient-to-r from-blue-600 to-cyan-500">{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}{loading ? "Saving..." : "Save Changes"}</Button>}
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
