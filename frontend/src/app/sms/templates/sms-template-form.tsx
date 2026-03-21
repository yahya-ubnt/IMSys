"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { SmsTemplate } from "@/types/sms"
import { getSmsTriggers } from "@/lib/api/sms"

export type SmsTemplateFormData = {
  triggerType: string
  messageBody: string
  status: 'Active' | 'Inactive'
}

interface SmsTemplateFormProps {
  onClose: () => void
  onSubmit: (data: SmsTemplateFormData) => void
  initialData: SmsTemplate | null
}

export function SmsTemplateForm({ onClose, onSubmit, initialData }: SmsTemplateFormProps) {
  const [formData, setFormData] = useState<SmsTemplateFormData>({ triggerType: "", messageBody: "", status: "Active" })
  const [triggers, setTriggers] = useState<{ id: string, name: string }[]>([])

  useEffect(() => {
    const fetchTriggers = async () => {
      try {
        const triggerData = await getSmsTriggers();
        setTriggers(triggerData);
      } catch (error) {
        console.error("Failed to fetch SMS triggers", error);
      }
    };
    fetchTriggers();
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        triggerType: initialData.triggerType,
        messageBody: initialData.messageBody,
        status: initialData.status || "Active",
      })
    } else {
      setFormData({ triggerType: "", messageBody: "", status: "Active" })
    }
  }, [initialData])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleInsertVariable = (variable: string) => {
    setFormData((prev) => ({ ...prev, messageBody: prev.messageBody + `{{${variable}}}` }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label htmlFor="triggerType" className="text-zinc-300">Trigger Type</Label>
        <Select
          value={formData.triggerType}
          onValueChange={(value) => setFormData({ ...formData, triggerType: value })}
          disabled={!!initialData} // Disable when editing
        >
          <SelectTrigger className="bg-zinc-800 border-zinc-700 focus:ring-cyan-500">
            <SelectValue placeholder="Select a trigger..." />
          </SelectTrigger>
          <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
            {triggers.map(trigger => (
              <SelectItem key={trigger.id} value={trigger.id}>{trigger.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="messageBody" className="text-zinc-300">Message Body</Label>
        <Textarea
          id="messageBody"
          value={formData.messageBody}
          onChange={(e) => setFormData({ ...formData, messageBody: e.target.value })}
          rows={6}
          placeholder="Type your message here..."
          className="bg-zinc-800 border-zinc-700 focus:ring-cyan-500"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-zinc-300">Insert Variables</Label>
        <div className="flex flex-wrap gap-2">
          {["officialName", "username", "mPesaRefNo", "mobileNumber", "expiryDate", "walletBalance", "amountPaid"].map(v => (
            <Button key={v} type="button" variant="outline" size="sm" onClick={() => handleInsertVariable(v)} className="bg-zinc-700 border-zinc-600 hover:bg-zinc-600">
              {v.replace(/_/g, ' ')}
            </Button>
          ))}
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="status"
          checked={formData.status === 'Active'}
          onCheckedChange={(checked) => setFormData({ ...formData, status: checked ? 'Active' : 'Inactive' })}
        />
        <Label htmlFor="status">Active</Label>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose} className="bg-transparent border-zinc-700 hover:bg-zinc-800">Cancel</Button>
        <Button type="submit" className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white">Save Template</Button>
      </div>
    </form>
  )
}
