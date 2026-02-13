'use client'

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Save, HardDrive, ChevronRight, ChevronLeft, Loader2, Plus } from "lucide-react";
import { Topbar } from "@/components/topbar";
import { createDevice, getMikrotikRouters, getDevices, getBuildings, createBuilding, type MikrotikRouter, type Device, type Building } from "@/lib/deviceService";
import { motion, AnimatePresence } from "framer-motion";

// --- Step Indicator ---
const StepIndicator = ({ currentStep }: { currentStep: number }) => (
    <div className="flex items-center justify-center gap-3">
        <div className="flex items-center gap-2"><div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all duration-300 ${currentStep === 1 ? 'bg-blue-600 text-white' : 'bg-zinc-700 text-zinc-400'}`}>1</div><span className={`text-sm transition-colors ${currentStep === 1 ? 'text-blue-400' : 'text-zinc-500'}`}>Initial Setup</span></div>
        <div className={`w-12 h-px transition-colors ${currentStep === 2 ? 'bg-blue-500' : 'bg-zinc-700'}`}></div>
        <div className="flex items-center gap-2"><div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all duration-300 ${currentStep === 2 ? 'bg-blue-600 text-white' : 'bg-zinc-700 text-zinc-400'}`}>2</div><span className={`text-sm transition-colors ${currentStep === 2 ? 'text-blue-400' : 'text-zinc-500'}`}>Device Details</span></div>
    </div>
);

// --- Framer Motion Variants ---
const formVariants = {
    hidden: (direction: number) => ({ opacity: 0, x: direction > 0 ? 50 : -50 }),
    visible: { opacity: 1, x: 0, transition: { duration: 0.2, ease: "easeInOut" } },
    exit: (direction: number) => ({ opacity: 0, x: direction < 0 ? 50 : -50, transition: { duration: 0.2, ease: "easeInOut" } }),
};

