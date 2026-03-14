"use client"

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
interface MikrotikUser { _id: string; mikrotikRouter: string | { _id: string; name: string }; serviceType: 'pppoe' | 'static'; package: string | { _id: string; name: string; price: number }; username: string; pppoePassword?: string; ipAddress?: string; macAddress?: string; officialName: string; emailAddress?: string; door_number_unit_label?: string; mPesaRefNo: string; installationFee?: number; billingCycle: string; mobileNumber: string; expiryDate: string; station?: string | { _id: string; deviceName: string; ipAddress: string }; building?: string | { _id: string; name: string }; }

// --- Main Page Component ---
export default function EditMikrotikUserPage() {
    const params = useParams();
    const router = useRouter();
    const { id } = params;
    const { toast } = useToast();

    // Data State
    const [initialData, setInitialData] = useState<Partial<MikrotikUserFormData> | null>(null);
    const [routers, setRouters] = useState<MikrotikRouter[]>([]);
    const [packages, setPackages] = useState<Package[]>([]);
    const [buildings, setBuildings] = useState<Building[]>([]);
    const [stations, setStations] = useState<Device[]>([]);

    // UI State
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- Data Fetching ---
    useEffect(() => {
        if (!id) return;

        const fetchAllData = async () => {
            try {
                const [userRes, routerRes, packageRes, stationRes, buildingsRes] = await Promise.all([
                    fetch(`/api/mikrotik/users/${id}`),
                    fetch("/api/mikrotik/routers"),
                    fetch("/api/mikrotik/packages"),
                    getDevices("Station"),
                    getBuildings()
                ]);

                if (!userRes.ok) throw new Error("Failed to fetch user data");

                const userData: MikrotikUser = await userRes.json();
                
                const normalizedData: Partial<MikrotikUserFormData> = {
                    mikrotikRouter: typeof userData.mikrotikRouter === 'object' ? userData.mikrotikRouter._id : userData.mikrotikRouter,
                    serviceType: userData.serviceType,
                    package: typeof userData.package === 'object' ? userData.package._id : userData.package,
                    username: userData.username,
                    pppoePassword: userData.pppoePassword,
                    ipAddress: userData.ipAddress,
                    macAddress: userData.macAddress,
                    officialName: userData.officialName,
                    emailAddress: userData.emailAddress,
                    door_number_unit_label: userData.door_number_unit_label,
                    mPesaRefNo: userData.mPesaRefNo,
                    installationFee: userData.installationFee,
                    billingCycle: userData.billingCycle,
                    mobileNumber: userData.mobileNumber,
                    expiryDate: userData.expiryDate ? new Date(userData.expiryDate) : undefined,
                    station: userData.station && typeof userData.station === 'object' ? userData.station._id : userData.station,
                    building: userData.building && typeof userData.building === 'object' ? userData.building._id : userData.building,
                };
                
                setInitialData(normalizedData);
                setRouters(await routerRes.json() || []);
                setPackages(await packageRes.json() || []);
                setStations(stationRes || []);
                setBuildings(buildingsRes || []);

            } catch (error) {
                toast({ title: "Error", description: "Failed to load initial data.", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, [id, toast]);

    // --- Form Submission ---
    const handleSubmit = async (userData: Partial<MikrotikUserFormData>) => {
        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/mikrotik/users/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(userData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to update Mikrotik user");
            }

            toast({ title: "Success", description: "Mikrotik user updated successfully." });
            router.push(`/mikrotik/users`);
        } catch (error: unknown) {
            toast({ title: "Error", description: (error instanceof Error) ? error.message : "An unexpected error occurred.", variant: "destructive" });
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
                        <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                            Edit: {loading ? '...' : initialData?.officialName}
                        </h1>
                        <p className="text-sm text-zinc-400">Update the details for @{loading ? '...' : initialData?.username}</p>
                    </div>
                </div>

                <div className="flex justify-center">
                    <div className="w-full max-w-3xl">
                        {loading || !initialData ? (
                            <div className="flex justify-center items-center h-64">
                                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                            </div>
                        ) : (
                            <MikrotikUserForm
                                isEditMode={true}
                                initialData={initialData}
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
