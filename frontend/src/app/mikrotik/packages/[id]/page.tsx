"use client"

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Topbar } from "@/components/topbar";
import { MikrotikPackageForm, MikrotikPackageFormData } from "@/components/mikrotik/MikrotikPackageForm";

interface MikrotikRouter { _id: string; name: string; }
interface PackageResponse {
    _id: string;
    mikrotikRouter: { _id: string; name: string; };
    serviceType: 'pppoe' | 'static';
    name: string;
    price: number;
    durationInDays: number;
    profile?: string;
    rateLimit?: string;
    status: 'active' | 'disabled';
}

export default function EditPackagePage() {
    const params = useParams();
    const { id } = params;
    const router = useRouter();
    const { toast } = useToast();

    const [initialData, setInitialData] = useState<MikrotikPackageFormData | null>(null);
    const [routers, setRouters] = useState<MikrotikRouter[]>([]);
    const [pppProfiles, setPppProfiles] = useState<string[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPppProfilesLoading, setIsPppProfilesLoading] = useState(false);

    useEffect(() => {
        if (!id) return;

        const fetchPackageData = async () => {
            try {
                const [packageRes, routersRes] = await Promise.all([
                    fetch(`/api/mikrotik/packages/${id}`),
                    fetch("/api/mikrotik/routers")
                ]);

                if (!packageRes.ok) throw new Error("Failed to fetch package data");
                
                const packageData: PackageResponse = await packageRes.json();
                const routersData = await routersRes.json();

                const normalizedData: MikrotikPackageFormData = {
                    ...packageData,
                    mikrotikRouter: packageData.mikrotikRouter._id,
                };

                setInitialData(normalizedData);
                setRouters(routersData || []);

                if (normalizedData.serviceType === 'pppoe') {
                    setIsPppProfilesLoading(true);
                    try {
                        const pppProfilesRes = await fetch(`/api/mikrotik/routers/${normalizedData.mikrotikRouter}/ppp-profiles`);
                        if (pppProfilesRes.ok) {
                            setPppProfiles(await pppProfilesRes.json());
                        }
                    } catch (e) {
                        toast({ title: "Error", description: "Failed to load PPP profiles.", variant: "destructive" });
                    } finally {
                        setIsPppProfilesLoading(false);
                    }
                }
            } catch (err) {
                toast({ title: "Error", description: "Failed to load initial data.", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };

        fetchPackageData();
    }, [id, toast]);

    const handleSubmit = async (packageData: MikrotikPackageFormData) => {
        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/mikrotik/packages/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(packageData),
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
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-zinc-900 text-white">
            <Topbar />
            <div className="flex-1 p-6 space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/mikrotik/packages"><Button variant="ghost" size="icon" className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700"><ArrowLeft className="h-4 w-4" /></Button></Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Edit Package</h1>
                        <p className="text-sm text-zinc-400">Update details for {loading ? '...' : initialData?.name}</p>
                    </div>
                </div>

                <div className="flex justify-center">
                    <div className="w-full max-w-2xl">
                        {loading || !initialData ? (
                            <div className="flex justify-center items-center h-64">
                                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                            </div>
                        ) : (
                            <MikrotikPackageForm
                                isEditMode={true}
                                initialData={initialData}
                                onSubmit={handleSubmit}
                                isSubmitting={isSubmitting}
                                routers={routers}
                                pppProfiles={pppProfiles}
                                isPppProfilesLoading={isPppProfilesLoading}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}