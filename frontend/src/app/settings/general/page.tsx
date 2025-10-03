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
import { useSettings } from "@/hooks/use-settings";
import { Loader2, Save, Building, Palette, Bot } from "lucide-react";
import { useRouter } from "next/navigation";

// Zod Schemas for Validation
const brandingSchema = z.object({
  appName: z.string().min(1, "App Name is required."),
  slogan: z.string(),
  logoIcon: z.any(),
  favicon: z.any(),
});

const companyInfoSchema = z.object({
  companyInfo: z.object({
    name: z.string().min(1, "Company Name is required."),
    country: z.string().min(1, "Country is required."),
    email: z.string().email("Invalid email address."),
    phone: z.string().min(1, "Phone number is required."),
    address: z.string(),
  }),
  portalUrls: z.object({
    admin: z.string().url("Invalid URL.").optional(),
    client: z.string().url("Invalid URL.").optional(),
  }),
});

const billingSchema = z.object({
  currencySymbol: z.string().min(1, "Currency Symbol is required."),
  paymentGracePeriodDays: z.coerce.number().int().min(0, "Grace period must be a positive number."),
  disconnectTime: z.enum(['expiry_time', 'end_of_day']),
  autoDisconnectUsers: z.boolean(),
  sendPaymentReminders: z.boolean(),
});

type BrandingFormValues = z.infer<typeof brandingSchema>;
type CompanyInfoFormValues = z.infer<typeof companyInfoSchema>;
type BillingFormValues = z.infer<typeof billingSchema>;

const africanCountries = [
  "Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", "Burundi", "Cabo Verde", "Cameroon", "Central African Republic", "Chad", "Comoros", "Congo, Democratic Republic of the", "Congo, Republic of the", "Djibouti", "Egypt", "Equatorial Guinea", "Eritrea", "Eswatini", "Ethiopia", "Gabon", "Gambia", "Ghana", "Guinea", "Guinea-Bissau", "Ivory Coast", "Kenya", "Lesotho", "Liberia", "Libya", "Madagascar", "Malawi", "Mali", "Mauritania", "Mauritius", "Morocco", "Mozambique", "Namibia", "Niger", "Nigeria", "Rwanda", "Sao Tome and Principe", "Senegal", "Seychelles", "Sierra Leone", "Somalia", "South Africa", "South Sudan", "Sudan", "Tanzania", "Togo", "Tunisia", "Uganda", "Zambia", "Zimbabwe", "Western Sahara"
];

