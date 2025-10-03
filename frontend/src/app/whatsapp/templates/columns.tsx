"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export type WhatsAppTemplate = {
  _id: string
  templateName: string
  providerTemplateId: string
  body: string
}

export const columns = ({ handleEdit, handleDelete }: { handleEdit: (template: WhatsAppTemplate) => void, handleDelete: (template: WhatsAppTemplate) => void }): ColumnDef<WhatsAppTemplate>[] => [
  {
    accessorKey: "templateName",
    header: "Template Name",
    cell: ({ row }) => <div className="font-medium">{row.original.templateName}</div>,
  },
  {
    accessorKey: "providerTemplateId",
    header: "Provider Template ID",
    cell: ({ row }) => <div className="font-mono text-xs text-cyan-400">{row.original.providerTemplateId}</div>,
  },
  {
    accessorKey: "body",
    header: "Body",
    cell: ({ row }) => (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <p className="truncate max-w-md">{row.original.body}</p>
          </TooltipTrigger>
          <TooltipContent className="bg-zinc-800 text-white border-zinc-700 max-w-lg">
            <p>{row.original.body}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const template = row.original
      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-zinc-800 text-white border-zinc-700">
              <DropdownMenuItem onClick={() => handleEdit(template)}>
                <Edit className="mr-2 h-4 w-4" />
                <span>Edit</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDelete(template)} className="text-red-400">
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
  },
]