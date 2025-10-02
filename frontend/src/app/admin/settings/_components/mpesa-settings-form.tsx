"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"

const paybillFormSchema = z.object({
  shortcode: z.string().min(1, "Paybill number is required"),
  consumerKey: z.string().min(1, "Consumer key is required"),
  consumerSecret: z.string().min(1, "Consumer secret is required"),
  passkey: z.string().min(1, "Passkey is required"),
  validationUrl: z.string().url("Invalid URL format"),
  confirmationUrl: z.string().url("Invalid URL format"),
  enabled: z.boolean().default(false),
})

const tillFormSchema = z.object({
  shortcode: z.string().min(1, "Till number is required"),
  consumerKey: z.string().min(1, "Consumer key is required"),
  consumerSecret: z.string().min(1, "Consumer secret is required"),
  passkey: z.string().min(1, "Passkey is required"),
  validationUrl: z.string().url("Invalid URL format"),
  confirmationUrl: z.string().url("Invalid URL format"),
  enabled: z.boolean().default(false),
})

type PaybillFormValues = z.infer<typeof paybillFormSchema>
type TillFormValues = z.infer<typeof tillFormSchema>

export function MpesaSettingsForm() {
  const [settings, setSettings] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isActivating, setIsActivating] = useState<"paybill" | "till" | null>(
    null
  )

  const paybillForm = useForm<PaybillFormValues>({
    resolver: zodResolver(paybillFormSchema),
    defaultValues: {
      shortcode: "",
      consumerKey: "",
      consumerSecret: "",
      passkey: "",
      validationUrl: "",
      confirmationUrl: "",
      enabled: false,
    },
  })

  const tillForm = useForm<TillFormValues>({
    resolver: zodResolver(tillFormSchema),
    defaultValues: {
      shortcode: "",
      consumerKey: "",
      consumerSecret: "",
      passkey: "",
      validationUrl: "",
      confirmationUrl: "",
      enabled: false,
    },
  })

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/settings/mpesa")
        const data = await response.json()
        setSettings(data)
        paybillForm.reset(data.mpesaPaybill)
        tillForm.reset(data.mpesaTill)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch M-Pesa settings.",
          variant: "destructive",
        })
      }
    }
    fetchSettings()
  }, [paybillForm, tillForm])

  const handlePaybillSubmit = async (data: PaybillFormValues) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/settings/mpesa/paybill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (response.ok) {
        toast({
          title: "Success",
          description: "Paybill settings updated successfully.",
        })
      } else {
        throw new Error("Failed to update settings")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update Paybill settings.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTillSubmit = async (data: TillFormValues) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/settings/mpesa/till", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (response.ok) {
        toast({
          title: "Success",
          description: "Till settings updated successfully.",
        })
      } else {
        throw new Error("Failed to update settings")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update Till settings.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleActivation = async (type: "paybill" | "till") => {
    setIsActivating(type)
    try {
      const response = await fetch(`/api/settings/mpesa/${type}/activate`, {
        method: "POST",
      })
      const result = await response.json()
      if (response.ok) {
        toast({
          title: "Success",
          description: result.message,
        })
        // Refetch settings to update activation status
        const res = await fetch("/api/settings/mpesa")
        const data = await res.json()
        setSettings(data)
      } else {
        throw new Error(result.error || "Activation failed")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsActivating(null)
    }
  }

  return (
    <Tabs defaultValue="paybill" className="w-full">
      <TabsList className="grid w-full grid-cols-2 bg-zinc-800/50 backdrop-blur-sm">
        <TabsTrigger value="paybill">Paybill</TabsTrigger>
        <TabsTrigger value="till">Till</TabsTrigger>
      </TabsList>
      <TabsContent value="paybill">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-black/30 backdrop-blur-lg border border-zinc-700/50 rounded-2xl p-8 shadow-2xl shadow-blue-500/10"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-white">
                M-Pesa Paybill Settings
              </h3>
              <p className="text-zinc-400">
                Configure your M-Pesa Paybill details for C2B payments.
              </p>
            </div>
            <div className="space-y-6">
              <Form {...paybillForm}>
                <form
                  onSubmit={paybillForm.handleSubmit(handlePaybillSubmit)}
                  className="space-y-6"
                >
                  {/* Form fields for Paybill */}
                  <FormField
                    control={paybillForm.control}
                    name="shortcode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-zinc-300">
                          Paybill Number
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., 888888"
                            {...field}
                            className="bg-zinc-800 border-zinc-700 text-.tsx"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* ... other fields ... */}
                  <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
                    {isLoading ? "Saving..." : "Update Paybill Settings"}
                  </Button>
                </form>
              </Form>
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-medium text-white">Callback URL</h4>
                  <p className="text-zinc-400 text-sm">
                    We will attempt to register this callback URL with Safaricom.
                  </p>
                  <Input
                    readOnly
                    value="https://api.yourdomain.com/api/payments/c2b-callback"
                    className="bg-zinc-800 border-zinc-700 text-white mt-2"
                  />
                </div>
                <Button
                  onClick={() => handleActivation("paybill")}
                  disabled={isActivating === "paybill"}
                  variant={settings?.mpesaPaybill?.activated ? "secondary" : "default"}
                  className="w-full"
                >
                  {isActivating === "paybill" ? "Activating..." : (settings?.mpesaPaybill?.activated ? "Activated" : "Activate M-Pesa")}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </TabsContent>
      <TabsContent value="till">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-black/30 backdrop-blur-lg border border-zinc-700/50 rounded-2xl p-8 shadow-2xl shadow-purple-500/10"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-white">
                M-Pesa Till Settings
              </h3>
              <p className="text-zinc-400">
                Configure your M-Pesa Till details for C2B payments.
              </p>
            </div>
            <div className="space-y-6">
              <Form {...tillForm}>
                <form
                  onSubmit={tillForm.handleSubmit(handleTillSubmit)}
                  className="space-y-6"
                >
                  {/* Form fields for Till */}
                  <FormField
                    control={tillForm.control}
                    name="shortcode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-zinc-300">
                          Till Number
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., 123456"
                            {...field}
                            className="bg-zinc-800 border-zinc-700 text-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* ... other fields ... */}
                  <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
                    {isLoading ? "Saving..." : "Update Till Settings"}
                  </Button>
                </form>
              </Form>
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-medium text-white">Callback URL</h4>
                  <p className="text-zinc-400 text-sm">
                    We will attempt to register this callback URL with Safaricom.
                  </p>
                  <Input
                    readOnly
                    value="https://api.yourdomain.com/api/payments/c2b-callback"
                    className="bg-zinc-800 border-zinc-700 text-white mt-2"
                  />
                </div>
                <Button
                  onClick={() => handleActivation("till")}
                  disabled={isActivating === "till"}
                  variant={settings?.mpesaTill?.activated ? "secondary" : "default"}
                  className="w-full"
                >
                  {isActivating === "till" ? "Activating..." : (settings?.mpesaTill?.activated ? "Activated" : "Activate M-Pesa")}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </TabsContent>
    </Tabs>
  )
}