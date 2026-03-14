"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Topbar } from "@/components/topbar";
import { MikrotikRouterForm, MikrotikRouterFormData } from "@/components/mikrotik/MikrotikRouterForm";

export default function NewRouterPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (routerData: MikrotikRouterFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/mikrotik/routers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(routerData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add router");
      }

      toast({
        title: "Router Provisioned",
        description: "The new Mikrotik router has been successfully added.",
      });
      router.push("/mikrotik/routers");
    } catch (error: unknown) {
      toast({
        title: "Provisioning Failed",
        description: (error instanceof Error) ? error.message : "Failed to add router.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
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
              Provision New Mikrotik Router
            </h1>
            <p className="text-sm text-zinc-400">Add a new router to your network.</p>
          </div>
        </div>

        <div className="flex justify-center">
          <div className="w-full max-w-lg">
            <MikrotikRouterForm
              isEditMode={false}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      </div>
    </div>
  );
}