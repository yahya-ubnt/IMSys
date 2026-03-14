"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Topbar } from "@/components/topbar";
import { MikrotikPackageForm, MikrotikPackageFormData } from "@/components/mikrotik/MikrotikPackageForm";

interface MikrotikRouter { _id: string; name: string; }

export default function NewPackagePage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [routers, setRouters] = useState<MikrotikRouter[]>([]);
    const [loading, setLoading] = useState(true);
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
                setLoading(false);
            }
        };
        fetchRouters();
    }, [toast]);

    const handleSubmit = async (packageData: MikrotikPackageFormData) => {
        setIsSubmitting(true);
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
                        <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Add New Package</h1>
                        <p className="text-sm text-zinc-400">Create a new Mikrotik package record.</p>
                    </div>
                </div>

                <div className="flex justify-center">
                    <div className="w-full max-w-2xl">
                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                            </div>
                        ) : (
                            <MikrotikPackageForm
                                isEditMode={false}
                                onSubmit={handleSubmit}
                                isSubmitting={isSubmitting}
                                routers={routers}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
