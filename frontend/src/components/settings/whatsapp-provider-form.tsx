"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { createWhatsAppProvider, updateWhatsAppProvider } from "@/services/settingsService"
import { useAuth } from "@/components/auth-provider"

const providerTypes = [
  { value: "twilio", label: "Twilio" },
]

const providerFields = {
  twilio: [
    { name: "accountSid", label: "Account SID", type: "text" },
    { name: "authToken", label: "Auth Token", type: "password" },
    { name: "fromNumber", label: "WhatsApp 'From' Number", type: "text", placeholder: "whatsapp:+14155238886" },
  ],
}

export function WhatsAppProviderForm({ provider, onSuccess, onCancel }) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm()
  const [selectedProviderType, setSelectedProviderType] = useState(provider?.providerType || "twilio")
  const { toast } = useToast()
  const { token } = useAuth()

  useEffect(() => {
    if (provider) {
      setValue("name", provider.name)
      setValue("providerType", provider.providerType)
      setSelectedProviderType(provider.providerType)
    } else {
      // Default to Twilio for new providers
      setValue("providerType", "twilio")
    }
  }, [provider, setValue])

  const onSubmit = async (data) => {
    try {
      const payload = {
        name: data.name,
        providerType: data.providerType,
        credentials: {},
      }
      
      providerFields[data.providerType].forEach(field => {
        payload.credentials[field.name] = data[field.name]
      })

      if (provider) {
        await updateWhatsAppProvider(provider._id, payload, token)
        toast({ title: "Success", description: "Provider updated successfully." })
      } else {
        await createWhatsAppProvider(payload, token)
        toast({ title: "Success", description: "Provider created successfully." })
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Configuration Name</Label>
        <Input id="name" {...register("name", { required: true })} className="bg-zinc-800 border-zinc-700" />
        {errors.name && <p className="text-red-500 text-xs">Name is required.</p>}
      </div>
      
      {/* Provider type is fixed to Twilio for now */}
      <input type="hidden" {...register("providerType")} value="twilio" />

      <div className="space-y-4 pt-4 border-t border-zinc-700">
        <h3 className="text-md font-semibold text-cyan-400">Twilio Credentials</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {providerFields.twilio.map((field) => (
            <div key={field.name} className="space-y-2">
              <Label htmlFor={field.name}>{field.label}</Label>
              <Input
                id={field.name}
                type={field.type}
                {...register(field.name, { required: !provider })}
                className="bg-zinc-800 border-zinc-700"
                placeholder={provider ? "Unchanged if blank" : (field.placeholder || "")}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-cyan-500 hover:bg-cyan-600 text-white">
          {provider ? "Update Provider" : "Save Provider"}
        </Button>
      </div>
    </form>
  )
}