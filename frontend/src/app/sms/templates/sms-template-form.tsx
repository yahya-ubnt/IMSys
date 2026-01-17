"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SmsTemplate } from "@/types/sms"

export type SmsTemplateFormData = {
  name: string
  messageBody: string
}

interface SmsTemplateFormProps {
  onClose: () => void
  onSubmit: (data: SmsTemplateFormData) => void
  initialData: SmsTemplate | null
}

export function SmsTemplateForm({ onClose, onSubmit, initialData }: SmsTemplateFormProps) {
  const [formData, setFormData] = useState<SmsTemplateFormData>({ name: "", messageBody: "" })

  useEffect(() => {
    if (initialData) {
      setFormData({ name: initialData.name, messageBody: initialData.messageBody })
    } else {
      setFormData({ name: "", messageBody: "" })
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
        <Label htmlFor="name" className="text-zinc-300">Template Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Welcome Message"
          className="bg-zinc-800 border-zinc-700 focus:ring-cyan-500"
        />
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
          {["officialName", "username", "mPesaRefNo", "mobileNumber", "expiryDate", "walletBalance"].map(v => (
            <Button key={v} type="button" variant="outline" size="sm" onClick={() => handleInsertVariable(v)} className="bg-zinc-700 border-zinc-600 hover:bg-zinc-600">
              {v.replace(/_/g, ' ')}
            </Button>
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose} className="bg-transparent border-zinc-700 hover:bg-zinc-800">Cancel</Button>
        <Button type="submit" className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white">Save Template</Button>
      </div>
    </form>
  )
}