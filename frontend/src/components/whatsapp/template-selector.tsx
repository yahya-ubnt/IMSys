"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/components/auth-provider"
import { getWhatsAppTemplates } from "@/services/whatsappService"

export function TemplateSelector({ onTemplateChange, onVariablesChange }) {
  const { token } = useAuth()
  const [templates, setTemplates] = useState([])
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [variableValues, setVariableValues] = useState({})

  useEffect(() => {
    const fetchTemplates = async () => {
      if (token) {
        const data = await getWhatsAppTemplates(token)
        setTemplates(data)
      }
    }
    fetchTemplates()
  }, [token])

  const handleTemplateSelect = (templateId) => {
    const template = templates.find(t => t._id === templateId)
    setSelectedTemplate(template)
    onTemplateChange(template)
    // Reset variables when template changes
    setVariableValues({})
    onVariablesChange({})
  }

  const handleVariableChange = (variable, value) => {
    const newValues = { ...variableValues, [variable]: value }
    setVariableValues(newValues)
    onVariablesChange(newValues)
  }

  // Simple regex to find {{...}} placeholders in the template body
  const getVariablesFromTemplate = (body) => {
    return body.match(/{{([a-zA-Z0-9_]+)}}/g) || []
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Select Template</Label>
        <Select onValueChange={handleTemplateSelect}>
          <SelectTrigger className="bg-zinc-800 border-zinc-700">
            <SelectValue placeholder="Choose a WhatsApp template" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-800 text-white border-zinc-700">
            {templates.map(template => (
              <SelectItem key={template._id} value={template._id}>
                {template.templateName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedTemplate && (
        <div className="pt-4 border-t border-zinc-800 space-y-4">
          <h4 className="font-semibold text-cyan-400">Fill in Variables</h4>
          {getVariablesFromTemplate(selectedTemplate.body).map((variable, index) => {
            const varName = variable.replace(/{{|}}/g, "")
            return (
              <div key={index} className="space-y-2">
                <Label htmlFor={varName} className="capitalize">{varName.replace(/_/g, " ")}</Label>
                <Input
                  id={varName}
                  placeholder={`Value for ${variable}`}
                  onChange={(e) => handleVariableChange(index + 1, e.target.value)} // WhatsApp templates use {{1}}, {{2}}
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
            )
          })}
          {getVariablesFromTemplate(selectedTemplate.body).length === 0 && (
            <p className="text-sm text-zinc-500">This template has no variables to fill.</p>
          )}
        </div>
      )}
    </div>
  )
}