"use client"

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save, Router as RouterIcon, Server, User, KeyRound, Terminal, ChevronRight, ChevronLeft, Loader2, Wifi } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- Interface Definitions ---
export interface MikrotikRouterFormData {
  name: string;
  ipAddress: string;
  apiUsername: string;
  apiPassword?: string;
  apiPort: number;
  location?: string;
}

interface MikrotikRouterFormProps {
  isEditMode: boolean;
  initialData?: Partial<MikrotikRouterFormData>;
  onSubmit: (data: MikrotikRouterFormData) => Promise<void>;
  isSubmitting: boolean;
  onTestConnection?: (data: Partial<MikrotikRouterFormData>) => void;
  isTestingConnection?: boolean;
}

// --- Sub-components ---
const StepIndicator = ({ currentStep }: { currentStep: number }) => (
  <div className="flex items-center justify-center gap-3">
    <div className="flex items-center gap-2"><div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all duration-300 ${currentStep === 1 ? 'bg-blue-600 text-white' : 'bg-zinc-700 text-zinc-400'}`}>1</div><span className={`text-sm transition-colors ${currentStep === 1 ? 'text-blue-400' : 'text-zinc-500'}`}>Identity</span></div>
    <div className={`w-12 h-px transition-colors ${currentStep === 2 ? 'bg-blue-500' : 'bg-zinc-700'}`}></div>
    <div className="flex items-center gap-2"><div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all duration-300 ${currentStep === 2 ? 'bg-blue-600 text-white' : 'bg-zinc-700 text-zinc-400'}`}>2</div><span className={`text-sm transition-colors ${currentStep === 2 ? 'text-blue-400' : 'text-zinc-500'}`}>Credentials</span></div>
  </div>
);

const formVariants = {
  hidden: (direction: number) => ({ opacity: 0, x: direction > 0 ? 50 : -50 }),
  visible: { opacity: 1, x: 0, transition: { duration: 0.2, ease: "easeInOut" } },
  exit: (direction: number) => ({ opacity: 0, x: direction < 0 ? 50 : -50, transition: { duration: 0.2, ease: "easeInOut" } }),
};

// --- Main Form Component ---
export function MikrotikRouterForm({ isEditMode, initialData, onSubmit, isSubmitting, onTestConnection, isTestingConnection }: MikrotikRouterFormProps) {
  const { toast } = useToast();
  
  // --- State Management ---
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);

  const [name, setName] = useState(initialData?.name || "");
  const [ipAddress, setIpAddress] = useState(initialData?.ipAddress || "");
  const [location, setLocation] = useState(initialData?.location || "");
  const [apiUsername, setApiUsername] = useState(initialData?.apiUsername || "");
  const [apiPassword, setApiPassword] = useState(""); // Always starts blank for security
  const [apiPort, setApiPort] = useState(initialData?.apiPort?.toString() || "8728");

  // --- Event Handlers ---
  const handleNext = () => {
    if (step === 1 && name && ipAddress) {
      setDirection(1);
      setStep(2);
    } else {
      toast({ title: "Missing Information", description: "Please fill in the router name and IP address.", variant: "destructive" });
    }
  };

  const handleBack = () => {
    setDirection(-1);
    setStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const routerData: MikrotikRouterFormData = {
      name,
      ipAddress,
      location,
      apiUsername,
      apiPassword: apiPassword || undefined, // Send undefined if blank to not change it
      apiPort: parseInt(apiPort, 10),
    };
    await onSubmit(routerData);
  };

  const handleTestConnectionClick = () => {
    if (onTestConnection) {
      onTestConnection({ ipAddress, apiUsername, apiPassword, apiPort: parseInt(apiPort) });
    }
  };

  return (
    <motion.div layout className="bg-zinc-900/50 backdrop-blur-lg border-zinc-700 shadow-2xl shadow-blue-500/10 rounded-xl overflow-hidden">
      <Card className="bg-transparent border-none">
        <CardHeader className="p-4 border-b border-zinc-800"><StepIndicator currentStep={step} /></CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="p-5">
            <AnimatePresence mode="wait" custom={direction}>
              {step === 1 && (
                <motion.div key={1} custom={direction} variants={formVariants} initial="hidden" animate="visible" exit="exit">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1"><Label className="text-xs">Router Name</Label><div className="relative"><RouterIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" /><Input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="h-9 pl-9 text-sm bg-zinc-800 border-zinc-700" placeholder="e.g., Main-Office-Router" /></div></div>
                    <div className="space-y-1"><Label className="text-xs">IP Address</Label><div className="relative"><Server className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" /><Input type="text" value={ipAddress} onChange={(e) => setIpAddress(e.target.value)} required className="h-9 pl-9 text-sm bg-zinc-800 border-zinc-700" placeholder="e.g., 192.168.88.1" /></div></div>
                    <div className="space-y-1 sm:col-span-2"><Label className="text-xs">Location</Label><div className="relative"><Server className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" /><Input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="h-9 pl-9 text-sm bg-zinc-800 border-zinc-700" placeholder="e.g., Nairobi" /></div></div>
                  </div>
                </motion.div>
              )}
              {step === 2 && (
                <motion.div key={2} custom={direction} variants={formVariants} initial="hidden" animate="visible" exit="exit">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1"><Label className="text-xs">API Username</Label><div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" /><Input type="text" value={apiUsername} onChange={(e) => setApiUsername(e.target.value)} required className="h-9 pl-9 text-sm bg-zinc-800 border-zinc-700" placeholder="e.g., admin" /></div></div>
                    <div className="space-y-1"><Label className="text-xs">API Password</Label><div className="relative"><KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" /><Input type="password" value={apiPassword} onChange={(e) => setApiPassword(e.target.value)} required={!isEditMode} className="h-9 pl-9 text-sm bg-zinc-800 border-zinc-700" placeholder={isEditMode ? "Leave blank to keep current" : "••••••••"} /></div></div>
                    <div className="space-y-1 sm:col-span-2"><Label className="text-xs">API Port</Label><div className="relative"><Terminal className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" /><Input type="number" value={apiPort} onChange={(e) => setApiPort(e.target.value)} required className="h-9 pl-9 text-sm bg-zinc-800 border-zinc-700" /></div></div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
          <CardFooter className="p-4 flex items-center justify-between border-t border-zinc-800">
            <div>
              {step === 2 && <Button type="button" variant="outline" size="sm" onClick={handleBack}><ChevronLeft className="mr-1 h-4 w-4" />Back</Button>}
            </div>
            <div className="flex items-center gap-2">
              {isEditMode && onTestConnection && <Button type="button" variant="outline" size="sm" onClick={handleTestConnectionClick} disabled={isTestingConnection}>{isTestingConnection ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wifi className="mr-2 h-4 w-4" />}Test</Button>}
              {step === 1 && <Button type="button" size="sm" onClick={handleNext}>Next<ChevronRight className="ml-1 h-4 w-4" /></Button>}
              {step === 2 && 
                <Button type="submit" size="sm" disabled={isSubmitting} className="bg-gradient-to-r from-blue-600 to-cyan-500">
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {isSubmitting ? "Saving..." : (isEditMode ? "Save Changes" : "Add Router")}
                </Button>
              }
            </div>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  );
}