export default function GeneralSettingsForm() {
  const { token } = useAuth();
  const { setSettings } = useSettings();
  const router = useRouter();

  const brandingForm = useForm<BrandingFormValues>({
    resolver: zodResolver(brandingSchema),
    defaultValues: { appName: "", slogan: "" },
  });

  const companyInfoForm = useForm<CompanyInfoFormValues>({
    resolver: zodResolver(companyInfoSchema),
    defaultValues: {
      companyInfo: { name: "", country: "Kenya", email: "", phone: "+254", address: "" },
      portalUrls: { admin: "", client: "" },
    },
  });

  const billingForm = useForm<BillingFormValues>({
    resolver: zodResolver(billingSchema),
    defaultValues: {
      currencySymbol: "KES",
      paymentGracePeriodDays: 3,
      disconnectTime: "end_of_day",
      autoDisconnectUsers: true,
      sendPaymentReminders: true,
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
        
        brandingForm.reset({
          appName: data.appName,
          slogan: data.slogan,
        });
        companyInfoForm.reset({
          companyInfo: data.companyInfo || {},
          portalUrls: data.portalUrls || {},
        });
        billingForm.reset({
          currencySymbol: data.currencySymbol,
          paymentGracePeriodDays: data.paymentGracePeriodDays,
          disconnectTime: data.disconnectTime,
          autoDisconnectUsers: data.autoDisconnectUsers,
          sendPaymentReminders: data.sendPaymentReminders,
        });
      } catch (error) {
        toast.error((error as Error).message);
      }
    };
    fetchSettings();
  }, [token, brandingForm, companyInfoForm, billingForm]);

  const onSubmit = async (data: any, section: string) => {
    if (!token) return;
    try {
      const formData = new FormData();
      
      (Object.keys(data) as Array<keyof typeof data>).forEach(key => {
        const value = data[key];
        if (value !== undefined && value !== null) {
          if (key === 'logoIcon' || key === 'favicon') {
            if (value[0]) {
              formData.append(key, value[0]);
            }
          } else if (typeof value === 'object') {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, String(value));
          }
        }
      });

      const response = await fetch(`/api/settings/general`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update ${section} settings: ${errorText}`);
      }
      const updatedSettings = await response.json();
      setSettings({
        appName: updatedSettings.appName,
        slogan: updatedSettings.slogan,
        logoIcon: updatedSettings.logoIcon,
      });
      toast.success(`${section} settings updated successfully!`);
      router.refresh();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const onBrandingSubmit = (data: BrandingFormValues) => onSubmit(data, "Branding");
  const onCompanyInfoSubmit = (data: CompanyInfoFormValues) => onSubmit(data, "Company Info");
  const onBillingSubmit = (data: BillingFormValues) => onSubmit(data, "Billing");

  return (
    <div className="space-y-6">
      {/* Branding Section */}
      <Form {...brandingForm}>
        <form onSubmit={brandingForm.handleSubmit(onBrandingSubmit)} className="space-y-6">
          <motion.div layout className="bg-zinc-900/50 backdrop-blur-lg border-zinc-700 shadow-2xl shadow-blue-500/10 rounded-xl overflow-hidden">
            <Card className="bg-transparent border-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Palette size={20} /> Branding</CardTitle>
                <CardDescription>Manage your application's logo and favicon.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField control={brandingForm.control} name="appName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>App Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={brandingForm.control} name="slogan" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slogan</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={brandingForm.control} name="logoIcon" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Logo (JPEG, PNG, max 2MB)</FormLabel>
                    <FormControl><Input type="file" {...field} onChange={event => field.onChange(event.target.files)} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={brandingForm.control} name="favicon" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Favicon (JPEG, PNG, GIF, max 1MB)</FormLabel>
                    <FormControl><Input type="file" {...field} onChange={event => field.onChange(event.target.files)} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </CardContent>
            </Card>
          </motion.div>
          <div className="flex justify-end">
            <Button type="submit" disabled={brandingForm.formState.isSubmitting}>
              {brandingForm.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Branding
            </Button>
          </div>
        </form>
      </Form>

      {/* Company Info Section */}
      <Form {...companyInfoForm}>
        <form onSubmit={companyInfoForm.handleSubmit(onCompanyInfoSubmit)} className="space-y-6">
          <motion.div layout className="bg-zinc-900/50 backdrop-blur-lg border-zinc-700 shadow-2xl shadow-blue-500/10 rounded-xl overflow-hidden">
            <Card className="bg-transparent border-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Building size={20} /> Company Information</CardTitle>
                <CardDescription>Update your company's details.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={companyInfoForm.control} name="companyInfo.name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={companyInfoForm.control} name="companyInfo.country" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-zinc-800 border-zinc-700 h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-zinc-800 text-white border-zinc-700">
                        {africanCountries.map(country => <SelectItem key={country} value={country} className="text-sm">{country}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={companyInfoForm.control} name="companyInfo.email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Email</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={companyInfoForm.control} name="companyInfo.phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Phone</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={companyInfoForm.control} name="portalUrls.admin" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Admin Portal URL</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={companyInfoForm.control} name="portalUrls.client" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client Portal URL</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </CardContent>
            </Card>
          </motion.div>
          <div className="flex justify-end">
            <Button type="submit" disabled={companyInfoForm.formState.isSubmitting}>
              {companyInfoForm.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Company Info
            </Button>
          </div>
        </form>
      </Form>

      {/* Billing & Automation Section */}
      <Form {...billingForm}>
        <form onSubmit={billingForm.handleSubmit(onBillingSubmit)} className="space-y-6">
          <motion.div layout className="bg-zinc-900/50 backdrop-blur-lg border-zinc-700 shadow-2xl shadow-blue-500/10 rounded-xl overflow-hidden">
            <Card className="bg-transparent border-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Bot size={20} /> Billing & Automation</CardTitle>
                <CardDescription>Configure billing cycles and automation rules.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={billingForm.control} name="currencySymbol" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency Symbol</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={billingForm.control} name="paymentGracePeriodDays" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Grace Period (days)</FormLabel>
                    <FormControl><Input type="number" {...field} onChange={event => field.onChange(event.target.valueAsNumber)} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={billingForm.control} name="disconnectTime" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Disconnect Time on Expiry Day</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-zinc-800 border-zinc-700 h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-zinc-800 text-white border-zinc-700">
                        <SelectItem value="expiry_time" className="text-sm">At the exact time of expiry</SelectItem>
                        <SelectItem value="end_of_day" className="text-sm">At the end of the day</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={billingForm.control} name="autoDisconnectUsers" render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Auto-Disconnect Expired Users</FormLabel>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )} />
                <FormField control={billingForm.control} name="sendPaymentReminders" render={({ field }) => (
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
            <Button type="submit" disabled={billingForm.formState.isSubmitting}>
              {billingForm.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Billing Settings
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
