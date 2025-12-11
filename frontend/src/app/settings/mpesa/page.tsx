"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardFooter, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, Save, Loader2, Settings, CreditCard } from "lucide-react"
import { useAuth } from "@/components/auth-provider";

// --- Zod Schema Definitions ---
const mpesaConfigSchema = z.object({
    environment: z.enum(["sandbox", "production"]),
    consumerKey: z.string(),
    consumerSecret: z.string(),
    passkey: z.string(),
    paybillNumber: z.string().optional(),
    tillStoreNumber: z.string().optional(),
    tillNumber: z.string().optional(),
    callbackURL: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
});

const formSchema = z.object({
  configType: z.enum(["paybill", "till"]),
    paybill: mpesaConfigSchema,
    till: mpesaConfigSchema,
}).superRefine((data, ctx) => {
    const requiredFields = ['consumerKey', 'consumerSecret', 'passkey'];
    if (data.configType === 'paybill') {
        requiredFields.forEach(field => {
            if (!data.paybill[field as keyof typeof data.paybill]) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['paybill', field],
                    message: `${field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} is required.`,
                });
            }
        });
        if (!data.paybill.paybillNumber) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['paybill', 'paybillNumber'],
                message: 'Paybill Number is required.',
            });
        }
    } else if (data.configType === 'till') {
        requiredFields.forEach(field => {
            if (!data.till[field as keyof typeof data.till]) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['till', field],
                    message: `${field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} is required.`,
                });
            }
        });
         if (!data.till.tillStoreNumber) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['till', 'tillStoreNumber'],
                message: 'Store Number is required.',
            });
        }
        if (!data.till.tillNumber) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['till', 'tillNumber'],
                message: 'Till Number is required.',
            });
        }
    }
});

type MpesaSettingsFormValues = z.infer<typeof formSchema>;

// --- Step Indicator ---
const StepIndicator = ({ currentStep }: { currentStep: number }) => (
    <div className="flex items-center justify-center gap-3">
        <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all duration-300 ${currentStep === 1 ? 'bg-blue-600 text-white' : 'bg-zinc-700 text-zinc-400'}`}>1</div>
            <span className={`text-sm transition-colors ${currentStep === 1 ? 'text-blue-400' : 'text-zinc-500'}`}>Configuration Type</span>
        </div>
        <div className={`w-12 h-px transition-colors ${currentStep === 2 ? 'bg-blue-500' : 'bg-zinc-700'}`}></div>
        <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all duration-300 ${currentStep === 2 ? 'bg-blue-600 text-white' : 'bg-zinc-700 text-zinc-400'}`}>2</div>
            <span className={`text-sm transition-colors ${currentStep === 2 ? 'text-blue-400' : 'text-zinc-500'}`}>Credentials</span>
        </div>
    </div>
);

// --- Framer Motion Variants ---
const formVariants = {
    hidden: (direction: number) => ({ opacity: 0, x: direction > 0 ? 50 : -50 }),
    visible: { opacity: 1, x: 0, transition: { duration: 0.2, ease: "easeInOut" } },
    exit: (direction: number) => ({ opacity: 0, x: direction < 0 ? 50 : -50, transition: { duration: 0.2, ease: "easeInOut" } }),
};

