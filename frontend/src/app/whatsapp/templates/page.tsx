"use client"

import { useState, useEffect } from "react"
import { PlusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
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
import { Topbar } from "@/components/topbar"
import { WhatsAppTemplateList } from "@/components/whatsapp/whatsapp-template-list"
import { WhatsAppTemplateForm } from "@/components/whatsapp/whatsapp-template-form"
import { getSmsTemplates } from "@/services/smsTemplateService";
import { getWhatsAppTemplates } from "@/services/whatsappService"
import { columns } from "./columns"

export default function WhatsAppTemplatesPage() {
  const [templates, setTemplates] = useState([])
  const [smsTemplates, setSmsTemplates] = useState([])
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const [whatsappData, smsData] = await Promise.all([
        getWhatsAppTemplates(),
        getSmsTemplates()
      ]);
      setTemplates(whatsappData);
      setSmsTemplates(smsData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch templates.",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (template) => {
    setEditingTemplate(template)
    setIsFormOpen(true)
  }

  const handleAddNew = () => {
    setEditingTemplate(null)
    setIsFormOpen(true)
  }

  const onFormSuccess = () => {
    setIsFormOpen(false)
    fetchTemplates()
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar />
      <div className="flex-1 p-6 space-y-6">
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                WhatsApp Message Templates
              </h1>
              <p className="text-sm text-zinc-400">
                Manage your pre-approved WhatsApp message templates.
              </p>
            </div>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="bg-cyan-500 hover:bg-cyan-600 text-white"
                onClick={handleAddNew}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Template
              </Button>
            </DialogTrigger>
          </div>
          
          <WhatsAppTemplateList templates={templates} onEdit={handleEdit} onDelete={fetchTemplates} />

          <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
            <DialogHeader>
              <DialogTitle className="text-cyan-400">
                {editingTemplate ? "Edit Template" : "Add New Template"}
              </DialogTitle>
              <DialogDescription>
                Provide the details for your WhatsApp message template.
              </DialogDescription>
            </DialogHeader>
            <WhatsAppTemplateForm template={editingTemplate} smsTemplates={smsTemplates} onSuccess={onFormSuccess} onCancel={() => setIsFormOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}