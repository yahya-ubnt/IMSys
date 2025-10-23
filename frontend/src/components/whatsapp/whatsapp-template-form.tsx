"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { createWhatsAppTemplate, updateWhatsAppTemplate } from "@/lib/api/whatsapp"
import { useAuth } from "@/components/auth-provider"

export function WhatsAppTemplateForm({ template, smsTemplates, onSuccess, onCancel }) {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm()
  const { toast } = useToast()

  useEffect(() => {
    if (template) {
      setValue("templateName", template.templateName)
      setValue("providerTemplateId", template.providerTemplateId)
      setValue("body", template.body)
    }
  }, [template, setValue])

  const onSubmit = async (data) => {
    try {
      if (template) {
        await updateWhatsAppTemplate(template._id, data)
        toast({ title: "Success", description: "Template updated successfully." })
      } else {
        await createWhatsAppTemplate(data)
        toast({ title: "Success", description: "Template created successfully." })
      }
      onSuccess()
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "An error occurred.",
        variant: "destructive",
      })
    }
  }

  const handleCopyFromSms = (smsTemplateId: string) => {
    const selectedSms = smsTemplates.find(t => t._id === smsTemplateId);
    if (selectedSms) {
      setValue("body", selectedSms.messageBody);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
        <Label>Copy from SMS Template (Optional)</Label>
        <Select onValueChange={handleCopyFromSms}>
          <SelectTrigger className="bg-zinc-800 border-zinc-700">
            <SelectValue placeholder="Select an SMS template to copy from..." />
          </SelectTrigger>
          <SelectContent className="bg-zinc-800 text-white border-zinc-700">
            {smsTemplates.map((sms) => (
              <SelectItem key={sms._id} value={sms._id}>
                {sms.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="templateName">Template Name</Label>
        <Input 
          id="templateName" 
          {...register("templateName", { required: "Template name is required." })} 
          className="bg-zinc-800 border-zinc-700"
          placeholder="e.g., Payment Reminder"
        />
        {errors.templateName && <p className="text-red-500 text-xs">{errors.templateName.message}</p>}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="providerTemplateId">Provider Template ID</Label>
        <Input 
          id="providerTemplateId" 
          {...register("providerTemplateId", { required: "Provider Template ID is required." })} 
          className="bg-zinc-800 border-zinc-700"
          placeholder="e.g., HXa1b2c3d4e5f6..."
        />
        {errors.providerTemplateId && <p className="text-red-500 text-xs">{errors.providerTemplateId.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="body">Template Body</Label>
        <Textarea
          id="body"
          {...register("body", { required: "Template body is required." })}
          className="bg-zinc-800 border-zinc-700"
          rows={5}
          placeholder="Your {{1}} appointment is coming up on {{2}}."
        />
        {errors.body && <p className="text-red-500 text-xs">{errors.body.message}</p>}
      </div>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-cyan-500 hover:bg-cyan-600 text-white">
          {template ? "Update Template" : "Save Template"}
        </Button>
      </div>
    </form>
  )
}