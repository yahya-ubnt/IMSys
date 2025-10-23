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
import { WhatsAppProviderList } from "@/components/settings/whatsapp-provider-list"
import { WhatsAppProviderForm } from "@/components/settings/whatsapp-provider-form"
import { getWhatsAppProviders } from "@/services/settingsService"

export default function WhatsAppSettingsPage() {
  const [providers, setProviders] = useState([])
  const [editingProvider, setEditingProvider] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchProviders()
  }, [])

  const fetchProviders = async () => {
    try {
      const data = await getWhatsAppProviders()
      setProviders(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch WhatsApp providers.",
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
              WhatsApp Provider Configurations
            </CardTitle>
            <CardDescription className="text-sm text-zinc-400 mt-1">
              Manage your WhatsApp Business Solution Providers (BSPs).
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
          <WhatsAppProviderList providers={providers} onEdit={handleEdit} onDelete={fetchProviders} onSetActive={fetchProviders} />
        </CardContent>
      </Card>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-cyan-400">
            {editingProvider ? "Edit Provider" : "Add New Provider"}
          </DialogTitle>
          <DialogDescription>
            Fill in the details for your WhatsApp provider. Credentials are encrypted.
          </DialogDescription>
        </DialogHeader>
        <WhatsAppProviderForm provider={editingProvider} onSuccess={onFormSuccess} onCancel={() => setIsFormOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}