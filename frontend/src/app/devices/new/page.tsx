'use client'

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Topbar } from "@/components/topbar";
import { DeviceForm } from "@/components/devices/DeviceForm";
import { createDevice, enableMonitoring, Device } from "@/lib/deviceService";

export default function NewDevicePage() {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleSubmit = async (deviceData: Partial<Device>) => {
        setLoading(true);
        try {
            const newDevice = await createDevice(deviceData);
            toast({ title: "Device Created Successfully" });
            
            if (newDevice.monitoringMode === 'SNITCH') {
                await enableMonitoring(newDevice._id);
            }

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
                    <Link href="/devices">
                        <Button variant="ghost" size="icon" className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Add New Device</h1>
                        <p className="text-sm text-zinc-400">Register a new CPE or Access Point for monitoring.</p>
                    </div>
                </div>

                <div className="flex justify-center">
                    <div className="w-full max-w-3xl">
                        <DeviceForm
                            isEditMode={false}
                            onSubmit={handleSubmit}
                            loading={loading}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
