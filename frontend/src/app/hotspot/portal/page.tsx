"use client"

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardFooter, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Wifi, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- Interface Definitions ---
interface HotspotPlan {
  _id: string;
  name: string;
  price: number;
  timeLimitValue: number;
  timeLimitUnit: string;
  dataLimitValue: number;
  dataLimitUnit: string;
}

export default function CaptivePortalPage() {
  const [plans, setPlans] = useState<HotspotPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<HotspotPlan | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const routerIp = searchParams.get("router_ip");
  const macAddress = searchParams.get("mac_address");

  useEffect(() => {
    const fetchPlans = async () => {
      if (!routerIp) return;
      try {
        const response = await fetch(`/api/hotspot/public/plans?router_ip=${routerIp}`);
        if (!response.ok) throw new Error("Failed to fetch plans");
        setPlans(await response.json());
      } catch (err) {
        toast({ title: "Error", description: "Failed to load plans.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, [routerIp, toast]);

  const handlePlanSelection = (plan: HotspotPlan) => {
    setSelectedPlan(plan);
  };

  const handlePayment = async () => {
    if (!selectedPlan || !phoneNumber || !macAddress) {
      toast({ title: "Missing Information", description: "Please select a plan and enter your phone number.", variant: "destructive" });
      return;
    }

    setIsPaying(true);
    try {
      const response = await fetch("/api/hotspot/stk-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: selectedPlan._id, phoneNumber, macAddress }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to initiate payment");
      }

      toast({ title: "Payment Initiated", description: "Please check your phone to complete the payment." });

      // Poll for session status
      const pollInterval = setInterval(async () => {
        try {
          const sessionResponse = await fetch(`/api/hotspot/session/${macAddress}`);
          if (sessionResponse.ok) {
            setPaymentSuccess(true);
            clearInterval(pollInterval);
            setTimeout(() => window.location.reload(), 3000); // Reload to get internet access
          }
        } catch (error) {
          // Continue polling
        }
      }, 3000);

    } catch (error: unknown) {
      toast({ title: "Error", description: (error instanceof Error) ? error.message : "Failed to initiate payment.", variant: "destructive" });
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-900 text-white p-4">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
        <div className="inline-block bg-gradient-to-r from-cyan-400 to-blue-500 p-3 rounded-full mb-4">
          <Wifi className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Welcome to Our Hotspot</h1>
        <p className="text-lg text-zinc-400 mt-2">Please select a plan to get connected.</p>
      </motion.div>

      {loading ? (
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
      ) : (
        <AnimatePresence>
          {!selectedPlan ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl">
              {plans.map((plan) => (
                <motion.div key={plan._id} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Card onClick={() => handlePlanSelection(plan)} className="bg-zinc-800/50 border-zinc-700 hover:border-blue-500 cursor-pointer transition-all duration-300 shadow-lg hover:shadow-blue-500/20">
                    <CardHeader className="text-center">
                      <CardTitle className="text-2xl font-bold text-cyan-400">{plan.name}</CardTitle>
                      <CardDescription className="text-zinc-400">KES {plan.price}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center text-sm text-zinc-300">
                      <p>{plan.timeLimitValue} {plan.timeLimitUnit}</p>
                      {plan.dataLimitValue > 0 && <p>{plan.dataLimitValue} {plan.dataLimitUnit} Data Limit</p>}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
              <Card className="bg-zinc-800/50 border-zinc-700 shadow-2xl shadow-blue-500/10">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl font-bold text-cyan-400">{selectedPlan.name}</CardTitle>
                  <CardDescription className="text-zinc-400">Price: KES {selectedPlan.price}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {paymentSuccess ? (
                    <div className="text-center text-green-400 space-y-2">
                      <Zap className="h-12 w-12 mx-auto" />
                      <p className="text-xl font-semibold">Payment Successful!</p>
                      <p>You are now connected to the internet.</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-1">
                        <Label htmlFor="phoneNumber" className="text-xs text-zinc-400">M-Pesa Phone Number</Label>
                        <Input id="phoneNumber" type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="e.g., 2547..." className="h-10 bg-zinc-900 border-zinc-700 text-sm" />
                      </div>
                      <Button onClick={handlePayment} disabled={isPaying} className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg transition-all duration-300 hover:scale-105">
                        {isPaying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Pay Now"}
                      </Button>
                    </>
                  )}
                </CardContent>
                <CardFooter className="text-center text-xs text-zinc-500">
                  <p>You will receive an STK push on your phone to complete the payment.</p>
                </CardFooter>
              </Card>
              <Button variant="link" onClick={() => setSelectedPlan(null)} className="mt-4 text-zinc-400">Back to plans</Button>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
