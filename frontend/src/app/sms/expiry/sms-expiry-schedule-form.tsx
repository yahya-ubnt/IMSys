"use client"

import React, { useEffect } from "react";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import type { SmsExpirySchedule } from "./page";

// Define the schema for the form data using Zod
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  days: z.coerce.number().int().positive("Days must be a positive number"),
  timing: z.enum(["Before", "After", "Not Applicable"]),
  status: z.enum(["Active", "Inactive"]),
  smsTemplate: z.string().min(1, "An SMS template is required"),
  whatsAppTemplate: z.string().optional(),
});

export type SmsExpiryScheduleFormData = z.infer<typeof formSchema>;

interface SmsExpiryScheduleFormProps {
  onSubmit: (data: SmsExpiryScheduleFormData) => void;
  initialData?: SmsExpirySchedule | null;
  onClose: () => void;
  smsTemplates: any[];
  whatsAppTemplates: any[];
}

export function SmsExpiryScheduleForm({ onSubmit, initialData, onClose, smsTemplates, whatsAppTemplates }: SmsExpiryScheduleFormProps) {
  const form = useForm<SmsExpiryScheduleFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      days: 3,
      timing: "Before",
      status: "Active",
      smsTemplate: "",
      whatsAppTemplate: "",
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        days: initialData.days,
        timing: initialData.timing,
        status: initialData.status,
        // @ts-ignore
        smsTemplate: initialData.smsTemplate?._id || initialData.smsTemplate,
        // @ts-ignore
        whatsAppTemplate: initialData.whatsAppTemplate?._id || initialData.whatsAppTemplate,
      });
    }
  }, [initialData, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Schedule Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., 3 Days Before Expiry" {...field} className="bg-zinc-800 border-zinc-700" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="days"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Days</FormLabel>
                <FormControl>
                  <Input type="number" {...field} className="bg-zinc-800 border-zinc-700" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="timing"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Timing</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-zinc-800 text-white border-zinc-700">
                    <SelectItem value="Before">Before</SelectItem>
                    <SelectItem value="After">After</SelectItem>
                    <SelectItem value="Not Applicable">Not Applicable</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="smsTemplate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>SMS Template (Required Fallback)</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue placeholder="Select an SMS template" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-zinc-800 text-white border-zinc-700">
                  {smsTemplates.map(template => (
                    <SelectItem key={template._id} value={template._id}>{template.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="whatsAppTemplate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>WhatsApp Template (Optional)</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue placeholder="Select a WhatsApp template (optional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-zinc-800 text-white border-zinc-700">
                  {whatsAppTemplates.map(template => (
                    <SelectItem key={template._id} value={template._id}>{template.templateName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-zinc-800 text-white border-zinc-700">
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose} className="bg-transparent border-zinc-700 hover:bg-zinc-800">Cancel</Button>
          <Button type="submit" className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white">Save Schedule</Button>
        </div>
      </form>
    </Form>
  )
}