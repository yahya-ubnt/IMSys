"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { SmsExpirySchedule } from "./page"

export type SmsExpiryScheduleFormData = {
  name: string
  days: number
  timing: "Before" | "After" | "Not Applicable"
  messageBody: string
  status: "Active" | "Inactive"
}

interface SmsExpiryScheduleFormProps {
  onClose: () => void
  onSubmit: (data: SmsExpiryScheduleFormData) => void
  initialData: SmsExpirySchedule | null
}

export function SmsExpiryScheduleForm({ onClose, onSubmit, initialData }: SmsExpiryScheduleFormProps) {
  const [formData, setFormData] = useState<SmsExpiryScheduleFormData>({ name: "", days: 1, timing: "Before", messageBody: "", status: "Active" })

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        days: initialData.days,
        timing: initialData.timing,
        messageBody: initialData.messageBody,
        status: initialData.status,
      })
    } else {
      setFormData({ name: "", days: 1, timing: "Before", messageBody: "", status: "Active" })
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
        <Label htmlFor="name" className="text-zinc-300">Schedule Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., 3 Days Before Expiry"
          className="bg-zinc-800 border-zinc-700 focus:ring-cyan-500"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="days" className="text-zinc-300">Days</Label>
          <Input
            id="days"
            type="number"
            value={formData.days}
            onChange={(e) => setFormData({ ...formData, days: parseInt(e.target.value) || 1 })}
            className="bg-zinc-800 border-zinc-700 focus:ring-cyan-500"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="timing" className="text-zinc-300">Timing</Label>
          <Select
            value={formData.timing}
            onValueChange={(value) => setFormData({ ...formData, timing: value as "Before" | "After" | "Not Applicable" })}
          >
            <SelectTrigger className="bg-zinc-800 border-zinc-700 focus:ring-cyan-500">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
              <SelectItem value="Before" className="focus:bg-zinc-800">Before</SelectItem>
              <SelectItem value="After" className="focus:bg-zinc-800">After</SelectItem>
              <SelectItem value="Not Applicable" className="focus:bg-zinc-800">Not Applicable</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="messageBody" className="text-zinc-300">Message Body</Label>
        <Textarea
          id="messageBody"
          value={formData.messageBody}
          onChange={(e) => setFormData({ ...formData, messageBody: e.target.value })}
          rows={5}
          placeholder="Type your message here..."
          className="bg-zinc-800 border-zinc-700 focus:ring-cyan-500"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-zinc-300">Insert Variables</Label>
        <div className="flex flex-wrap gap-2">
          {["customer_name", "reference_number", "customer_phone", "amount", "expiry_date"].map(v => (
            <Button key={v} type="button" variant="outline" size="sm" onClick={() => handleInsertVariable(v)} className="bg-zinc-700 border-zinc-600 hover:bg-zinc-600">
              {v.replace(/_/g, ' ')}
            </Button>
          ))}
        </div>
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
        <Button type="submit" className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white">Save Schedule</Button>
      </div>
    </form>
  )
}