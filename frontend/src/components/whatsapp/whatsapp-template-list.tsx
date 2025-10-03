"use client"

import { DataTable } from "@/components/data-table"
import { columns } from "@/app/whatsapp/templates/columns"
import { useToast } from "@/components/ui/use-toast"
import { deleteWhatsAppTemplate } from "@/services/whatsappService"
import { useAuth } from "@/components/auth-provider"

export function WhatsAppTemplateList({ templates, onEdit, onDelete }) {
  const { toast } = useToast()
  const { token } = useAuth()

  const handleDelete = async (template) => {
    if (window.confirm(`Are you sure you want to delete the template "${template.templateName}"?`)) {
      try {
        await deleteWhatsAppTemplate(template._id, token)
        toast({ title: "Success", description: "Template deleted." })
        onDelete()
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete template.",
          variant: "destructive",
        })
      }
    }
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-zinc-800 rounded-lg">
        <h3 className="text-lg font-medium text-zinc-300">No WhatsApp Templates Found</h3>
        <p className="text-sm text-zinc-500 mt-2">
          Click the "Add New Template" button to create your first one.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-zinc-900/50 backdrop-blur-lg border border-zinc-800 shadow-2xl shadow-cyan-500/10 rounded-xl p-4">
      <DataTable 
        columns={columns({ handleEdit: onEdit, handleDelete })} 
        data={templates} 
        filterColumn="templateName"
      />
    </div>
  )
}