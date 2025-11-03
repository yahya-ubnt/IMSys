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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Save, Loader2 } from "lucide-react";

interface HotspotPlan {
  _id: string;
  name: string;
  price: number;
  timeLimitValue: number;
  timeLimitUnit: string;
  dataLimitValue: number;
  dataLimitUnit: string;
  sharedUsers: number;
  profile: string;
  server: string;
  rateLimit?: string;
  mikrotikRouter: {
    _id: string;
    name: string;
  };
}

export type HotspotPlanFormData = Omit<HotspotPlan, '_id' | 'mikrotikRouter'>;

interface HotspotPlanFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: HotspotPlanFormData) => void
  initialData: HotspotPlan | null
  isSubmitting: boolean
}

export function HotspotPlanForm({ isOpen, onClose, onSubmit, initialData, isSubmitting }: HotspotPlanFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<HotspotPlanFormData>({
    name: "",
    price: 0,
    timeLimitValue: 1,
    timeLimitUnit: "hours",
    dataLimitValue: 0,
    dataLimitUnit: "GB",
    sharedUsers: 1,
    profile: "",
    server: "",
    rateLimit: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        price: initialData.price,
        timeLimitValue: initialData.timeLimitValue,
        timeLimitUnit: initialData.timeLimitUnit,
        dataLimitValue: initialData.dataLimitValue,
        dataLimitUnit: initialData.dataLimitUnit,
        sharedUsers: initialData.sharedUsers,
        profile: initialData.profile,
        server: initialData.server,
        rateLimit: initialData.rateLimit || "",
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
          <DialogTitle className="text-lg font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">{initialData ? "Edit Hotspot Plan" : "Create New Hotspot Plan"}</DialogTitle>
          <DialogDescription className="text-zinc-400">
            {initialData ? "Update the details for this plan." : "Fill out the form to add a new plan."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
            <div className="p-5 space-y-3">
                <div className="space-y-1"><Label className="text-xs">Name</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><Label className="text-xs">Price</Label><Input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })} required className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
                    <div className="space-y-1"><Label className="text-xs">Shared Users</Label><Input type="number" value={formData.sharedUsers} onChange={(e) => setFormData({ ...formData, sharedUsers: parseInt(e.target.value) })} required className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
                </div>
                <div className="space-y-1"><Label className="text-xs">Time Limit</Label><div className="flex gap-2"><Input type="number" value={formData.timeLimitValue} onChange={(e) => setFormData({ ...formData, timeLimitValue: parseInt(e.target.value) })} required className="h-9 bg-zinc-800 border-zinc-700 text-sm" /><Select onValueChange={(v) => setFormData({ ...formData, timeLimitUnit: v})} value={formData.timeLimitUnit}><SelectTrigger className="bg-zinc-800 border-zinc-700 h-9 text-sm w-[120px]"><SelectValue /></SelectTrigger><SelectContent className="bg-zinc-800 text-white border-zinc-700"><SelectItem value="minutes">Minutes</SelectItem><SelectItem value="hours">Hours</SelectItem><SelectItem value="days">Days</SelectItem></SelectContent></Select></div></div>
                <div className="space-y-1"><Label className="text-xs">Data Limit</Label><div className="flex gap-2"><Input type="number" value={formData.dataLimitValue} onChange={(e) => setFormData({ ...formData, dataLimitValue: parseInt(e.target.value) })} required className="h-9 bg-zinc-800 border-zinc-700 text-sm" /><Select onValueChange={(v) => setFormData({ ...formData, dataLimitUnit: v})} value={formData.dataLimitUnit}><SelectTrigger className="bg-zinc-800 border-zinc-700 h-9 text-sm w-[120px]"><SelectValue /></SelectTrigger><SelectContent className="bg-zinc-800 text-white border-zinc-700"><SelectItem value="MB">MB</SelectItem><SelectItem value="GB">GB</SelectItem></SelectContent></Select></div></div>
                <div className="space-y-1"><Label className="text-xs">Rate Limit</Label><Input value={formData.rateLimit} onChange={(e) => setFormData({ ...formData, rateLimit: e.target.value })} className="h-9 bg-zinc-800 border-zinc-700 text-sm" placeholder="e.g., 512k/1M"/></div>
            </div>
            <DialogFooter className="p-4 flex items-center justify-end border-t border-zinc-800">
                <Button type="submit" size="sm" disabled={isSubmitting} className="bg-gradient-to-r from-blue-600 to-cyan-500">{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}{isSubmitting ? "Saving..." : "Save Changes"}</Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
