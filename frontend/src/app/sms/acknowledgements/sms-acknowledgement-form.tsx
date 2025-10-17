"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

// Assuming SmsTemplate type is available or defined elsewhere
type SmsTemplate = {
  _id: string;
  name: string;
};

interface TriggerType {
  id: string;
  name: string;
}

export type SmsAcknowledgementFormData = {
  triggerType: string
  description?: string
  smsTemplate: string
  status: "Active" | "Inactive"
}

interface SmsAcknowledgementFormProps {
  onClose: () => void
  onSubmit: (data: SmsAcknowledgementFormData) => void
  initialData: { triggerType: string; description?: string; smsTemplate: string; status: "Active" | "Inactive" } | null
}

export function SmsAcknowledgementForm({ onClose, onSubmit, initialData }: SmsAcknowledgementFormProps) {
  const [formData, setFormData] = useState<SmsAcknowledgementFormData>({ triggerType: "", description: "", smsTemplate: "", status: "Active" })
  const [smsTemplates, setSmsTemplates] = useState<SmsTemplate[]>([])
  const [triggerTypes, setTriggerTypes] = useState<TriggerType[]>([])

  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
    } else {
      setFormData({ triggerType: "", description: "", smsTemplate: "", status: "Active" })
    }
  }, [initialData])

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const token = localStorage.getItem("token")
        if (!token) throw new Error("No token found")
        const response = await fetch("/api/smstemplates", { 
          headers: { "Authorization": `Bearer ${token}` } 
        })
        if (!response.ok) throw new Error("Failed to fetch templates")
        setSmsTemplates(await response.json())
      } catch (error) {
        console.error("Error fetching templates:", error)
      }
    }
    fetchTemplates()
  }, [])

  useEffect(() => {
    const fetchTriggerTypes = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token found");
        const response = await fetch("/api/sms/triggers", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!response.ok) throw new Error("Failed to fetch trigger types");
        setTriggerTypes(await response.json());
      } catch (error) {
        console.error("Error fetching trigger types:", error);
      }
    };
    fetchTriggerTypes();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label htmlFor="triggerType" className="text-zinc-300">Trigger Type</Label>
        <Select
          value={formData.triggerType}
          onValueChange={(value) => setFormData({ ...formData, triggerType: value })}
        >
          <SelectTrigger className="bg-zinc-800 border-zinc-700 focus:ring-cyan-500">
            <SelectValue placeholder="Select a trigger type" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
            {triggerTypes.map((type) => (
              <SelectItem key={type.id} value={type.id} className="focus:bg-zinc-800">{type.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description" className="text-zinc-300">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          placeholder="A brief description of what this acknowledgement does..."
          className="bg-zinc-800 border-zinc-700 focus:ring-cyan-500"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="smsTemplate" className="text-zinc-300">SMS Template</Label>
        <Select
          value={formData.smsTemplate}
          onValueChange={(value) => setFormData({ ...formData, smsTemplate: value })}
        >
          <SelectTrigger className="bg-zinc-800 border-zinc-700 focus:ring-cyan-500">
            <SelectValue placeholder="Select a template" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
            {smsTemplates.map((template) => (
              <SelectItem key={template._id} value={template._id} className="focus:bg-zinc-800">{template.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="status" className="text-zinc-300">Status</Label>
        <Select
          value={formData.status}
          onValueChange={(value) => setFormData({ ...formData, status: value as "Active" | "Inactive" })}
        >
          <SelectTrigger className="bg-zinc-800 border-zinc-700 focus:ring-cyan-500">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
            <SelectItem value="Active" className="focus:bg-zinc-800">Active</SelectItem>
            <SelectItem value="Inactive" className="focus:bg-zinc-800">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose} className="bg-transparent border-zinc-700 hover:bg-zinc-800">Cancel</Button>
        <Button type="submit" className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white">Save Acknowledgement</Button>
      </div>
    </form>
  )
}