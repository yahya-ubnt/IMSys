"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { SmsLog } from "@/app/sms/sent/page"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle } from "lucide-react"
import { Label } from "@/components/ui/label"

interface SmsDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  sms: SmsLog | null
}

export function SmsDetailsModal({ isOpen, onClose, sms }: SmsDetailsModalProps) {
  if (!sms) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md min-h-[300px] bg-zinc-900 text-white border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-cyan-400">SMS Details</DialogTitle>
          <DialogDescription>
            Details for the selected SMS message.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right text-zinc-400">Recipient:</Label>
            <p className="col-span-3">{sms.mobileNumber}</p>
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right text-zinc-400">Message:</Label>
            <p className="col-span-3 break-words">{sms.message}</p>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right text-zinc-400">Type:</Label>
            <p className="col-span-3">{sms.messageType}</p>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right text-zinc-400">Status:</Label>
            <div className="col-span-3">
              {sms.smsStatus === "Success" ? (
                <Badge variant="outline" className="bg-green-600/20 text-green-400 border-green-600/30">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Success
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-red-600/20 text-red-400 border-red-600/30">
                  <XCircle className="mr-2 h-4 w-4" />
                  Failed
                </Badge>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose} variant="outline">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}