"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Topbar } from "@/components/topbar";
import { getBuildings, getDevices, type Building, type Device } from "@/lib/deviceService";
import { MikrotikUserForm, MikrotikUserFormData } from "@/components/mikrotik/MikrotikUserForm";

// --- Interface Definitions ---
interface MikrotikRouter { _id: string; name: string; ipAddress: string; }
interface Package { _id: string; mikrotikRouter: { _id: string; name: string }; serviceType: 'pppoe' | 'static'; name: string; price: number; profile?: string; rateLimit?: string; status?: 'active' | 'inactive'; }

// --- Main Page Component ---
export default function NewMikrotikUserPage() {
    const { toast } = useToast();
    const router = useRouter();

    // Data State
    const [routers, setRouters] = useState<MikrotikRouter[]>([]);
    const [packages, setPackages] = useState<Package[]>([]);
    const [buildings, setBuildings] = useState<Building[]>([]);
    const [stations, setStations] = useState<Device[]>([]);
    
    // UI State
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- Data Fetching ---
    useEffect(() => {
        const fetchAllData = async () => {
            try {
                const [routersData, packagesData, buildingsData, stationsData] = await Promise.all([
                    fetch('/api/mikrotik/routers').then(res => res.json()),
                    fetch('/api/mikrotik/packages').then(res => res.json()),
                    getBuildings(),
                    getDevices("Station")
                ]);

                setRouters(routersData || []);
                setPackages(packagesData || []);
                setBuildings(buildingsData || []);
                setStations(stationsData || []);

            } catch (error) {
                toast({ title: "Error fetching initial data", description: (error instanceof Error) ? error.message : "Unknown error", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, [toast]);

    // --- Form Submission ---
    const handleSubmit = async (userData: Partial<MikrotikUserFormData>) => {
        setIsSubmitting(true);
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
            setIsSubmitting(false);
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
                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                            </div>
                        ) : (
                            <MikrotikUserForm
                                isEditMode={false}
                                onSubmit={handleSubmit}
                                routers={routers}
                                packages={packages}
                                buildings={buildings}
                                stations={stations}
                                onBuildingsUpdate={setBuildings}
                                isSubmitting={isSubmitting}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}