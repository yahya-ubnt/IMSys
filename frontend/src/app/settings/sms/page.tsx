"use client"

import { useState, useEffect } from "react"
import { PlusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth-provider"
import { SmsProviderList } from "@/components/settings/sms-provider-list"
import { SmsProviderForm } from "@/components/settings/sms-provider-form"
import { getSmsProviders } from "@/services/settingsService"

export default function SmsSettingsPage() {
  const [providers, setProviders] = useState([])
  const [editingProvider, setEditingProvider] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchProviders()
  }, [])

  const fetchProviders = async () => {
    try {
      const data = await getSmsProviders()
      setProviders(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch SMS providers.",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (provider) => {
    setEditingProvider(provider)
    setIsFormOpen(true)
  }

  const handleAddNew = () => {
    setEditingProvider(null)
    setIsFormOpen(true)
  }

  const onFormSuccess = () => {
    setIsFormOpen(false)
    fetchProviders()
  }

  return (
    <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
      <Card className="bg-zinc-900 border-zinc-800 text-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg text-cyan-400">
              SMS Provider Configurations
            </CardTitle>
            <CardDescription className="text-sm text-zinc-400 mt-1">
              Manage and configure your SMS gateway providers.
            </CardDescription>
          </div>
          <DialogTrigger asChild>
            <Button
              size="sm"
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
              onClick={handleAddNew}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New Provider
            </Button>
          </DialogTrigger>
        </CardHeader>
        <CardContent>
          <SmsProviderList
            providers={providers}
            onEdit={handleEdit}
            onDelete={fetchProviders}
            onSetActive={fetchProviders}
          />
        </CardContent>
      </Card>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-cyan-400">
            {editingProvider ? "Edit Provider" : "Add New Provider"}
          </DialogTitle>
          <DialogDescription>
            Fill in the details for your SMS provider. Credentials are encrypted and stored securely.
          </DialogDescription>
        </DialogHeader>
        <SmsProviderForm
          provider={editingProvider}
          onSuccess={onFormSuccess}
          onCancel={() => setIsFormOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}