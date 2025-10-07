"use client"

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardFooter, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeft, Wifi, Lock, User, Save, ChevronRight, ChevronLeft, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Topbar } from "@/components/topbar";
import { motion, AnimatePresence } from "framer-motion";

// --- Interface Definitions ---
interface MikrotikRouter { _id: string; name: string; ipAddress: string; }
interface Device { _id: string; deviceName: string; ipAddress: string; }
import { Package } from "@/types/mikrotik-package";
interface MikrotikUser { _id: string; mikrotikRouter: string | { _id: string; name: string }; serviceType: 'pppoe' | 'static'; package: string | { _id: string; name: string; price: number }; username: string; pppoePassword?: string; remoteAddress?: string; ipAddress?: string; officialName: string; emailAddress?: string; apartment_house_number?: string; door_number_unit_label?: string; mPesaRefNo: string; installationFee?: number; billingCycle: string; mobileNumber: string; expiryDate: string; station?: string | { _id: string; deviceName: string; ipAddress: string }; }

// --- Step Indicator ---
const StepIndicator = ({ currentStep }: { currentStep: number }) => (
    <div className="flex items-center justify-center gap-3">
        <div className="flex items-center gap-2"><div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all duration-300 ${currentStep === 1 ? 'bg-blue-600 text-white' : 'bg-zinc-700 text-zinc-400'}`}>1</div><span className={`text-sm transition-colors ${currentStep === 1 ? 'text-blue-400' : 'text-zinc-500'}`}>Service Setup</span></div>
        <div className={`w-12 h-px transition-colors ${currentStep === 2 ? 'bg-blue-500' : 'bg-zinc-700'}`}></div>
        <div className="flex items-center gap-2"><div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all duration-300 ${currentStep === 2 ? 'bg-blue-600 text-white' : 'bg-zinc-700 text-zinc-400'}`}>2</div><span className={`text-sm transition-colors ${currentStep === 2 ? 'text-blue-400' : 'text-zinc-500'}`}>User Details</span></div>
    </div>
);

// --- Framer Motion Variants ---
const formVariants = {
    hidden: (direction: number) => ({ opacity: 0, x: direction > 0 ? 50 : -50 }),
    visible: { opacity: 1, x: 0, transition: { duration: 0.2, ease: "easeInOut" } },
    exit: (direction: number) => ({ opacity: 0, x: direction < 0 ? 50 : -50, transition: { duration: 0.2, ease: "easeInOut" } }),
};

