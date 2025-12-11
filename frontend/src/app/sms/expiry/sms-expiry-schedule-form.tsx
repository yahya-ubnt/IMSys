"use client"

import React, { useEffect, useRef } from "react";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import type { SmsExpirySchedule } from "./page";

// Define the schema for the form data using Zod
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  days: z.number().int().min(1).max(7, "Days must be between 1 and 7"),
  timing: z.enum(["Before", "After", "Not Applicable"]),
  status: z.enum(["Active", "Inactive"]),
  messageBody: z.string().min(10, "Message body must be at least 10 characters"),
});

export type SmsExpiryScheduleFormData = z.infer<typeof formSchema>;

interface SmsExpiryScheduleFormProps {
  onSubmit: (data: SmsExpiryScheduleFormData) => void;
  initialData?: SmsExpirySchedule | null;
  onClose: () => void;
}

const placeholders = [
  { label: "Official Name", value: "{{officialName}}" },
  { label: "MPESA Ref No.", value: "{{mPesaRefNo}}" },
  { label: "Mobile Number", value: "{{mobileNumber}}" },
  { label: "Wallet Balance", value: "{{walletBalance}}" },
  { label: "Package Amount", value: "{{transaction_amount}}" },
  { label: "Expiry Date", value: "{{expiryDate}}" },
  { label: "Days Remaining", value: "{{daysRemaining}}" },
];

export function SmsExpiryScheduleForm({ onSubmit, initialData, onClose }: SmsExpiryScheduleFormProps) {
  const form = useForm<SmsExpiryScheduleFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      days: 1,
      timing: "Before",
      status: "Active",
      messageBody: "",
    },
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        days: initialData.days,
        timing: initialData.timing,
        status: initialData.status,
        messageBody: initialData.messageBody,
      });
    }
  }, [initialData, form]);

  const handlePlaceholderClick = (placeholder: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const newText = text.substring(0, start) + placeholder + text.substring(end);
    
    form.setValue("messageBody", newText, { shouldValidate: true });
    
    // Focus and set cursor position after the inserted placeholder
    setTimeout(() => {
      textarea.focus();
      const newCursorPosition = start + placeholder.length;
      textarea.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 0);
  };

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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="days"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Days</FormLabel>
                <Select onValueChange={(value) => field.onChange(parseInt(value, 10))} defaultValue={String(field.value)}>
                  <FormControl>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-zinc-800 text-white border-zinc-700">
                    {[...Array(7)].map((_, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>{i + 1} Day(s)</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
          name="messageBody"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message Body</FormLabel>
              <FormControl>
                <Textarea
                  ref={textareaRef}
                  placeholder="Write your SMS message here. Use placeholders to personalize it."
                  value={field.value}
                  onChange={field.onChange}
                  className="bg-zinc-800 border-zinc-700 min-h-[120px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div>
          <FormLabel className="text-xs text-zinc-400">Insert Placeholder</FormLabel>
          <div className="flex flex-wrap gap-2 pt-2">
            {placeholders.map(p => (
              <Button
                type="button"
                key={p.value}
                variant="outline"
                size="sm"
                onClick={() => handlePlaceholderClick(p.value)}
                className="bg-zinc-700 border-zinc-600 text-xs h-7"
              >
                {p.label}
              </Button>
            ))}
          </div>
        </div>
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