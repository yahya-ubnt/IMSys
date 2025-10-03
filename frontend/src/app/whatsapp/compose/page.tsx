"use client"

import { useState, useEffect } from "react"
import { Topbar } from "@/components/topbar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import { Send } from "lucide-react"
import { AudienceSelector } from "@/components/whatsapp/audience-selector"
import { TemplateSelector } from "@/components/whatsapp/template-selector"
import { composeWhatsApp } from "@/services/whatsappService"

export default function WhatsAppComposePage() {
  const { toast } = useToast()
  const { token } = useAuth()
  const [audience, setAudience] = useState(null)
  const [template, setTemplate] = useState(null)
  const [variables, setVariables] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSend = async () => {
    // Validation
    if (!audience || !template) {
      toast({ title: "Error", description: "Please select an audience and a template.", variant: "destructive" })
      return
    }
    
    setIsSubmitting(true)
    try {
      const payload = {
        ...audience,
        templateId: template._id,
        variables,
      }
      await composeWhatsApp(payload, token)
      toast({ title: "Success", description: "WhatsApp message sending process initiated." })
      // Reset form
      setAudience(null)
      setTemplate(null)
      setVariables({})
    } catch (error) {
      toast({ title: "Error", description: error.message || "Failed to send message.", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar />
      <main className="flex-1 p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
            Compose WhatsApp Message
          </h1>
          <p className="text-sm text-zinc-400">Send templated messages to your users.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Audience Selector Card */}
            <Card className="bg-zinc-900/50 border-zinc-800 text-white">
              <CardHeader>
                <CardTitle>1. Select Audience</CardTitle>
                <CardDescription>Choose who will receive this message.</CardDescription>
              </CardHeader>
              <CardContent>
                <AudienceSelector onAudienceChange={setAudience} />
              </CardContent>
            </Card>

            {/* Template Selector Card */}
            <Card className="bg-zinc-900/50 border-zinc-800 text-white">
              <CardHeader>
                <CardTitle>2. Select Template & Fill Variables</CardTitle>
                <CardDescription>Choose a pre-approved template and provide its dynamic content.</CardDescription>
              </CardHeader>
              <CardContent>
                <TemplateSelector onTemplateChange={setTemplate} onVariablesChange={setVariables} />
              </CardContent>
            </Card>
          </div>

          {/* Summary and Send Card */}
          <div className="lg:col-span-1">
            <Card className="bg-zinc-900/50 border-zinc-800 text-white sticky top-24">
              <CardHeader>
                <CardTitle>3. Review & Send</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm">
                  <div>
                    <h4 className="font-semibold text-zinc-400">Audience:</h4>
                    <p className="text-zinc-300">{audience ? `Type: ${audience.sendToType}` : "Not selected"}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-zinc-400">Template:</h4>
                    <p className="text-zinc-300">{template ? template.templateName : "Not selected"}</p>
                  </div>
                </div>
                <Button 
                  onClick={handleSend} 
                  disabled={isSubmitting || !audience || !template}
                  className="w-full mt-6 bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg transition-all duration-300 hover:scale-105"
                >
                  <Send className="mr-2 h-4 w-4" />
                  {isSubmitting ? "Sending..." : "Send Message"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}