// --- Main Component ---
export default function EditMikrotikUserPage() {
    const params = useParams();
    const router = useRouter();
    const { id } = params;
    const [step, setStep] = useState(1);
    const [direction, setDirection] = useState(1);
    
    // Form State
    const [mikrotikRouterId, setMikrotikRouterId] = useState("");
    const [serviceType, setServiceType] = useState<"pppoe" | "static" | null>(null);
    const [packageId, setPackageId] = useState("");
    const [username, setUsername] = useState("");
    const [pppoePassword, setPppoePassword] = useState("");
    const [remoteAddress, setRemoteAddress] = useState("");
    const [ipAddress, setIpAddress] = useState("");
    const [officialName, setOfficialName] = useState("");
    const [emailAddress, setEmailAddress] = useState("");
    const [mPesaRefNo, setMPesaRefNo] = useState("");
    const [installationFee, setInstallationFee] = useState("");
    const [billingCycle, setBillingCycle] = useState("");
    const [mobileNumber, setMobileNumber] = useState("");
    const [expiryDate, setExpiryDate] = useState<Date | undefined>(undefined);
    const [stationId, setStationId] = useState("");
    const [apartmentHouseNumber, setApartmentHouseNumber] = useState("");
    const [doorNumberUnitLabel, setDoorNumberUnitLabel] = useState("");

    // Data & UI State
    const [routers, setRouters] = useState<MikrotikRouter[]>([]);
    const [packages, setPackages] = useState<Package[]>([]);
    const [filteredPackages, setFilteredPackages] = useState<Package[]>([]);
    const [stations, setStations] = useState<Device[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const { token } = useAuth();
    const { toast } = useToast();

    // --- Data Fetching & Population ---
    useEffect(() => {
        if (!id || !token) return;

        const fetchInitialData = async () => {
            try {
                // Fetch user, routers, packages, stations in parallel
                const [userRes, routerRes, packageRes, stationRes] = await Promise.all([
                    fetch(`/api/mikrotik/users/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
                    fetch("/api/mikrotik/routers", { headers: { Authorization: `Bearer ${token}` } }),
                    fetch("/api/mikrotik/packages", { headers: { Authorization: `Bearer ${token}` } }),
                    fetch("/api/devices?deviceType=Station", { headers: { Authorization: `Bearer ${token}` } })
                ]);

                if (!userRes.ok) throw new Error("Failed to fetch user");
                const userData: MikrotikUser = await userRes.json();
                const routerData = await routerRes.json();
                const packageData = await packageRes.json();
                const stationData = await stationRes.json();

                setRouters(routerData);
                setPackages(packageData);
                setStations(stationData);

                // Populate form state
                setMikrotikRouterId(typeof userData.mikrotikRouter === 'string' ? userData.mikrotikRouter : userData.mikrotikRouter._id);
                setServiceType(userData.serviceType);
                setPackageId(typeof userData.package === 'string' ? userData.package : userData.package._id);
                setUsername(userData.username);
                setPppoePassword(userData.pppoePassword || "");
                setRemoteAddress(userData.remoteAddress || "");
                setIpAddress(userData.ipAddress || "");
                setOfficialName(userData.officialName);
                setEmailAddress(userData.emailAddress || "");
                setApartmentHouseNumber(userData.apartment_house_number || "");
                setDoorNumberUnitLabel(userData.door_number_unit_label || "");
                setMPesaRefNo(userData.mPesaRefNo);
                setInstallationFee(userData.installationFee?.toString() || "");
                setBillingCycle(userData.billingCycle);
                setMobileNumber(userData.mobileNumber);
                setExpiryDate(userData.expiryDate ? new Date(userData.expiryDate) : undefined);
                if (userData.station && typeof userData.station !== 'string') {
                    setStationId(userData.station._id);
                }
            } catch (err) {
                toast({ title: "Error", description: "Failed to load initial data.", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, [id, token, toast]);

    // --- Dependent Data Filtering ---
    useEffect(() => {
        if (mikrotikRouterId && serviceType) {
            const filtered = packages.filter(pkg => (typeof pkg.mikrotikRouter === 'string' ? pkg.mikrotikRouter : pkg.mikrotikRouter?._id) === mikrotikRouterId && pkg.serviceType === serviceType);
            setFilteredPackages(filtered);
        } else {
            setFilteredPackages([]);
        }
    }, [mikrotikRouterId, serviceType, packages]);

    // --- Event Handlers ---
    const handleNext = () => {
        if (mikrotikRouterId && serviceType && packageId) {
            setDirection(1);
            setStep(2);
        } else {
            toast({ title: "Missing Information", description: "Please complete all service setup fields.", variant: "destructive" });
        }
    };
    const handleBack = () => { setDirection(-1); setStep(1); };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        if (!token) {
            toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
            setSubmitting(false);
            return;
        }

        const userData = {
            mikrotikRouter: mikrotikRouterId,
            serviceType,
            package: packageId,
            username,
            officialName,
            emailAddress,
            apartment_house_number: apartmentHouseNumber,
            door_number_unit_label: doorNumberUnitLabel,
            mPesaRefNo,
            installationFee: installationFee ? parseFloat(installationFee) : undefined,
            billingCycle,
            mobileNumber,
            expiryDate,
            station: stationId,
            ...(serviceType === 'pppoe' && { pppoePassword, remoteAddress }),
            ...(serviceType === 'static' && { ipAddress }),
        };

        try {
            const response = await fetch(`/api/mikrotik/users/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(userData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to update Mikrotik user");
            }

            toast({ title: "Success", description: "Mikrotik user updated successfully." });
            router.push(`/mikrotik/users/${id}/details`);
        } catch (error: unknown) {
            toast({
                title: "Error",
                description: (error instanceof Error) ? error.message : "An unexpected error occurred.",
                variant: "destructive"
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center bg-zinc-900 text-white">Loading...</div>;

    return (
        <div className="flex flex-col min-h-screen bg-zinc-900 text-white">
            <Topbar />
            <div className="flex-1 p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={`/mikrotik/users/${id}/details`}><Button variant="ghost" size="icon" className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700"><ArrowLeft className="h-4 w-4" /></Button></Link>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Edit: {officialName}</h1>
                            <p className="text-sm text-zinc-400">Update the details for @{username}</p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-center">
                    <div className="w-full max-w-3xl">
                        <motion.div layout className="bg-zinc-900/50 backdrop-blur-lg border-zinc-700 shadow-2xl shadow-blue-500/10 rounded-xl overflow-hidden">
                            <Card className="bg-transparent border-none">
                                <CardHeader className="p-4 border-b border-zinc-800"><StepIndicator currentStep={step} /></CardHeader>
                                <form onSubmit={handleSubmit}>
                                    <CardContent className="p-5">
                                        <AnimatePresence mode="wait" custom={direction}>
                                            {step === 1 ? (
                                                <motion.div key={1} custom={direction} variants={formVariants} initial="hidden" animate="visible" exit="exit" className="space-y-3">
                                                    <CardTitle className="text-base text-cyan-400 border-b border-zinc-800 pb-2 mb-3 flex items-center gap-2"><Wifi size={18} /> Service Setup</CardTitle>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        <div className="space-y-1"><Label className="text-xs">Mikrotik Router</Label><Select onValueChange={setMikrotikRouterId} value={mikrotikRouterId}><SelectTrigger className="bg-zinc-800 border-zinc-700 h-9 text-sm"><SelectValue /></SelectTrigger><SelectContent className="bg-zinc-800 text-white border-zinc-700">{routers.map(r => <SelectItem key={r._id} value={r._id} className="text-sm">{r.name}</SelectItem>)}</SelectContent></Select></div>
                                                        <div className="space-y-1"><Label className="text-xs">Service Type</Label><Select onValueChange={(v: "pppoe" | "static") => setServiceType(v)} value={serviceType || undefined}><SelectTrigger className="bg-zinc-800 border-zinc-700 h-9 text-sm"><SelectValue /></SelectTrigger><SelectContent className="bg-zinc-800 text-white border-zinc-700"><SelectItem value="pppoe" className="text-sm">PPPoE</SelectItem><SelectItem value="static" className="text-sm">Static IP</SelectItem></SelectContent></Select></div>
                                                    </div>
                                                    <div className="space-y-1"><Label className="text-xs">Package</Label><Select onValueChange={setPackageId} value={packageId} disabled={filteredPackages.length === 0}><SelectTrigger className="bg-zinc-800 border-zinc-700 h-9 text-sm"><SelectValue /></SelectTrigger><SelectContent className="bg-zinc-800 text-white border-zinc-700">{filteredPackages.map(p => <SelectItem key={p._id} value={p._id} className="text-sm">{p.name} (KES {p.price})</SelectItem>)}</SelectContent></Select></div>
                                                    <div className="space-y-1"><Label className="text-xs">Station</Label><Select onValueChange={setStationId} value={stationId}><SelectTrigger className="bg-zinc-800 border-zinc-700 h-9 text-sm"><SelectValue /></SelectTrigger><SelectContent className="bg-zinc-800 text-white border-zinc-700">{stations.map(s => <SelectItem key={s._id} value={s._id} className="text-sm">{s.deviceName}</SelectItem>)}</SelectContent></Select></div>
                                                </motion.div>
                                            ) : (
                                                <motion.div key={2} custom={direction} variants={formVariants} initial="hidden" animate="visible" exit="exit" className="space-y-5">
                                                    <div className="space-y-3">
                                                        <CardTitle className="text-base text-cyan-400 border-b border-zinc-800 pb-2 flex items-center gap-2"><Lock size={18} /> Connection Details</CardTitle>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            <div className="space-y-1"><Label className="text-xs">Username</Label><Input value={username} disabled className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
                                                            {serviceType === 'pppoe' && <div className="space-y-1"><Label className="text-xs">PPPoE Password</Label><Input type="text" value={pppoePassword} onChange={e => setPppoePassword(e.target.value)} className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>}
                                                            {serviceType === 'static' && <div className="space-y-1"><Label className="text-xs">Static IP Address</Label><Input value={ipAddress} onChange={e => setIpAddress(e.target.value)} className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <CardTitle className="text-base text-cyan-400 border-b border-zinc-800 pb-2 flex items-center gap-2"><User size={18} /> Personal & Billing</CardTitle>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            <div className="space-y-1"><Label className="text-xs">Official Name</Label><Input value={officialName} onChange={e => setOfficialName(e.target.value)} required className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
                                                            <div className="space-y-1"><Label className="text-xs">Apartment/House Number</Label><Input value={apartmentHouseNumber} onChange={e => setApartmentHouseNumber(e.target.value)} className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
                                                            <div className="space-y-1"><Label className="text-xs">Door Number/Unit Label</Label><Input value={doorNumberUnitLabel} onChange={e => setDoorNumberUnitLabel(e.target.value)} className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
                                                            <div className="space-y-1"><Label className="text-xs">Mobile Number</Label><Input value={mobileNumber} onChange={e => setMobileNumber(e.target.value)} required className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
                                                            <div className="space-y-1"><Label className="text-xs">M-Pesa Ref No</Label><Input value={mPesaRefNo} disabled className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
                                                            <div className="space-y-1"><Label className="text-xs">Billing Cycle</Label><Select onValueChange={setBillingCycle} value={billingCycle} required><SelectTrigger className="bg-zinc-800 border-zinc-700 h-9 text-sm"><SelectValue /></SelectTrigger><SelectContent className="bg-zinc-800 text-white border-zinc-700"><SelectItem value="monthly" className="text-sm">Monthly</SelectItem><SelectItem value="quarterly" className="text-sm">Quarterly</SelectItem><SelectItem value="annually" className="text-sm">Annually</SelectItem></SelectContent></Select></div>
                                                            <div className="space-y-1 sm:col-span-2"><Label className="text-xs">Expiry Date</Label><Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal h-9 bg-zinc-800 border-zinc-700 text-sm hover:bg-zinc-700">{expiryDate ? format(expiryDate, "PPP") : "Pick a date"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0 bg-zinc-800 text-white border-zinc-700"><Calendar mode="single" selected={expiryDate} onSelect={setExpiryDate} initialFocus /></PopoverContent></Popover></div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </CardContent>
                                    <CardFooter className="p-4 flex items-center justify-between border-t border-zinc-800">
                                        <div>{step > 1 && <Button type="button" variant="outline" size="sm" onClick={handleBack}><ChevronLeft className="mr-1 h-4 w-4" />Back</Button>}</div>
                                        <div>
                                            {step === 1 && <Button type="button" size="sm" onClick={handleNext}>Next<ChevronRight className="ml-1 h-4 w-4" /></Button>}
                                            {step === 2 && <Button type="submit" size="sm" disabled={submitting} className="bg-gradient-to-r from-blue-600 to-cyan-500">{submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}{submitting ? "Saving..." : "Save Changes"}</Button>}
                                        </div>
                                    </CardFooter>
                                </form>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}