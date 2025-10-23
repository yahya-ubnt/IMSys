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
import { createSmsProvider, updateSmsProvider } from "@/services/settingsService"
import { useAuth } from "@/components/auth-provider"

const providerTypes = [
  { value: "celcom", label: "Celcom Africa" },
  { value: "africastalking", label: "Africa's Talking" },
  { value: "twilio", label: "Twilio" },
  { value: "generic_http", label: "Generic HTTP" },
]

const providerFields = {
  celcom: [
    { name: "partnerID", label: "Partner ID", type: "text" },
    { name: "apiKey", label: "API Key", type: "password" },
    { name: "senderId", label: "Sender ID", type: "text" },
  ],
  africastalking: [
    { name: "username", label: "Username", type: "text" },
    { name: "apiKey", label: "API Key", type: "password" },
    { name: "senderId", label: "Sender ID", type: "text" },
  ],
  twilio: [
    { name: "accountSid", label: "Account SID", type: "text" },
    { name: "authToken", label: "Auth Token", type: "password" },
    { name: "fromNumber", label: "From Number", type: "text" },
  ],
  generic_http: [
    { name: "endpointUrl", label: "Endpoint URL", type: "text" },
    { name: "apiKey", label: "API Key", type: "password" },
    { name: "senderId", label: "Sender ID", type: "text" },
  ],
}

export function SmsProviderForm({ provider, onSuccess, onCancel }) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm()
  const [selectedProviderType, setSelectedProviderType] = useState(provider?.providerType || "")
  const { toast } = useToast()
  // const { token } = useAuth() // Removed token from useAuth

  useEffect(() => {
    if (provider) {
      setValue("name", provider.name)
      setValue("providerType", provider.providerType)
      setSelectedProviderType(provider.providerType)
      // Note: We don't pre-fill credentials for security
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
        await updateSmsProvider(provider._id, payload)
        toast({ title: "Success", description: "Provider updated successfully." })
      } else {
        await createSmsProvider(payload)
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

  const handleProviderTypeChange = (value) => {
    setValue("providerType", value)
    setSelectedProviderType(value)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-4 bg-zinc-800/50 rounded-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Configuration Name</Label>
          <Input id="name" {...register("name", { required: true })} className="bg-zinc-800 border-zinc-700" />
          {errors.name && <p className="text-red-500 text-xs">Name is required.</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="providerType">Provider Type</Label>
          <Select onValueChange={handleProviderTypeChange} defaultValue={selectedProviderType}>
            <SelectTrigger className="bg-zinc-800 border-zinc-700">
              <SelectValue placeholder="Select a provider" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 text-white border-zinc-700">
              {providerTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input type="hidden" {...register("providerType", { required: true })} />
          {errors.providerType && <p className="text-red-500 text-xs">Provider type is required.</p>}
        </div>
      </div>

      {selectedProviderType && (
        <div className="space-y-4 pt-4 border-t border-zinc-700">
          <h3 className="text-md font-semibold text-cyan-400">Credentials</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {providerFields[selectedProviderType].map((field) => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={field.name}>{field.label}</Label>
                <Input
                  id={field.name}
                  type={field.type}
                  {...register(field.name, { required: !provider })} // Only required on create
                  className="bg-zinc-800 border-zinc-700"
                  placeholder={provider ? "Unchanged if blank" : ""}
                />
              </div>
            ))}
          </div>
        </div>
      )}

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