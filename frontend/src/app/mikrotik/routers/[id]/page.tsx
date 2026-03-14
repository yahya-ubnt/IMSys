"use client"

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Topbar } from "@/components/topbar";
import { MikrotikRouterForm, MikrotikRouterFormData } from "@/components/mikrotik/MikrotikRouterForm";

export default function EditMikrotikRouterPage() {
  const params = useParams();
  const { id } = params;
  const router = useRouter();
  const { toast } = useToast();

  const [initialData, setInitialData] = useState<MikrotikRouterFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchRouter = async () => {
      try {
        const response = await fetch(`/api/mikrotik/routers/${id}`);
        if (!response.ok) throw new Error("Failed to fetch router");
        setInitialData(await response.json());
      } catch (err) {
        toast({ title: "Error", description: "Failed to load router data.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchRouter();
  }, [id, toast]);

  const handleSubmit = async (routerData: MikrotikRouterFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/mikrotik/routers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(routerData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update router");
      }
      toast({ title: "Router Updated", description: "Mikrotik router updated successfully." });
      router.push("/mikrotik/routers");
    } catch (error) {
      toast({ title: "Error", description: (error instanceof Error) ? error.message : "Failed to update router.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestConnection = async (data: Partial<MikrotikRouterFormData>) => {
    setIsTesting(true);
    try {
      const response = await fetch("/api/mikrotik/routers/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Connection test failed");
      }
      toast({ title: "Connection Test", description: "Connection test successful!" });
    } catch (error) {
      toast({ title: "Connection Test Failed", description: (error instanceof Error) ? error.message : "Check details.", variant: "destructive" });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-900 text-white">
      <Topbar />
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/mikrotik/routers">
            <Button variant="ghost" size="icon" className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              Edit Mikrotik Router
            </h1>
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
              <MikrotikRouterForm
                isEditMode={true}
                initialData={initialData}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                onTestConnection={handleTestConnection}
                isTestingConnection={isTesting}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}