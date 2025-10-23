"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Router as RouterIcon, Server, User, KeyRound, Terminal, ChevronRight, ChevronLeft, Loader2 } from "lucide-react";
import { Topbar } from "@/components/topbar";
import { motion, AnimatePresence } from "framer-motion";

const StepIndicator = ({ currentStep }: { currentStep: number }) => (
  <div className="flex items-center justify-center gap-3">
    <div className="flex items-center gap-2">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all duration-300 ${currentStep === 1 ? 'bg-blue-600 text-white' : 'bg-zinc-700 text-zinc-400'}`}>
        1
      </div>
      <span className={`text-sm transition-colors ${currentStep === 1 ? 'text-blue-400' : 'text-zinc-500'}`}>Identity</span>
    </div>
    <div className={`w-12 h-px transition-colors ${currentStep === 2 ? 'bg-blue-500' : 'bg-zinc-700'}`}></div>
    <div className="flex items-center gap-2">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all duration-300 ${currentStep === 2 ? 'bg-blue-600 text-white' : 'bg-zinc-700 text-zinc-400'}`}>
        2
      </div>
      <span className={`text-sm transition-colors ${currentStep === 2 ? 'text-blue-400' : 'text-zinc-500'}`}>Credentials</span>
    </div>
  </div>
);

const formVariants = {
  hidden: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? 50 : -50,
  }),
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.2,
      ease: "easeInOut",
    },
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction < 0 ? 50 : -50,
    transition: {
      duration: 0.2,
      ease: "easeInOut",
    },
  }),
};

export default function NewRouterPage() {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);

  const [name, setName] = useState("");
  const [ipAddress, setIpAddress] = useState("");
  const [apiUsername, setApiUsername] = useState("");
  const [apiPassword, setApiPassword] = useState("");
  const [apiPort, setApiPort] = useState("8728");

  const [loading, setLoading] = useState(false);

  const { toast } = useToast();
  const router = useRouter();

  const handleNext = () => {
    if (step === 1 && name && ipAddress) {
      setDirection(1);
      setStep(2);
    } else {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields for the router identity.",
        variant: "destructive",
      });
    }
  };

  const handleBack = () => {
    setDirection(-1);
    setStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const routerData = {
      name,
      ipAddress,
      apiUsername,
      apiPassword,
      apiPort: parseInt(apiPort, 10),
    };

    try {
      const response = await fetch("/api/mikrotik/routers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(routerData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add router");
      }

      toast({
        title: "Router Provisioned",
        description: "The new Mikrotik router has been successfully added and configured.",
      });
      router.push("/mikrotik/routers");
    } catch (error: unknown) {
      toast({
        title: "Provisioning Failed",
        description: (error instanceof Error) ? error.message : "Failed to add router. Please try again.",
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
          <Button variant="ghost" size="icon" onClick={() => router.push("/mikrotik/routers")} className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              Provision New Mikrotik Router
            </h1>
            <p className="text-sm text-zinc-400">Follow the steps to add a new router to your network.</p>
          </div>
        </div>

        <div className="flex justify-center">
          <div className="w-full max-w-lg">
            <motion.div layout className="bg-zinc-900/50 backdrop-blur-lg border-zinc-700 shadow-2xl shadow-blue-500/10 rounded-xl overflow-hidden">
              <Card className="bg-transparent border-none">
                <CardHeader className="p-4 border-b border-zinc-800">
                  <StepIndicator currentStep={step} />
                </CardHeader>
                <form onSubmit={handleSubmit}>
                  <CardContent className="p-5">
                    <AnimatePresence mode="wait" custom={direction}>
                      {step === 1 && (
                        <motion.div key={1} custom={direction} variants={formVariants} initial="hidden" animate="visible" exit="exit">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label htmlFor="name" className="text-xs text-zinc-300">Router Name</Label>
                              <div className="relative">
                                <RouterIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required className="h-9 pl-9 text-sm bg-zinc-800 text-white border-zinc-700 placeholder-zinc-500 focus:ring-blue-500 focus:border-blue-500" placeholder="e.g., Main-Office-Router" />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="ipAddress" className="text-xs text-zinc-300">IP Address</Label>
                              <div className="relative">
                                <Server className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                <Input id="ipAddress" type="text" value={ipAddress} onChange={(e) => setIpAddress(e.target.value)} required className="h-9 pl-9 text-sm bg-zinc-800 text-white border-zinc-700 placeholder-zinc-500 focus:ring-blue-500 focus:border-blue-500" placeholder="e.g., 192.168.88.1" />
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                      {step === 2 && (
                        <motion.div key={2} custom={direction} variants={formVariants} initial="hidden" animate="visible" exit="exit">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label htmlFor="apiUsername" className="text-xs text-zinc-300">API Username</Label>
                              <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                <Input id="apiUsername" type="text" value={apiUsername} onChange={(e) => setApiUsername(e.target.value)} required autoComplete="new-password" className="h-9 pl-9 text-sm bg-zinc-800 text-white border-zinc-700 placeholder-zinc-500 focus:ring-blue-500 focus:border-blue-500" placeholder="e.g., admin" />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="apiPassword" className="text-xs text-zinc-300">API Password</Label>
                              <div className="relative">
                                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                <Input id="apiPassword" type="password" value={apiPassword} onChange={(e) => setApiPassword(e.target.value)} required autoComplete="new-password" className="h-9 pl-9 text-sm bg-zinc-800 text-white border-zinc-700 placeholder-zinc-500 focus:ring-blue-500 focus:border-blue-500" placeholder="••••••••" />
                              </div>
                            </div>
                            <div className="space-y-1 sm:col-span-2">
                              <Label htmlFor="apiPort" className="text-xs text-zinc-300">API Port</Label>
                              <div className="relative">
                                <Terminal className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                <Input id="apiPort" type="number" value={apiPort} onChange={(e) => setApiPort(e.target.value)} required className="h-9 pl-9 text-sm bg-zinc-800 text-white border-zinc-700 placeholder-zinc-500 focus:ring-blue-500 focus:border-blue-500" />
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                  <CardFooter className="p-4 flex items-center justify-between border-t border-zinc-800">
                    <div>
                      {step === 2 && (
                        <Button type="button" variant="outline" size="sm" onClick={handleBack} className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700">
                          <ChevronLeft className="mr-1 h-4 w-4" />
                          Back
                        </Button>
                      )}
                    </div>
                    <div>
                      {step === 1 && (
                        <Button type="button" size="sm" onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 text-white">
                          Next
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      )}
                      {step === 2 && (
                        <Button type="submit" size="sm" disabled={loading} className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-bold shadow-lg">
                          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                          {loading ? "Provisioning..." : "Add Router"}
                        </Button>
                      )}
                    </div>
                  </CardFooter>
                </form>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
