"use client"

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { deleteWhatsAppTemplate } from "@/services/whatsappService"
import { useAuth } from "@/components/auth-provider"

export function WhatsAppTemplateList({ templates, onEdit, onDelete }) {
  const { toast } = useToast()
  const { token } = useAuth()

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this template?")) {
      try {
        await deleteWhatsAppTemplate(id, token)
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
    <div className="border border-zinc-800 rounded-lg">
      <Table>
        <TableHeader>
          <TableRow className="border-zinc-800">
            <TableHead className="text-zinc-300">Template Name</TableHead>
            <TableHead className="text-zinc-300">Provider Template ID</TableHead>
            <TableHead className="text-zinc-300">Body</TableHead>
            <TableHead className="text-right text-zinc-300">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {templates.map((template) => (
            <TableRow key={template._id} className="border-zinc-800">
              <TableCell>{template.templateName}</TableCell>
              <TableCell className="font-mono text-xs">{template.providerTemplateId}</TableCell>
              <TableCell className="text-sm text-zinc-400 truncate max-w-xs">{template.body}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-zinc-800 text-white border-zinc-700">
                    <DropdownMenuItem onClick={() => onEdit(template)}>
                      <Edit className="mr-2 h-4 w-4" />
                      <span>Edit</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDelete(template._id)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}