// --- Main Component ---
export default function MpesaSettingsPage() {
  const [direction, setDirection] = useState(1);
  const [step, setStep] = useState(1); // Add this line
  const [loading, setLoading] = useState(true);

    const form = useForm<MpesaSettingsFormValues>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        configType: "paybill",
        paybill: { environment: "sandbox", consumerKey: "", consumerSecret: "", passkey: "", paybillNumber: "", callbackURL: "" },
        till: { environment: "sandbox", consumerKey: "", consumerSecret: "", passkey: "", tillStoreNumber: "", tillNumber: "", callbackURL: "" },
      },
  });

  const configType = form.watch("configType");

    useEffect(() => {
      const fetchSettings = async () => {
        try {
          setLoading(true);
          const response = await fetch("/api/settings/mpesa");
          if (!response.ok) throw new Error("Failed to fetch M-Pesa settings.");
          const data = await response.json();

          const paybillData = data.mpesaPaybill || {};
          const tillData = data.mpesaTill || {};

          form.reset({
            configType: data.mpesaPaybill?.consumerKey ? "paybill" : "till",
            paybill: {
              environment: paybillData.environment || "sandbox",
              consumerKey: paybillData.consumerKey || "",
              consumerSecret: paybillData.consumerSecret || "",
              passkey: paybillData.passkey || "",
              paybillNumber: paybillData.paybillNumber || "",
              callbackURL: paybillData.callbackURL || "",
            },
            till: {
              environment: tillData.environment || "sandbox",
              consumerKey: tillData.consumerKey || "",
              consumerSecret: tillData.consumerSecret || "",
              passkey: tillData.passkey || "",
              tillStoreNumber: tillData.tillStoreNumber || "",
              tillNumber: tillData.tillNumber || "",
              callbackURL: tillData.callbackURL || "",
            },
          });
        } catch (error) {
          toast.error((error as Error).message);
        } finally {
          setLoading(false);
        }
      };
      fetchSettings();
    }, [form]);

    const onSubmit = async (data: MpesaSettingsFormValues) => {
      try {
      const settingsType = data.configType;
      const settingsData = data[settingsType];

        const response = await fetch("/api/settings/mpesa", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: settingsType, data: settingsData }),
      });

      if (!response.ok) throw new Error(`Failed to update ${settingsType} settings.`);
      toast.success(`M-Pesa ${settingsType} settings updated successfully!`);
    } catch (error) {
      toast.error((error as Error).message);
      }
  };

  const handleNext = () => { setDirection(1); setStep(2); };
  const handleBack = () => { setDirection(-1); setStep(1); };

  if (loading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-blue-400" /></div>;
    }

    return (
        <motion.div layout className="bg-zinc-900/50 backdrop-blur-lg border-zinc-700 shadow-2xl shadow-blue-500/10 rounded-xl overflow-hidden">
            <Card className="bg-transparent border-none">
                <CardHeader className="p-4 border-b border-zinc-800"><StepIndicator currentStep={step} /></CardHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <CardContent className="p-5 min-h-[350px]">
                            <AnimatePresence mode="wait" custom={direction}>
                                {step === 1 ? (
                                    <motion.div key={1} custom={direction} variants={formVariants} initial="hidden" animate="visible" exit="exit" className="space-y-4">
                                        <CardTitle className="text-base text-cyan-400 border-b border-zinc-800 pb-2 mb-3 flex items-center gap-2"><Settings size={18} /> Configuration Type</CardTitle>
                                        <p className="text-sm text-zinc-400">Select which M-Pesa configuration you want to set up or update.</p>
                                        <FormField
                                            control={form.control}
                                            name="configType"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs">M-Pesa Service</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="bg-zinc-800 border-zinc-700 h-9 text-sm"><SelectValue /></SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent className="bg-zinc-800 text-white border-zinc-700">
                                                            <SelectItem value="paybill" className="text-sm">Paybill</SelectItem>
                                                            <SelectItem value="till" className="text-sm">Buy Goods (Till)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </motion.div>
                                ) : (
                                    <motion.div key={2} custom={direction} variants={formVariants} initial="hidden" animate="visible" exit="exit" className="space-y-4">
                                        <CardTitle className="text-base text-cyan-400 border-b border-zinc-800 pb-2 mb-3 flex items-center gap-2"><CreditCard size={18} /> {configType === 'paybill' ? 'Paybill' : 'Till'} Credentials</CardTitle>
                                        {configType === 'paybill' ? (
                                            <>
                                                <FormField control={form.control} name="paybill.environment" render={({ field }) => (<FormItem><FormLabel className="text-xs">Environment</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="h-9 bg-zinc-800 border-zinc-700 text-sm"><SelectValue /></SelectTrigger></FormControl><SelectContent className="bg-zinc-800 text-white border-zinc-700"><SelectItem value="sandbox">Sandbox (Testing)</SelectItem><SelectItem value="production">Production (Live)</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                                                <FormField control={form.control} name="paybill.paybillNumber" render={({ field }) => (<FormItem><FormLabel className="text-xs">Paybill Number</FormLabel><FormControl><Input placeholder="e.g., 888888" {...field} className="h-9 bg-zinc-800 border-zinc-700 text-sm" autoComplete="new-password" /></FormControl><FormMessage /></FormItem>)} />
                                                <FormField control={form.control} name="paybill.consumerKey" render={({ field }) => (<FormItem><FormLabel className="text-xs">Consumer Key</FormLabel><FormControl><Input placeholder="Your Consumer Key" {...field} className="h-9 bg-zinc-800 border-zinc-700 text-sm" autoComplete="new-password" /></FormControl><FormMessage /></FormItem>)} />
                                                <FormField control={form.control} name="paybill.consumerSecret" render={({ field }) => (<FormItem><FormLabel className="text-xs">Consumer Secret</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} className="h-9 bg-zinc-800 border-zinc-700 text-sm" autoComplete="new-password" /></FormControl><FormMessage /></FormItem>)} />
                                                <FormField control={form.control} name="paybill.passkey" render={({ field }) => (<FormItem><FormLabel className="text-xs">Passkey</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} className="h-9 bg-zinc-800 border-zinc-700 text-sm" autoComplete="new-password" /></FormControl><FormMessage /></FormItem>)} />
                                                <FormField control={form.control} name="paybill.callbackURL" render={({ field }) => (<FormItem><FormLabel className="text-xs">Callback URL</FormLabel><FormControl><Input placeholder="https://your-domain.com/api/callback" {...field} className="h-9 bg-zinc-800 border-zinc-700 text-sm" autoComplete="new-password" /></FormControl><FormMessage /></FormItem>)} />
                                            </>
                                        ) : (
                                            <>
                                                <FormField control={form.control} name="till.environment" render={({ field }) => (<FormItem><FormLabel className="text-xs">Environment</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="h-9 bg-zinc-800 border-zinc-700 text-sm"><SelectValue /></SelectTrigger></FormControl><SelectContent className="bg-zinc-800 text-white border-zinc-700"><SelectItem value="sandbox">Sandbox (Testing)</SelectItem><SelectItem value="production">Production (Live)</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                                                <FormField control={form.control} name="till.tillStoreNumber" render={({ field }) => (<FormItem><FormLabel className="text-xs">Store Number</FormLabel><FormControl><Input placeholder="e.g., 123456" {...field} className="h-9 bg-zinc-800 border-zinc-700 text-sm" autoComplete="new-password" /></FormControl><FormMessage /></FormItem>)} />
                                                <FormField control={form.control} name="till.tillNumber" render={({ field }) => (<FormItem><FormLabel className="text-xs">Till Number</FormLabel><FormControl><Input placeholder="e.g., 654321" {...field} className="h-9 bg-zinc-800 border-zinc-700 text-sm" autoComplete="new-password" /></FormControl><FormMessage /></FormItem>)} />
                                                <FormField control={form.control} name="till.consumerKey" render={({ field }) => (<FormItem><FormLabel className="text-xs">Consumer Key</FormLabel><FormControl><Input placeholder="Your Consumer Key" {...field} className="h-9 bg-zinc-800 border-zinc-700 text-sm" autoComplete="new-password" /></FormControl><FormMessage /></FormItem>)} />
                                                <FormField control={form.control} name="till.consumerSecret" render={({ field }) => (<FormItem><FormLabel className="text-xs">Consumer Secret</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} className="h-9 bg-zinc-800 border-zinc-700 text-sm" autoComplete="new-password" /></FormControl><FormMessage /></FormItem>)} />
                                                <FormField control={form.control} name="till.passkey" render={({ field }) => (<FormItem><FormLabel className="text-xs">Passkey</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} className="h-9 bg-zinc-800 border-zinc-700 text-sm" autoComplete="new-password" /></FormControl><FormMessage /></FormItem>)} />
                                                <FormField control={form.control} name="till.callbackURL" render={({ field }) => (<FormItem><FormLabel className="text-xs">Callback URL</FormLabel><FormControl><Input placeholder="https://your-domain.com/api/callback" {...field} className="h-9 bg-zinc-800 border-zinc-700 text-sm" autoComplete="new-password" /></FormControl><FormMessage /></FormItem>)} />
                                            </>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </CardContent>
                        <CardFooter className="p-4 flex items-center justify-between border-t border-zinc-800">
                            <div>{step > 1 && <Button type="button" variant="outline" size="sm" onClick={handleBack}><ChevronLeft className="mr-1 h-4 w-4" />Back</Button>}</div>
                            <div>
                                {step === 1 && <Button type="button" size="sm" onClick={handleNext}>Next<ChevronRight className="ml-1 h-4 w-4" /></Button>}
                                {step === 2 && <Button type="submit" size="sm" disabled={form.formState.isSubmitting} className="bg-gradient-to-r from-blue-600 to-cyan-500">{form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}{form.formState.isSubmitting ? "Saving..." : "Save Changes"}</Button>}
                            </div>
                        </CardFooter>
                    </form>
                </Form>
            </Card>
        </motion.div>
    )
}