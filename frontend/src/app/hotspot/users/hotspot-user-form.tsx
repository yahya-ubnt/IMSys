"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Save, Loader2 } from "lucide-react";

import { HotspotUser } from "@/types/hotspot";

export type HotspotUserFormData = Omit<HotspotUser, '_id'>;

interface HotspotUserFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: HotspotUserFormData) => void
  initialData: HotspotUser | null
  isSubmitting: boolean
}

export function HotspotUserForm({ isOpen, onClose, onSubmit, initialData, isSubmitting }: HotspotUserFormProps) {
  const [formData, setFormData] = useState<HotspotUserFormData>({
    officialName: "",
    email: "",
    location: "",
    hotspotName: "",
    hotspotPassword: "",
    phoneNumber: "",
    referenceNumber: "",
    billAmount: 0,
    installationFee: 0,
    billingCycleValue: 1,
    billingCycleUnit: "months",
    expiryDate: "",
    expiryTime: "",
    profile: "",
    server: "",
    mikrotikRouter: {
      _id: "",
      name: "",
    },
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        officialName: initialData.officialName,
        email: initialData.email,
        location: initialData.location,
        hotspotName: initialData.hotspotName,
        phoneNumber: initialData.phoneNumber,
        referenceNumber: initialData.referenceNumber,
        billAmount: initialData.billAmount,
        installationFee: initialData.installationFee,
        billingCycleValue: initialData.billingCycleValue,
        billingCycleUnit: initialData.billingCycleUnit,
        expiryDate: new Date(initialData.expiryDate).toISOString().split('T')[0],
        expiryTime: initialData.expiryTime,
        profile: initialData.profile,
        server: initialData.server,
        mikrotikRouter: initialData.mikrotikRouter,
      });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-zinc-900/50 backdrop-blur-lg border-zinc-700 text-white shadow-2xl shadow-blue-500/10 rounded-xl">
        <DialogHeader className="p-4 border-b border-zinc-800">
          <DialogTitle className="text-lg font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">{initialData ? "Edit Hotspot User" : "Create New Hotspot User"}</DialogTitle>
          <DialogDescription className="text-zinc-400">
            {initialData ? "Update the details for this user." : "Fill out the form to add a new user."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs">Official Name</Label><Input value={formData.officialName} onChange={(e) => setFormData({ ...formData, officialName: e.target.value })} required className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
                <div className="space-y-1"><Label className="text-xs">Email</Label><Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
                <div className="space-y-1"><Label className="text-xs">Location</Label><Input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
                <div className="space-y-1"><Label className="text-xs">Hotspot Username</Label><Input value={formData.hotspotName} onChange={(e) => setFormData({ ...formData, hotspotName: e.target.value })} required className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
                <div className="space-y-1"><Label className="text-xs">Hotspot Password</Label><Input value={formData.hotspotPassword} onChange={(e) => setFormData({ ...formData, hotspotPassword: e.target.value })} className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
                <div className="space-y-1"><Label className="text-xs">Phone Number</Label><Input value={formData.phoneNumber} onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })} required className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
                <div className="space-y-1"><Label className="text-xs">Reference Number</Label><Input value={formData.referenceNumber} onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })} required className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
                <div className="space-y-1"><Label className="text-xs">Bill Amount</Label><Input type="number" value={formData.billAmount} onChange={(e) => setFormData({ ...formData, billAmount: parseFloat(e.target.value) })} required className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
                <div className="space-y-1"><Label className="text-xs">Installation Fee</Label><Input type="number" value={formData.installationFee} onChange={(e) => setFormData({ ...formData, installationFee: parseFloat(e.target.value) })} className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
                <div className="space-y-1"><Label className="text-xs">Expiry Date</Label><Input type="date" value={formData.expiryDate} onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })} required className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
                <div className="space-y-1"><Label className="text-xs">Expiry Time</Label><Input type="time" value={formData.expiryTime} onChange={(e) => setFormData({ ...formData, expiryTime: e.target.value })} required className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
            </div>
            <DialogFooter className="p-4 flex items-center justify-end border-t border-zinc-800">
                <Button type="submit" size="sm" disabled={isSubmitting} className="bg-gradient-to-r from-blue-600 to-cyan-500">{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}{isSubmitting ? "Saving..." : "Save Changes"}</Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