export default function NewDevicePage() {
    const [step, setStep] = useState(1);
    const [direction, setDirection] = useState(1);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();

    // Form State
    const [routerId, setRouterId] = useState("");
    const [deviceType, setDeviceType] = useState<"Access" | "Station" | '' >('');
    const [deviceName, setDeviceName] = useState("");
    const [deviceModel, setDeviceModel] = useState("");
    const [physicalBuildingId, setPhysicalBuildingId] = useState("");
    const [serviceArea, setServiceArea] = useState<string[]>([]);
    const [ipAddress, setIpAddress] = useState("");
    const [macAddress, setMacAddress] = useState("");
    const [loginUsername, setLoginUsername] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [ssid, setSsid] = useState("");
    const [wirelessPassword, setWirelessPassword] = useState("");

    // Dialog State
    const [isBuildingDialogOpen, setIsBuildingDialogOpen] = useState(false);
    const [newBuildingName, setNewBuildingName] = useState("");
    const [isSavingBuilding, setIsSavingBuilding] = useState(false);

    // Data & UI State
    const [routers, setRouters] = useState<MikrotikRouter[]>([]);
    const [routersLoading, setRoutersLoading] = useState(true);
    const [buildings, setBuildings] = useState<Building[]>([]);
    const [buildingsLoading, setBuildingsLoading] = useState(true);
    const [accessPoints, setAccessPoints] = useState<Device[]>([]);
    const [accessPointsLoading, setAccessPointsLoading] = useState(true);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const routersPromise = getMikrotikRouters();
                const accessPointsPromise = getDevices("Access");
                const buildingsPromise = getBuildings();

                const [routersData, accessPointsData, buildingsData] = await Promise.all([routersPromise, accessPointsPromise, buildingsPromise]);
                
                setRouters(routersData || []);
                setAccessPoints(accessPointsData || []);
                setBuildings(buildingsData || []);

            } catch (error) {
                toast({ title: "Error fetching initial data", description: (error instanceof Error) ? error.message : "Unknown error", variant: "destructive" });
            } finally {
                setRoutersLoading(false);
                setAccessPointsLoading(false);
                setBuildingsLoading(false);
            }
        };
        fetchInitialData();
    }, [toast]);

    const handleNext = () => {
        if (routerId && deviceType) {
            setDirection(1);
            setStep(2);
        } else {
            toast({ title: "Missing Information", description: "Please select a router and device type.", variant: "destructive" });
        }
    };

    const handleBack = () => {
        setDirection(-1);
        setStep(1);
    };

    const handleCreateBuilding = async () => {
        if (!newBuildingName.trim()) {
            toast({ title: "Building name cannot be empty", variant: "destructive" });
            return;
        }
        setIsSavingBuilding(true);
        try {
            const newBuilding = await createBuilding({ name: newBuildingName });
            toast({ title: "Building Created", description: `Successfully created ${newBuilding.name}.` });
            
            // Refetch buildings and select the new one
            const updatedBuildings = await getBuildings();
            setBuildings(updatedBuildings);
            setPhysicalBuildingId(newBuilding._id);

            setIsBuildingDialogOpen(false);
            setNewBuildingName("");
        } catch (error) {
            toast({ title: "Error Creating Building", description: (error instanceof Error) ? error.message : "Unknown error", variant: "destructive" });
        } finally {
            setIsSavingBuilding(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!deviceType) { toast({ title: "Device Type is required", variant: "destructive" }); return; }
        if (!physicalBuildingId) { toast({ title: "Physical Location is required", variant: "destructive" }); return; }
        setLoading(true);

        const finalServiceArea = [...new Set([physicalBuildingId, ...serviceArea])];

        const deviceData = {
            router: routerId, deviceType, deviceName, deviceModel, ipAddress,
            macAddress, loginUsername, ssid, physicalBuilding: physicalBuildingId, serviceArea: finalServiceArea
        };

        // Conditionally add passwords
        const finalDeviceData: any = { ...deviceData };
        if (loginPassword) finalDeviceData.loginPassword = loginPassword;
        if (wirelessPassword) finalDeviceData.wirelessPassword = wirelessPassword;

        try {
            const newDevice = await createDevice(finalDeviceData);
            toast({ title: "Device Created Successfully" });
            
            const redirectBack = searchParams.get('redirectBackToUserCreation');
            if (redirectBack === 'true' && newDevice.deviceType === 'Station') {
                router.push(`/mikrotik/users/new?newStationId=${newDevice._id}`);
            } else {
                router.push("/devices");
            }
        } catch (error) {
            toast({ title: "Error Creating Device", description: (error instanceof Error) ? error.message : "Unknown error", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-zinc-900 text-white">
      <Topbar />
      <div className="flex-1 p-6 space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/devices"><Button variant="ghost" size="icon" className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700"><ArrowLeft className="h-4 w-4" /></Button></Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Add New Device</h1>
                        <p className="text-sm text-zinc-400">Register a new CPE or Access Point for monitoring.</p>
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
                                                    <CardTitle className="text-base text-cyan-400 border-b border-zinc-800 pb-2 mb-3 flex items-center gap-2"><HardDrive size={18} /> Initial Setup</CardTitle>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        <div className="space-y-1"><Label className="text-xs">MikroTik Router</Label><Select onValueChange={setRouterId} value={routerId} disabled={routersLoading}><SelectTrigger className="bg-zinc-800 border-zinc-700 h-9 text-sm"><SelectValue placeholder="Select a router" /></SelectTrigger><SelectContent className="bg-zinc-800 text-white border-zinc-700">{routers.map(r => <SelectItem key={r._id} value={r._id} className="text-sm">{r.name}</SelectItem>)}</SelectContent></Select></div>
                                                        <div className="space-y-1"><Label className="text-xs">Device Type</Label><Select onValueChange={(v: "Access" | "Station") => setDeviceType(v)} value={deviceType}><SelectTrigger className="bg-zinc-800 border-zinc-700 h-9 text-sm"><SelectValue placeholder="Select device type" /></SelectTrigger><SelectContent className="bg-zinc-800 text-white border-zinc-700"><SelectItem value="Access" className="text-sm">Access Point</SelectItem><SelectItem value="Station" className="text-sm">Station (CPE)</SelectItem></SelectContent></Select></div>
                                                    </div>
                                                </motion.div>
                                            ) : (
                                                <motion.div key={2} custom={direction} variants={formVariants} initial="hidden" animate="visible" exit="exit" className="space-y-3">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        <div className="space-y-1"><Label className="text-xs">Device Name</Label><Input value={deviceName} onChange={e => setDeviceName(e.target.value)} required className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
                                                        <div className="space-y-1"><Label className="text-xs">Device Model</Label><Input value={deviceModel} onChange={e => setDeviceModel(e.target.value)} placeholder="e.g., NanoStation M5" className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
                                                        <div className="space-y-1 sm:col-span-2 border-t border-zinc-800 pt-3">
                                                            <Label className="text-xs">Physical Location</Label>
                                                            <div className="flex items-center gap-2">
                                                                <Select onValueChange={setPhysicalBuildingId} value={physicalBuildingId} disabled={buildingsLoading}>
                                                                    <SelectTrigger className="bg-zinc-800 border-zinc-700 h-9 text-sm w-full"><SelectValue placeholder="Select primary building" /></SelectTrigger>
                                                                    <SelectContent className="bg-zinc-800 text-white border-zinc-700">
                                                                        {buildings.map(b => <SelectItem key={b._id} value={b._id} className="text-sm">{b.name}</SelectItem>)}
                                                                    </SelectContent>
                                                                </Select>
                                                                <Dialog open={isBuildingDialogOpen} onOpenChange={setIsBuildingDialogOpen}>
                                                                    <DialogTrigger asChild>
                                                                        <Button type="button" variant="outline" size="icon" className="h-9 w-9 flex-shrink-0">
                                                                            <Plus className="h-4 w-4" />
                                                                        </Button>
                                                                    </DialogTrigger>
                                                                    <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-zinc-700">
                                                                        <DialogHeader>
                                                                            <DialogTitle className="text-white">Create New Building</DialogTitle>
                                                                        </DialogHeader>
                                                                        <div className="grid gap-4 py-4">
                                                                            <div className="grid grid-cols-4 items-center gap-4">
                                                                                <Label htmlFor="building-name" className="text-right text-zinc-400">Name</Label>
                                                                                <Input id="building-name" value={newBuildingName} onChange={(e) => setNewBuildingName(e.target.value)} className="col-span-3 bg-zinc-800 border-zinc-600" />
                                                                            </div>
                                                                        </div>
                                                                        <DialogFooter>
                                                                            <Button type="button" onClick={handleCreateBuilding} disabled={isSavingBuilding}>
                                                                                {isSavingBuilding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                                                                Save Building
                                                                            </Button>
                                                                        </DialogFooter>
                                                                    </DialogContent>
                                                                </Dialog>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-1 sm:col-span-2">
                                                            <Label className="text-xs">Additionally Serves (Wired Neighbors)</Label>
                                                            <div className="grid grid-cols-2 gap-2 p-2 rounded-md border border-zinc-700 bg-zinc-800/50 max-h-32 overflow-y-auto">
                                                                {buildings.map(b => (
                                                                    <div key={b._id} className="flex items-center gap-2">
                                                                        <input 
                                                                            type="checkbox" 
                                                                            id={`service-area-${b._id}`}
                                                                            value={b._id}
                                                                            checked={serviceArea.includes(b._id)}
                                                                            onChange={(e) => {
                                                                                if (e.target.checked) {
                                                                                    setServiceArea([...serviceArea, b._id]);
                                                                                } else {
                                                                                    setServiceArea(serviceArea.filter(id => id !== b._id));
                                                                                }
                                                                            }}
                                                                            disabled={b._id === physicalBuildingId}
                                                                            className="form-checkbox h-4 w-4 text-blue-600 bg-zinc-700 border-zinc-600 rounded focus:ring-blue-500"
                                                                        />
                                                                        <Label htmlFor={`service-area-${b._id}`} className="text-sm font-normal">{b.name}</Label>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div className="space-y-1"><Label className="text-xs">IP Address</Label><Input value={ipAddress} onChange={e => setIpAddress(e.target.value)} required className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
                                                        <div className="space-y-1"><Label className="text-xs">MAC Address</Label><Input value={macAddress} onChange={e => setMacAddress(e.target.value)} required className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
                                                        <div className="space-y-1"><Label className="text-xs">Login Username</Label><Input value={loginUsername} onChange={e => setLoginUsername(e.target.value)} className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
                                                        <div className="space-y-1"><Label className="text-xs">Login Password</Label><Input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
                                                        <div className="space-y-1"><Label className="text-xs">{deviceType === 'Access' ? "Broadcasted SSID" : "AP to Connect To"}</Label>
                                                            {deviceType === 'Access' ? <Input value={ssid} onChange={e => setSsid(e.target.value)} className="h-9 bg-zinc-800 border-zinc-700 text-sm" />
                                                                : <Select onValueChange={setSsid} value={ssid} disabled={accessPointsLoading}><SelectTrigger className="bg-zinc-800 border-zinc-700 h-9 text-sm"><SelectValue placeholder="Select an Access Point" /></SelectTrigger><SelectContent className="bg-zinc-800 text-white border-zinc-700">{accessPoints.map(ap => <SelectItem key={ap._id} value={ap.ssid || ap.deviceName || ''} className="text-sm">{ap.deviceName}</SelectItem>)}</SelectContent></Select>}
                                                        </div>
                                                        <div className="space-y-1"><Label className="text-xs">{deviceType === 'Access' ? "WPA2 Key" : "Pre-shared Key"}</Label><Input type="password" value={wirelessPassword} onChange={e => setWirelessPassword(e.target.value)} className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </CardContent>
                                    <CardFooter className="p-4 flex items-center justify-between border-t border-zinc-800">
                                        <div>{step > 1 && <Button type="button" variant="outline" size="sm" onClick={handleBack}><ChevronLeft className="mr-1 h-4 w-4" />Back</Button>}</div>
                                        <div>
                                            {step === 1 && <Button type="button" size="sm" onClick={handleNext}>Next<ChevronRight className="mr-1 h-4 w-4" /></Button>}
                                            {step === 2 && <Button type="submit" size="sm" disabled={loading} className="bg-gradient-to-r from-blue-600 to-cyan-500">{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}{loading ? "Saving..." : "Save Device"}</Button>}
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