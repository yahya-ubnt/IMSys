"use client"

import { Badge } from "@/components/ui/badge"
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
import { MoreHorizontal, Edit, Trash2, CheckCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { setActiveSmsProvider, deleteSmsProvider } from "@/services/settingsService"
import { useAuth } from "@/components/auth-provider"

export function SmsProviderList({ providers, onEdit, onDelete, onSetActive }) {
  const { toast } = useToast()
  const { token } = useAuth()

  const handleSetActive = async (id) => {
    try {
      await setActiveSmsProvider(id, token)
      toast({ title: "Success", description: "Provider set to active." })
      onSetActive()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to set active provider.",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this provider?")) {
      try {
        await deleteSmsProvider(id, token)
        toast({ title: "Success", description: "Provider deleted." })
        onDelete()
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete provider.",
          variant: "destructive",
        })
      }
    }
  }

  return (
    <div className="border border-zinc-800 rounded-lg">
      <Table>
        <TableHeader>
          <TableRow className="border-zinc-800">
            <TableHead className="text-zinc-300">Name</TableHead>
            <TableHead className="text-zinc-300">Provider Type</TableHead>
            <TableHead className="text-zinc-300">Status</TableHead>
            <TableHead className="text-right text-zinc-300">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {providers.map((provider) => (
            <TableRow key={provider._id} className="border-zinc-800">
              <TableCell>{provider.name}</TableCell>
              <TableCell className="capitalize">
                {provider.providerType.replace("_", " ")}
              </TableCell>
              <TableCell>
                {provider.isActive ? (
                  <Badge className="bg-green-600 text-white">Active</Badge>
                ) : (
                  <Badge variant="outline" className="border-zinc-600 text-zinc-300">
                    Inactive
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-zinc-800 text-white border-zinc-700">
                    <DropdownMenuItem onClick={() => onEdit(provider)}>
                      <Edit className="mr-2 h-4 w-4" />
                      <span>Edit</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDelete(provider._id)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Delete</span>
                    </DropdownMenuItem>
                    {!provider.isActive && (
                       <DropdownMenuItem onClick={() => handleSetActive(provider._id)}>
                         <CheckCircle className="mr-2 h-4 w-4" />
                         <span>Set Active</span>
                       </DropdownMenuItem>
                    )}
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