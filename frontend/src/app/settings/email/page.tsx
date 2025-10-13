'use client'

import { useEffect, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardFooter, CardTitle, CardDescription } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Trash2, PlusCircle, Save, Loader2, Mail, Server } from "lucide-react"
import { useAuth } from "@/components/auth-provider"

// --- Zod Schema Definition ---
const emailSettingsSchema = z.object({
  adminNotificationEmails: z.array(z.string().email({ message: "Invalid email address." })).optional(),
  newEmailInput: z.string().optional(), // Add newEmailInput to schema
  smtpSettings: z.object({
    host: z.string().min(1, "Host is required."),
    port: z.coerce.number().min(1, "Port is required."),
    user: z.string().min(1, "User is required."),
    pass: z.string().optional(), // Password is not required on every update
    from: z.string().email({ message: "Invalid 'From' email address." }),
  })
});

type EmailSettingsFormValues = z.infer<typeof emailSettingsSchema>;

// --- Main Component ---
export default function EmailSettingsPage() {
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(true); // Re-introduce isLoading state

  const form = useForm<EmailSettingsFormValues>({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues: {
      adminNotificationEmails: [],
      newEmailInput: "", // Initialize newEmailInput
      smtpSettings: { host: "smtp.gmail.com", port: 587, user: "", pass: "", from: "" },
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "adminNotificationEmails"
  });

  useEffect(() => {
    if (!token) return;
    const fetchSettings = async () => {
      setIsLoading(true); // Set loading true before fetch
      try {
        const response = await fetch("/api/settings/general", { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) throw new Error("Failed to fetch settings.");
        const data = await response.json();

        // Normalize smtpSettings to prevent controlled/uncontrolled input warning
        const smtp = data.smtpSettings || {};
        const normalizedSmtp = {
          host: smtp.host || "",
          port: smtp.port || 587,
          user: smtp.user || "",
          from: smtp.from || "",
          pass: "", // Always keep pass empty on load
        };

        form.reset({
          adminNotificationEmails: data.adminNotificationEmails || [],
          newEmailInput: "", // Explicitly reset newEmailInput on initial load
          smtpSettings: normalizedSmtp,
        });
      } catch (error) {
        toast.error((error as Error).message);
      } finally {
        setIsLoading(false); // Set loading false after fetch
      }
    };
    fetchSettings();
  }, [form, token]);

  const onSubmit = async (data: EmailSettingsFormValues) => {
    if (!token) return;
    setIsLoading(true); // Set loading true before submit
    try {
      const settingsToSave = { ...data };
      if (settingsToSave.smtpSettings && !settingsToSave.smtpSettings.pass) {
        delete settingsToSave.smtpSettings.pass;
      }

      const response = await fetch("/api/settings/general", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(settingsToSave),
      });

      if (!response.ok) throw new Error("Failed to save settings.");
      toast.success("Email settings updated successfully!");
      // Reset form with submitted data to clear dirty state and show new defaults
      const responseData = await response.json();
      form.reset({
        adminNotificationEmails: responseData.adminNotificationEmails || [],
        newEmailInput: "", // Explicitly reset newEmailInput
        smtpSettings: responseData.smtpSettings || { host: "", port: 587, user: "", from: "" },
      });

    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsLoading(false); // Set loading false after submit
    }
  };

  const handleAddEmail = () => {
    const newEmail = form.getValues("newEmailInput"); // A temporary field for the input
    if (newEmail && !fields.some(field => field.value === newEmail)) {
      const emailSchema = z.string().email();
      const validation = emailSchema.safeParse(newEmail);
      if (validation.success) {
        append(newEmail);
        form.setValue("newEmailInput", ""); // Clear the temporary input field
      } else {
        toast.error("Please enter a valid email address.");
      }
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-blue-400" /></div>;
  }

  return (
    <motion.div layout className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          <Card className="bg-zinc-900/50 backdrop-blur-lg border-zinc-700 shadow-xl shadow-cyan-500/10">
            <CardHeader>
              <CardTitle className="text-base text-cyan-400 flex items-center gap-2"><Mail size={18} /> Notification Recipients</CardTitle>
              <CardDescription className="text-zinc-400 pt-1">Manage the list of admin emails that receive system notifications.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {fields.map((field, index) => (
                  <motion.div key={field.id} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between p-2 bg-zinc-800 rounded-md">
                    <span className="text-sm">{field.value}</span>
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                  </motion.div>
                ))}
                {fields.length === 0 && <p className="text-sm text-zinc-400">No notification emails configured.</p>}
              </div>
              <div className="flex items-center space-x-2">
                <FormField
                  control={form.control}
                  name="newEmailInput" // Temporary field for the input
                  render={({ field }) => (
                    <Input {...field} type="email" placeholder="Add new recipient email" className="h-9 bg-zinc-800 border-zinc-700 text-sm" />
                  )}
                />
                <Button type="button" onClick={handleAddEmail} size="icon"><PlusCircle className="h-5 w-5" /></Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 backdrop-blur-lg border-zinc-700 shadow-xl shadow-blue-500/10">
            <CardHeader>
              <CardTitle className="text-base text-blue-400 flex items-center gap-2"><Server size={18} /> Email Server (SMTP) Configuration</CardTitle>
              <CardDescription className="text-zinc-400 pt-1">Configure the server that sends emails. The password is encrypted.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="smtpSettings.host" render={({ field }) => (<FormItem><FormLabel className="text-xs">SMTP Host</FormLabel><FormControl><Input {...field} className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="smtpSettings.port" render={({ field }) => (<FormItem><FormLabel className="text-xs">SMTP Port</FormLabel><FormControl><Input type="number" {...field} className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <FormField control={form.control} name="smtpSettings.user" render={({ field }) => (<FormItem><FormLabel className="text-xs">SMTP User</FormLabel><FormControl><Input {...field} autoComplete="new-password" className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="smtpSettings.pass" render={({ field }) => (<FormItem><FormLabel className="text-xs">SMTP Password</FormLabel><FormControl><Input type="password" placeholder="Enter new password to update" {...field} autoComplete="new-password" className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></FormControl><FormDescription className="text-xs text-zinc-500 pt-1">For services like Gmail/Outlook, use an App Password, not your normal password.</FormDescription><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="smtpSettings.from" render={({ field }) => (<FormItem><FormLabel className="text-xs">From Email</FormLabel><FormControl><Input type="email" placeholder="e.g., no-reply@yourcompany.com" {...field} className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></FormControl><FormMessage /></FormItem>)} />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={form.formState.isSubmitting || !form.formState.isDirty} className="bg-gradient-to-r from-blue-600 to-cyan-500">
              {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Form>
    </motion.div>
  );
}
