"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, Controller } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { motion } from "framer-motion"

const brandingFormSchema = z.object({
  appName: z.string().min(2, {
    message: "App name must be at least 2 characters.",
  }),
  logo: z.any().optional(),
  primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: "Primary color must be a valid hex code.",
  }),
})

type BrandingFormValues = z.infer<typeof brandingFormSchema>

const defaultValues: Partial<BrandingFormValues> = {
  appName: "ISP Management System",
  primaryColor: "#3b82f6",
}

export function BrandingSettingsForm() {
  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<BrandingFormValues>({
    resolver: zodResolver(brandingFormSchema),
    defaultValues,
  })

  function onSubmit(data: BrandingFormValues) {
    toast.success("Branding settings saved successfully!")
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="bg-zinc-900/50 backdrop-blur-lg border border-zinc-700/50 rounded-xl">
        <div className="p-6">
          <h3 className="text-2xl font-bold text-white mb-4">Branding Settings</h3>
        </div>
        <div className="p-6 pt-0">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div>
                  <Label htmlFor="appName" className="text-zinc-400">Application Name</Label>
                  <Controller
                    name="appName"
                    control={control}
                    render={({ field }) => (
                      <Input id="appName" {...field} className="bg-zinc-800 border-zinc-700 text-white" />
                    )}
                  />
                  {errors.appName && <p className="text-red-500 text-sm mt-1">{errors.appName.message}</p>}
                </div>
                <div>
                  <Label htmlFor="logo" className="text-zinc-400">Logo</Label>
                  <Controller
                    name="logo"
                    control={control}
                    render={({ field }) => (
                      <Input id="logo" type="file" {...field} className="bg-zinc-800 border-zinc-700 text-white" />
                    )}
                  />
                  {errors.logo && <p className="text-red-500 text-sm mt-1">{errors.logo.message}</p>}
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="primaryColor" className="text-zinc-400">Primary Color</Label>
                  <Controller
                    name="primaryColor"
                    control={control}
                    render={({ field }) => (
                      <Input id="primaryColor" type="color" {...field} className="bg-zinc-800 border-zinc-700 text-white w-full" />
                    )}
                  />
                  {errors.primaryColor && <p className="text-red-500 text-sm mt-1">{errors.primaryColor.message}</p>}
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={!isDirty} className="bg-blue-600 hover:bg-blue-700 text-white">
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  )
}