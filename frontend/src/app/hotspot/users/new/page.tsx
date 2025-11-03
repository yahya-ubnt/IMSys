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
import { ArrowLeft, Save, ChevronRight, ChevronLeft, Loader2 } from "lucide-react";
import { Topbar } from "@/components/topbar";
import { motion, AnimatePresence } from "framer-motion";

// --- Interface Definitions ---
interface MikrotikRouter { _id: string; name: string; ipAddress: string; }
interface HotspotPlan { _id: string; name: string; }

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
            <span className={`text-sm transition-colors ${currentStep === 2 ? 'text-blue-400' : 'text-zinc-500'}`}>User Details</span>
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
export default function NewHotspotUserPage() {
    const [step, setStep] = useState(1);
    const [direction, setDirection] = useState(1);
    const [mikrotikRouterId, setMikrotikRouterId] = useState("");
    const [planId, setPlanId] = useState("");
    const [officialName, setOfficialName] = useState("");
    const [email, setEmail] = useState("");
    const [location, setLocation] = useState("");
    const [hotspotName, setHotspotName] = useState("");
    const [hotspotPassword, setHotspotPassword] = useState("");
    const [server, setServer] = useState("");
    const [profile, setProfile] = useState("");
    const [referenceNumber, setReferenceNumber] = useState("");
    const [billAmount, setBillAmount] = useState("");
    const [installationFee, setInstallationFee] = useState("0");
    const [billingCycleValue, setBillingCycleValue] = useState("1");
    const [billingCycleUnit, setBillingCycleUnit] = useState("months");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [expiryDate, setExpiryDate] = useState("");
    const [expiryTime, setExpiryTime] = useState("23:59");

    const [routers, setRouters] = useState<MikrotikRouter[]>([]);
    const [plans, setPlans] = useState<HotspotPlan[]>([]);
    const [hotspotProfiles, setHotspotProfiles] = useState<string[]>([]);
    const [hotspotServers, setHotspotServers] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [routersLoading, setRoutersLoading] = useState(true);
    const [plansLoading, setPlansLoading] = useState(false);
    const [profilesLoading, setProfilesLoading] = useState(false);
    const [serversLoading, setServersLoading] = useState(false);

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
        const fetchHotspotData = async () => {
            if (!mikrotikRouterId) return;
            setPlansLoading(true);
            setProfilesLoading(true);
            setServersLoading(true);
            try {
                const [plansRes, profilesRes, serversRes] = await Promise.all([
                    fetch(`/api/hotspot/plans?router=${mikrotikRouterId}`),
                    fetch(`/api/mikrotik/routers/${mikrotikRouterId}/hotspot-profiles`),
                    fetch(`/api/mikrotik/routers/${mikrotikRouterId}/hotspot-servers`),
                ]);
                if (!plansRes.ok) throw new Error("Failed to fetch Hotspot plans");
                if (!profilesRes.ok) throw new Error("Failed to fetch Hotspot profiles");
                if (!serversRes.ok) throw new Error("Failed to fetch Hotspot servers");
                setPlans(await plansRes.json());
                setHotspotProfiles(await profilesRes.json());
                setHotspotServers(await serversRes.json());
            } catch (err) {
                toast({ title: "Error", description: "Failed to load hotspot data.", variant: "destructive" });
            } finally {
                setPlansLoading(false);
                setProfilesLoading(false);
                setServersLoading(false);
            }
        };
        fetchHotspotData();
    }, [toast, mikrotikRouterId]);

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
        const userData = { mikrotikRouter: mikrotikRouterId, package: planId, officialName, email, location, hotspotName, hotspotPassword, server, profile, referenceNumber, billAmount: parseFloat(billAmount), installationFee: parseFloat(installationFee), billingCycleValue: parseInt(billingCycleValue), billingCycleUnit, phoneNumber, expiryDate, expiryTime };
        try {
            const response = await fetch("/api/hotspot/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(userData),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to add user");
            }
            toast({ title: "User Added", description: "Hotspot user added successfully." });
            router.push("/hotspot/users");
        } catch (error: unknown) {
            toast({ title: "Error", description: (error instanceof Error) ? error.message : "Failed to add user.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-zinc-900 text-white">
            <Topbar />
            <div className="flex-1 p-6 space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/hotspot/users"><Button variant="ghost" size="icon" className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700"><ArrowLeft className="h-4 w-4" /></Button></Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Add New Hotspot User</h1>
                        <p className="text-sm text-zinc-400">Create a new recurring hotspot user.</p>
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
                                                        <div className="space-y-1"><Label className="text-xs">Official Name</Label><Input value={officialName} onChange={e => setOfficialName(e.target.value)} required className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
                                                        <div className="space-y-1"><Label className="text-xs">Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
                                                        <div className="space-y-1"><Label className="text-xs">Location</Label><Input value={location} onChange={e => setLocation(e.target.value)} className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
                                                        <div className="space-y-1"><Label className="text-xs">Hotspot Username</Label><Input value={hotspotName} onChange={e => setHotspotName(e.target.value)} required className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
                                                        <div className="space-y-1"><Label className="text-xs">Hotspot Password</Label><Input value={hotspotPassword} onChange={e => setHotspotPassword(e.target.value)} required className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
                                                        <div className="space-y-1"><Label className="text-xs">Phone Number</Label><Input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} required className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
                                                        <div className="space-y-1"><Label className="text-xs">Reference Number</Label><Input value={referenceNumber} onChange={e => setReferenceNumber(e.target.value)} required className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
                                                        <div className="space-y-1"><Label className="text-xs">Bill Amount</Label><Input type="number" value={billAmount} onChange={e => setBillAmount(e.target.value)} required className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
                                                        <div className="space-y-1"><Label className="text-xs">Installation Fee</Label><Input type="number" value={installationFee} onChange={e => setInstallationFee(e.target.value)} className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
                                                        <div className="space-y-1"><Label className="text-xs">Billing Cycle</Label><div className="flex gap-2"><Input type="number" value={billingCycleValue} onChange={e => setBillingCycleValue(e.target.value)} required className="h-9 bg-zinc-800 border-zinc-700 text-sm" /><Select onValueChange={setBillingCycleUnit} value={billingCycleUnit}><SelectTrigger className="bg-zinc-800 border-zinc-700 h-9 text-sm w-[120px]"><SelectValue /></SelectTrigger><SelectContent className="bg-zinc-800 text-white border-zinc-700"><SelectItem value="days">Days</SelectItem><SelectItem value="weeks">Weeks</SelectItem><SelectItem value="months">Months</SelectItem><SelectItem value="year">Year</SelectItem></SelectContent></Select></div></div>
                                                        <div className="space-y-1"><Label className="text-xs">Expiry Date</Label><Input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} required className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
                                                        <div className="space-y-1"><Label className="text-xs">Expiry Time</Label><Input type="time" value={expiryTime} onChange={e => setExpiryTime(e.target.value)} required className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
                                                        <div className="space-y-1"><Label className="text-xs">Profile</Label><Select onValueChange={setProfile} value={profile} disabled={profilesLoading}><SelectTrigger className="bg-zinc-800 border-zinc-700 h-9 text-sm"><SelectValue placeholder="Select a profile" /></SelectTrigger><SelectContent className="bg-zinc-800 text-white border-zinc-700">{hotspotProfiles.map(p => <SelectItem key={p} value={p} className="text-sm">{p}</SelectItem>)}</SelectContent></Select></div>
                                                        <div className="space-y-1"><Label className="text-xs">Server</Label><Select onValueChange={setServer} value={server} disabled={serversLoading}><SelectTrigger className="bg-zinc-800 border-zinc-700 h-9 text-sm"><SelectValue placeholder="Select a server" /></SelectTrigger><SelectContent className="bg-zinc-800 text-white border-zinc-700">{hotspotServers.map(s => <SelectItem key={s} value={s} className="text-sm">{s}</SelectItem>)}</SelectContent></Select></div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </CardContent>
                                    <CardFooter className="p-4 flex items-center justify-between border-t border-zinc-800">
                                        <div>{step > 1 && <Button type="button" variant="outline" size="sm" onClick={handleBack}><ChevronLeft className="mr-1 h-4 w-4" />Back</Button>}</div>
                                        <div>
                                            {step === 1 && <Button type="button" size="sm" onClick={handleNext}>Next<ChevronRight className="ml-1 h-4 w-4" /></Button>}
                                            {step === 2 && <Button type="submit" size="sm" disabled={loading} className="bg-gradient-to-r from-blue-600 to-cyan-500">{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}{loading ? "Saving..." : "Save User"}</Button>}
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
