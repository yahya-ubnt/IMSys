"use client"

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/components/auth-provider";
import { Loader2, Save, Building, Palette, Bot } from "lucide-react";

// Zod Schema for Validation
const formSchema = z.object({
  appName: z.string().min(1, "App Name is required."),
  logoIcon: z.any(),
  favicon: z.any(),
  currencySymbol: z.string().min(1, "Currency Symbol is required."),
  paymentGracePeriodDays: z.number().int().min(0, "Grace period must be a positive number."),
  disconnectTime: z.enum(['expiry_time', 'end_of_day']),
  autoDisconnectUsers: z.boolean(),
  sendPaymentReminders: z.boolean(),
  companyInfo: z.object({
    name: z.string().min(1, "Company Name is required."),
    country: z.string().min(1, "Country is required."),
    email: z.string().email("Invalid email address."),
    phone: z.string().min(1, "Phone number is required."),
    address: z.string(),
  }),
  portalUrls: z.object({
    admin: z.string().url("Invalid URL."),
    client: z.string().url("Invalid URL."),
  }),
});

type GeneralSettingsFormValues = z.infer<typeof formSchema>;

export default function GeneralSettingsForm() {
  const { token } = useAuth();
  const form = useForm<GeneralSettingsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      appName: "",
      currencySymbol: "KES",
      paymentGracePeriodDays: 3,
      disconnectTime: "end_of_day",
      autoDisconnectUsers: true,
      sendPaymentReminders: true,
      companyInfo: { name: "", country: "Kenya", email: "", phone: "+254", address: "" },
      portalUrls: { admin: "", client: "" },
    },
  });

  useEffect(() => {
    const fetchSettings = async () => {
      if (!token) return;
      try {
        const response = await fetch("/api/settings/general", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Failed to fetch settings.");
        const data = await response.json();
        
        // Separate file inputs from the rest of the data
        const { logoIcon, favicon, ...restOfData } = data;

        form.reset({
          ...restOfData,
          companyInfo: data.companyInfo || {},
          portalUrls: data.portalUrls || {},
        });
      } catch (error) {
        toast.error((error as Error).message);
      }
    };
    fetchSettings();
  }, [token, form]);

  const onSubmit = async (data: GeneralSettingsFormValues) => {
    if (!token) return;
    try {
      const formData = new FormData();
      
      // Append all fields to FormData
      Object.keys(data).forEach(key => {
        if (key === 'logoIcon' || key === 'favicon') {
          if (data[key][0]) formData.append(key, data[key][0]);
        } else if (typeof data[key] === 'object' && data[key] !== null) {
          formData.append(key, JSON.stringify(data[key]));
        } else {
          formData.append(key, data[key]);
        }
      });

      const response = await fetch("/api/settings/general", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to update settings.");
      toast.success("General settings updated successfully!");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Branding Section */}
        <motion.div layout className="bg-zinc-900/50 backdrop-blur-lg border-zinc-700 shadow-2xl shadow-blue-500/10 rounded-xl overflow-hidden">
          <Card className="bg-transparent border-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Palette size={20} /> Branding</CardTitle>
              <CardDescription>Manage your application's logo and favicon.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="logoIcon" render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Logo (JPEG, PNG, max 2MB)</FormLabel>
                  <FormControl><Input type="file" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="favicon" render={({ field }) => (
                <FormItem>
                  <FormLabel>Favicon (JPEG, PNG, GIF, max 1MB)</FormLabel>
                  <FormControl><Input type="file" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>
        </motion.div>

        {/* Company Info Section */}
        <motion.div layout className="bg-zinc-900/50 backdrop-blur-lg border-zinc-700 shadow-2xl shadow-blue-500/10 rounded-xl overflow-hidden">
          <Card className="bg-transparent border-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Building size={20} /> Company Information</CardTitle>
              <CardDescription>Update your company's details.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="companyInfo.name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="companyInfo.country" render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="companyInfo.email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Email</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="companyInfo.phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Phone</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="portalUrls.admin" render={({ field }) => (
                <FormItem>
                  <FormLabel>Admin Portal URL</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="portalUrls.client" render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Portal URL</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>
        </motion.div>

        {/* Billing & Automation Section */}
        <motion.div layout className="bg-zinc-900/50 backdrop-blur-lg border-zinc-700 shadow-2xl shadow-blue-500/10 rounded-xl overflow-hidden">
          <Card className="bg-transparent border-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Bot size={20} /> Billing & Automation</CardTitle>
              <CardDescription>Configure billing cycles and automation rules.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="currencySymbol" render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency Symbol</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="paymentGracePeriodDays" render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Grace Period (days)</FormLabel>
                  <FormControl><Input type="number" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="disconnectTime" render={({ field }) => (
                <FormItem>
                  <FormLabel>Disconnect Time on Expiry Day</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="expiry_time">At the exact time of expiry</SelectItem>
                      <SelectItem value="end_of_day">At the end of the day</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="autoDisconnectUsers" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Auto-Disconnect Expired Users</FormLabel>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="sendPaymentReminders" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Send Payment Reminders</FormLabel>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )} />
            </CardContent>
          </Card>
        </motion.div>

        <div className="flex justify-end">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
}
