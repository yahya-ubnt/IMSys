"use client"

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardFooter, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Wifi, Zap, Users, Clock, Infinity, Ticket, UserCircle } from "lucide-react";
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
  sharedUsers: number;
}

interface AppSettings {
  appName: string;
}

export default function CaptivePortalPage() {
  const [plans, setPlans] = useState<HotspotPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<HotspotPlan | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [activeTab, setActiveTab] = useState('plans');
  const [voucherCode, setVoucherCode] = useState("");
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const routerIp = searchParams.get("router_ip");
  const macAddress = searchParams.get("mac_address");
  const [initialError, setInitialError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/settings/general");
        if (response.ok) {
          setSettings(await response.json());
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const checkSessionAndFetchPlans = async () => {
      if (!routerIp || !macAddress) {
        setInitialError("Invalid connection. Please reconnect to the Wi-Fi network.");
        setLoading(false);
        return;
      }

      try {
        const sessionResponse = await fetch(`/api/hotspot/session/${macAddress}`);
        if (sessionResponse.ok) {
          const session = await sessionResponse.json();
          if (new Date() > new Date(session.endTime)) {
            // Session expired
          } else {
            setHasActiveSession(true);
          }
        }
      } catch (error) {
        // Ignore session check error and proceed to fetch plans
      }

      try {
        const response = await fetch(`/api/hotspot/plans/public/plans?router_ip=${routerIp}`);
        if (!response.ok) throw new Error("Failed to fetch plans");
        setPlans(await response.json());
      } catch (err) {
        toast({ title: "Error", description: "Failed to load plans.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    checkSessionAndFetchPlans();
  }, [routerIp, macAddress, toast]);

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
      let pollCount = 0;
      const maxPolls = 40; // 2 minutes
      const pollInterval = setInterval(async () => {
        if (pollCount >= maxPolls) {
          clearInterval(pollInterval);
          toast({ title: "Payment Timeout", description: "Payment confirmation timed out. Please try again.", variant: "destructive" });
          setIsPaying(false);
          return;
        }

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
        pollCount++;
      }, 3000);

    } catch (error: unknown) {
      toast({ title: "Error", description: (error instanceof Error) ? error.message : "Failed to initiate payment.", variant: "destructive" });
      setIsPaying(false);
    }
  };

  const handleVoucherLogin = async () => {
    if (!voucherCode || !macAddress) {
      toast({ title: "Missing Information", description: "Please enter a voucher code.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/hotspot/vouchers/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voucherCode, macAddress }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to connect with voucher");
      }

      toast({ title: "Success", description: "Connected with voucher! Enjoy the internet." });
      setTimeout(() => window.location.reload(), 3000); // Reload to get internet access

    } catch (error: unknown) {
      toast({ title: "Error", description: (error instanceof Error) ? error.message : "Failed to connect with voucher.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (loading) return <Loader2 className="h-12 w-12 animate-spin text-blue-500" />;
    if (initialError) return <div className="text-center text-red-500" data-testid="initial-error"><p className="text-lg">{initialError}</p></div>;
    if (hasActiveSession) return <div className="text-center text-green-400"><p className="text-lg">You already have an active session. Enjoy the internet!</p></div>;

    return (
      <div className="w-full max-w-4xl">
        <div className="flex justify-center mb-6 bg-zinc-800/50 p-1 rounded-lg">
          <Button onClick={() => setActiveTab('plans')} variant={activeTab === 'plans' ? 'default' : 'ghost'} className={`flex-1 ${activeTab === 'plans' ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white' : ''}`}>Buy a Plan</Button>
          <Button onClick={() => setActiveTab('voucher')} variant={activeTab === 'voucher' ? 'default' : 'ghost'} className={`flex-1 ${activeTab === 'voucher' ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white' : ''}`}>Use a Voucher</Button>
          <Button onClick={() => setActiveTab('member')} variant={activeTab === 'member' ? 'default' : 'ghost'} className={`flex-1 ${activeTab === 'member' ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white' : ''}`}>Member Login</Button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }} transition={{ duration: 0.2 }}>
            {activeTab === 'plans' && (
              !selectedPlan ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {plans.length > 0 ? (
                    plans.map((plan) => (
                      <motion.div key={plan._id} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Card onClick={() => handlePlanSelection(plan)} className="flex flex-col h-full bg-zinc-800/50 border-zinc-700 hover:border-blue-500 cursor-pointer transition-all duration-300 shadow-lg hover:shadow-blue-500/20">
                          <CardHeader className="text-center">
                            <CardTitle className="text-2xl font-bold text-cyan-400">{plan.name}</CardTitle>
                          </CardHeader>
                          <CardContent className="flex-grow text-center text-sm text-zinc-300 space-y-2">
                            <div className="flex items-center justify-center text-base text-blue-300">
                              <Zap className="h-5 w-5 mr-2" /> KES {plan.price}
                            </div>
                            <div className="flex items-center justify-center">
                              <Clock className="h-4 w-4 mr-1 text-zinc-400" />
                              <span>Validity: {plan.timeLimitValue} {plan.timeLimitUnit}</span>
                            </div>
                            <div className="flex items-center justify-center">
                              {plan.dataLimitValue === 0 ? (
                                <Infinity className="h-4 w-4 mr-1 text-zinc-400" />
                              ) : (
                                <Wifi className="h-4 w-4 mr-1 text-zinc-400" />
                              )}
                              <span>Data: {plan.dataLimitValue === 0 ? 'Unlimited' : `${plan.dataLimitValue} ${plan.dataLimitUnit}`}</span>
                            </div>
                            <div className="flex items-center justify-center">
                              <Users className="h-4 w-4 mr-1 text-zinc-400" />
                              <span>Devices: {plan.sharedUsers}</span>
                            </div>
                          </CardContent>
                          <CardFooter className="pt-4">
                            <Button className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg transition-all duration-300 hover:scale-105">Buy Now</Button>
                          </CardFooter>
                        </Card>
                      </motion.div>
                    ))
                  ) : (
                    <p className="text-zinc-400 col-span-full text-center">No hotspot plans are available for this location at the moment.</p>
                  )}
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md mx-auto">
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
              )
            )}
            {activeTab === 'voucher' && (
              <Card className="w-full max-w-md mx-auto bg-zinc-800/50 border-zinc-700">
                <CardHeader className="text-center">
                  <CardTitle className="2xl font-bold text-cyan-400">Use a Voucher</CardTitle>
                  <CardDescription className="text-zinc-400">Enter your voucher code to connect.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <Label htmlFor="voucherCode" className="text-xs text-zinc-400">Voucher Code</Label>
                    <Input id="voucherCode" placeholder="Enter voucher code" className="h-10 bg-zinc-900 border-zinc-700 text-sm" value={voucherCode} onChange={(e) => setVoucherCode(e.target.value)} />
                  </div>
                  <Button onClick={handleVoucherLogin} className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg transition-all duration-300 hover:scale-105">Connect</Button>
                </CardContent>
              </Card>
            )}
            {activeTab === 'member' && (
              <Card className="w-full max-w-md mx-auto bg-zinc-800/50 border-zinc-700">
                <CardHeader className="text-center">
                  <CardTitle className="2xl font-bold text-cyan-400">Member Login</CardTitle>
                  <CardDescription className="text-zinc-400">Log in with your username and password.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <Label htmlFor="username" className="text-xs text-zinc-400">Username</Label>
                    <Input id="username" placeholder="Enter your username" className="h-10 bg-zinc-900 border-zinc-700 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="password" className="text-xs text-zinc-400">Password</Label>
                    <Input id="password" type="password" placeholder="Enter your password" className="h-10 bg-zinc-900 border-zinc-700 text-sm" />
                  </div>
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg transition-all duration-300 hover:scale-105">Login</Button>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-900 text-white p-4">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
        <div className="inline-block bg-gradient-to-r from-cyan-400 to-blue-500 p-3 rounded-full mb-4">
          <Wifi className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">{settings?.appName || 'Welcome to Our Hotspot'}</h1>
        <p className="text-lg text-zinc-400 mt-2">Please select a plan to get connected.</p>
      </motion.div>
      {renderContent()}
    </div>
  );
}
