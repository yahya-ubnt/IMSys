"use client"

import { useState, useEffect } from "react"
import { PlusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  const { token } = useAuth() // Assuming useAuth provides the token

  useEffect(() => {
    if (token) {
      fetchProviders()
    }
  }, [token])

  const fetchProviders = async () => {
    try {
      const data = await getSmsProviders(token)
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
    <Card className="bg-zinc-900 border-zinc-800 text-white">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg text-cyan-400">
            SMS Provider Configurations
          </CardTitle>
          <p className="text-sm text-zinc-400 mt-1">
            Manage and configure your SMS gateway providers.
          </p>
        </div>
        <Button
          size="sm"
          className="bg-cyan-500 hover:bg-cyan-600 text-white"
          onClick={handleAddNew}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Provider
        </Button>
      </CardHeader>
      <CardContent>
        {isFormOpen ? (
          <SmsProviderForm
            provider={editingProvider}
            onSuccess={onFormSuccess}
            onCancel={() => setIsFormOpen(false)}
          />
        ) : (
          <SmsProviderList
            providers={providers}
            onEdit={handleEdit}
            onDelete={fetchProviders} // Refresh list on delete
            onSetActive={fetchProviders} // Refresh list on activation
          />
        )}
      </CardContent>
    </Card>
  )
}