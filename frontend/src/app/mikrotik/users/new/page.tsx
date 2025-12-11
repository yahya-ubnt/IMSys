"use client"

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save, Wifi, Lock, User, ChevronRight, ChevronLeft, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Topbar } from "@/components/topbar";
import { motion, AnimatePresence } from "framer-motion";

// --- Interface Definitions ---
interface MikrotikRouter { _id: string; name: string; ipAddress: string; }
interface Package { _id: string; mikrotikRouter: { _id: string; name: string }; serviceType: 'pppoe' | 'static'; name: string; price: number; profile?: string; rateLimit?: string; status?: 'active' | 'inactive'; }
interface Device { _id: string; deviceName: string; ipAddress: string; }
interface NewMikrotikUserData { mikrotikRouter: string; serviceType?: 'pppoe' | 'static'; package: string; username: string; officialName: string; emailAddress?: string; mPesaRefNo: string; installationFee?: number; billingCycle: string; mobileNumber: string; expiryDate?: Date; pppoePassword?: string; remoteAddress?: string; ipAddress?: string; station?: string; apartment_house_number?: string; door_number_unit_label?: string; sendWelcomeSms?: boolean; }

// --- Step Indicator ---
const StepIndicator = ({ currentStep }: { currentStep: number }) => (
    <div className="flex items-center justify-center gap-3">
        <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all duration-300 ${currentStep === 1 ? 'bg-blue-600 text-white' : 'bg-zinc-700 text-zinc-400'}`}>1</div>
            <span className={`text-sm transition-colors ${currentStep === 1 ? 'text-blue-400' : 'text-zinc-500'}`}>Service Setup</span>
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
export default function NewMikrotikUserPage() {
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const router = useRouter();

    // --- State Management ---
    const [step, setStep] = useState(1);
    const [direction, setDirection] = useState(1);

    // Form Fields State
    const [mikrotikRouterId, setMikrotikRouterId] = useState("");
    const [serviceType, setServiceType] = useState<"pppoe" | "static" | '' >('');
    const [packageId, setPackageId] = useState("");
    const [stationId, setStationId] = useState<string | undefined>(undefined);
    const [username, setUsername] = useState("");
    const [pppoePassword, setPppoePassword] = useState("");
    const [ipAddress, setIpAddress] = useState("");
    const [remoteAddress, setRemoteAddress] = useState("");
    const [officialName, setOfficialName] = useState("");
    const [emailAddress, setEmailAddress] = useState("");
    const [apartmentHouseNumber, setApartmentHouseNumber] = useState("");
    const [doorNumberUnitLabel, setDoorNumberUnitLabel] = useState("");
    const [mPesaRefNo, setMPesaRefNo] = useState("");
    const [billingCycle, setBillingCycle] = useState("monthly");
    const [mobileNumber, setMobileNumber] = useState("");
    const [installationFee, setInstallationFee] = useState("");
    const [expiryDate, setExpiryDate] = useState<Date | undefined>(new Date());
    const [sendWelcomeSms, setSendWelcomeSms] = useState(true);

    // Data & UI State
    const [routers, setRouters] = useState<MikrotikRouter[]>([]);
    const [packages, setPackages] = useState<Package[]>([]);
    const [filteredPackages, setFilteredPackages] = useState<Package[]>([]);
    const [stations, setStations] = useState<Device[]>([]);
    const [loading, setLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState({ routers: true, packages: true, stations: true });

    // --- Data Fetching Hooks ---
    useEffect(() => {
        const fetchData = async (url: string, key: keyof typeof dataLoading) => {
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`Failed to fetch ${key}`);
                return await response.json();
            } catch (err) {
                toast({ title: "Error", description: `Failed to load ${key}.`, variant: "destructive" });
                return [];
            } finally {
                setDataLoading(prev => ({ ...prev, [key]: false }));
            }
        };
        fetchData("/api/mikrotik/routers", "routers").then(setRouters);
        fetchData("/api/mikrotik/packages", "packages").then(setPackages);
        fetchData("/api/devices?deviceType=Station", "stations").then(setStations);
    }, [toast]);

    // --- Form Logic & Prefill ---
    useEffect(() => {
        if (mikrotikRouterId && serviceType) {
            const filtered = packages.filter(p => p.mikrotikRouter?._id === mikrotikRouterId && p.serviceType === serviceType && p.status === 'active');
            setFilteredPackages(filtered);
            setPackageId("");
        } else {
            setFilteredPackages([]);
        }
    }, [mikrotikRouterId, serviceType, packages]);

    useEffect(() => {
        const prefill = (setter: (val: string) => void, key: string) => {
            const value = searchParams.get(key);
            if (value) setter(value);
        };
        prefill(setOfficialName, 'clientName');
        prefill(setMobileNumber, 'clientPhone');
        prefill(setUsername, 'mikrotikUsername');
        prefill(setPppoePassword, 'mikrotikPassword');
        prefill(setMikrotikRouterId, 'mikrotikRouter');
        prefill(setStationId, 'newStationId');
        const service = searchParams.get('mikrotikService');
        if (service === 'pppoe' || service === 'static') setServiceType(service);
    }, [searchParams]);

    const generateValue = (setter: (val: string) => void, type: 'number' | 'letter') => {
        let result = '';
        if (type === 'number') {
            result = Math.floor(100000 + Math.random() * 900000).toString();
        } else {
            const chars = 'abcdefghijklmnopqrstuvwxyz';
            for (let i = 0; i < 6; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setter(result);
    };

    // --- Step Navigation ---
    const handleNext = () => {
        if (mikrotikRouterId && serviceType && packageId) {
            setDirection(1);
            setStep(2);
        } else {
            toast({ title: "Missing Information", description: "Please complete all service setup fields to continue.", variant: "destructive" });
        }
    };

    const handleBack = () => {
        setDirection(-1);
        setStep(1);
    };

    // --- Form Submission ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const userData: Partial<NewMikrotikUserData> = {
            mikrotikRouter: mikrotikRouterId,
            serviceType: serviceType === "" ? undefined : serviceType,
            package: packageId,
            username,
            officialName,
            emailAddress,
            apartment_house_number: apartmentHouseNumber,
            door_number_unit_label: doorNumberUnitLabel,
            mPesaRefNo,
            installationFee: installationFee ? parseFloat(installationFee) : 0,
            billingCycle,
            mobileNumber,
            expiryDate,
            station: stationId,
            sendWelcomeSms,
        };

        if (serviceType === 'pppoe') {
            userData.pppoePassword = pppoePassword;
            userData.remoteAddress = remoteAddress;
        } else if (serviceType === 'static') {
            userData.ipAddress = ipAddress;
        }

        try {
            const response = await fetch("/api/mikrotik/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(userData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to add Mikrotik user");
            }

            toast({ title: "Mikrotik User Added", description: "Mikrotik user added successfully." });
            router.push("/mikrotik/users");
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
                    <Link href="/mikrotik/users"><Button variant="ghost" size="icon" className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700"><ArrowLeft className="h-4 w-4" /></Button></Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Add New Mikrotik User</h1>
                        <p className="text-sm text-zinc-400">Follow the steps to create a new user record.</p>
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
                                                <motion.div key={1} custom={direction} variants={formVariants} initial="hidden" animate="visible" exit="exit" className="space-y-4">
                                                    <CardTitle className="text-base text-cyan-400 border-b border-zinc-800 pb-2 mb-4 flex items-center gap-2"><Wifi size={18} /> Service Setup</CardTitle>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <div className="space-y-1"><Label className="text-xs">Mikrotik Router</Label><Select onValueChange={setMikrotikRouterId} value={mikrotikRouterId} disabled={dataLoading.routers}><SelectTrigger className="bg-zinc-800 border-zinc-700 h-9 text-sm"><SelectValue placeholder="Select a router" /></SelectTrigger><SelectContent className="bg-zinc-800 text-white border-zinc-700">{routers.map(r => <SelectItem key={r._id} value={r._id} className="text-sm">{r.name}</SelectItem>)}</SelectContent></Select></div>
                                                        <div className="space-y-1"><Label className="text-xs">Service Type</Label><Select onValueChange={(v: "pppoe" | "static") => setServiceType(v)} value={serviceType}><SelectTrigger className="bg-zinc-800 border-zinc-700 h-9 text-sm"><SelectValue placeholder="Select service type" /></SelectTrigger><SelectContent className="bg-zinc-800 text-white border-zinc-700"><SelectItem value="pppoe" className="text-sm">PPPoE</SelectItem><SelectItem value="static" className="text-sm">Static IP</SelectItem></SelectContent></Select></div>
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <div className="space-y-1"><Label className="text-xs">Package</Label><Select onValueChange={setPackageId} value={packageId} disabled={!mikrotikRouterId || !serviceType || filteredPackages.length === 0}><SelectTrigger className="bg-zinc-800 border-zinc-700 h-9 text-sm"><SelectValue placeholder="Select a package" /></SelectTrigger><SelectContent className="bg-zinc-800 text-white border-zinc-700">{filteredPackages.map(p => <SelectItem key={p._id} value={p._id} className="text-sm">{p.name} (KES {p.price})</SelectItem>)}</SelectContent></Select></div>
                                                        <div className="space-y-1"><Label className="text-xs">Station</Label><Select onValueChange={setStationId} value={stationId} disabled={dataLoading.stations}><SelectTrigger className="bg-zinc-800 border-zinc-700 h-9 text-sm"><SelectValue placeholder="Select a station" /></SelectTrigger><SelectContent className="bg-zinc-800 text-white border-zinc-700">{stations.map(s => <SelectItem key={s._id} value={s._id} className="text-sm">{s.deviceName}</SelectItem>)}</SelectContent></Select></div>
                                                    </div>
                                                </motion.div>
                                            ) : (
                                                <motion.div key={2} custom={direction} variants={formVariants} initial="hidden" animate="visible" exit="exit" className="space-y-5">
                                                    <div className="space-y-3">
                                                        <CardTitle className="text-base text-cyan-400 border-b border-zinc-800 pb-2 flex items-center gap-2"><Lock size={18} /> Connection Details</CardTitle>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            <div className="space-y-1"><Label className="text-xs">Username</Label><Input value={username} onChange={e => setUsername(e.target.value)} required className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
                                                            {serviceType === 'pppoe' && <div className="space-y-1"><Label className="text-xs">PPPoE Password</Label><div className="flex gap-2"><Input type="text" value={pppoePassword} onChange={e => setPppoePassword(e.target.value)} required className="h-9 bg-zinc-800 border-zinc-700 text-sm" /><Button type="button" size="sm" variant="outline" className="h-9 text-xs" onClick={() => generateValue(setPppoePassword, 'number')}>123</Button><Button type="button" size="sm" variant="outline" className="h-9 text-xs" onClick={() => generateValue(setPppoePassword, 'letter')}>ABC</Button></div></div>}
                                                            {serviceType === 'pppoe' && <div className="space-y-1"><Label className="text-xs">Remote Address</Label><Input value={remoteAddress} onChange={e => setRemoteAddress(e.target.value)} className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>}
                                                            {serviceType === 'static' && <div className="space-y-1"><Label className="text-xs">Static IP Address</Label><Input value={ipAddress} onChange={e => setIpAddress(e.target.value)} required className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <CardTitle className="text-base text-cyan-400 border-b border-zinc-800 pb-2 flex items-center gap-2"><User size={18} /> Personal & Billing</CardTitle>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            <div className="space-y-1"><Label className="text-xs">Official Name</Label><Input value={officialName} onChange={e => setOfficialName(e.target.value)} required className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
                                                            <div className="space-y-1"><Label className="text-xs">Email Address</Label><Input value={emailAddress} onChange={e => setEmailAddress(e.target.value)} className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
															<div className="space-y-1"><Label className="text-xs">Apartment/House Number</Label><Input value={apartmentHouseNumber} onChange={e => setApartmentHouseNumber(e.target.value)} className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
															<div className="space-y-1"><Label className="text-xs">Door Number/Unit Label</Label><Input value={doorNumberUnitLabel} onChange={e => setDoorNumberUnitLabel(e.target.value)} className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
                                                            <div className="space-y-1"><Label className="text-xs">Mobile Number</Label><Input value={mobileNumber} onChange={e => setMobileNumber(e.target.value)} required className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
                                                            <div className="space-y-1"><Label className="text-xs">M-Pesa Ref No</Label><div className="flex gap-2"><Input value={mPesaRefNo} onChange={e => setMPesaRefNo(e.target.value)} required className="h-9 bg-zinc-800 border-zinc-700 text-sm" /><Button type="button" size="sm" variant="outline" className="h-9 text-xs" onClick={() => generateValue(setMPesaRefNo, 'number')}>123</Button><Button type="button" size="sm" variant="outline" className="h-9 text-xs" onClick={() => generateValue(setMPesaRefNo, 'letter')}>ABC</Button></div></div>
                                                            <div className="space-y-1"><Label className="text-xs">Installation Fee</Label><Input value={installationFee} onChange={e => setInstallationFee(e.target.value)} className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
                                                            <div className="space-y-1"><Label className="text-xs">Billing Cycle</Label><Select onValueChange={setBillingCycle} value={billingCycle} required><SelectTrigger className="bg-zinc-800 border-zinc-700 h-9 text-sm"><SelectValue placeholder="Select cycle" /></SelectTrigger><SelectContent className="bg-zinc-800 text-white border-zinc-700"><SelectItem value="monthly" className="text-sm">Monthly</SelectItem><SelectItem value="quarterly" className="text-sm">Quarterly</SelectItem><SelectItem value="annually" className="text-sm">Annually</SelectItem></SelectContent></Select></div>
                                                            <div className="space-y-1 sm:col-span-2"><Label className="text-xs">Expiry Date</Label><Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal h-9 bg-zinc-800 border-zinc-700 text-sm hover:bg-zinc-700">{expiryDate ? format(expiryDate, "PPP") : "Pick a date"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0 bg-zinc-800 text-white border-zinc-700"><Calendar mode="single" selected={expiryDate} onSelect={setExpiryDate} initialFocus /></PopoverContent></Popover></div>
                                                        </div>
                                                        <div className="items-center flex space-x-2 pt-2">
                                                            <Checkbox id="sendWelcomeSms" checked={sendWelcomeSms} onCheckedChange={(checked: boolean) => setSendWelcomeSms(checked)} />
                                                            <label htmlFor="sendWelcomeSms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Send Welcome SMS to User</label>
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
                                            {step === 2 && <Button type="submit" size="sm" disabled={loading} className="bg-gradient-to-r from-blue-600 to-cyan-500">{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}{loading ? "Saving..." : "Save User"}</Button>}
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
