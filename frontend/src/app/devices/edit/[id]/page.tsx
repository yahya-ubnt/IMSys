'use client'

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Topbar } from "@/components/topbar";
import { DeviceForm } from "@/components/devices/DeviceForm";
import { getDeviceById, updateDevice, Device } from "@/lib/deviceService";

export default function EditDevicePage() {
  const [initialData, setInitialData] = useState<Device | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { token } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  useEffect(() => {
    if (!token || !id) return;

    const fetchDeviceData = async () => {
      try {
        const deviceData = await getDeviceById(id, token);
        setInitialData(deviceData);
      } catch {
        setError("Failed to load device data. It may have been deleted.");
        toast({ title: "Error fetching data", variant: "destructive" });
      } finally {
        setPageLoading(false);
      }
    };

    fetchDeviceData();
  }, [id, token, toast]);

  const handleSubmit = async (data: Partial<Device>) => {
    if (!token) {
      toast({ title: "Authentication Error", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await updateDevice(id, data, token);
      toast({ title: "Device Updated Successfully" });
      router.push("/devices");
    } catch (error) {
      toast({
        title: "Error Updating Device",
        description: (error instanceof Error) ? error.message : "Unknown error",
        variant: "destructive",
      });
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
            <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Edit Device</h1>
            <p className="text-sm text-zinc-400">Update the details for this device.</p>
          </div>
        </div>

        <div className="flex justify-center">
            <div className="w-full max-w-3xl">
              {pageLoading ? (
                <p>Loading device data...</p>
              ) : error ? (
                <p className="text-red-400">{error}</p>
              ) : initialData ? (
                <DeviceForm
                  initialData={initialData}
                  onSubmit={handleSubmit}
                  isEditMode={true}
                  loading={loading}
                />
              ) : null}
            </div>
        </div>
      </div>
    </div>
  );
}
