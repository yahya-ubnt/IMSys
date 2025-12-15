"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Loader2 } from "lucide-react";

interface MikrotikRouter {
  _id: string;
  name: string;
}

interface VoucherFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { quantity: number; withPassword: boolean; server: string; profile: string; dataLimitValue: number; dataLimitUnit: string; timeLimitValue: number; timeLimitUnit: string; nameLength: number; price: number; mikrotikRouter: string; }) => void;
  isSubmitting: boolean;
}

export function VoucherForm({ isOpen, onClose, onSubmit, isSubmitting }: VoucherFormProps) {
  const { toast } = useToast();
  const [quantity, setQuantity] = useState("1");
  const [withPassword, setWithPassword] = useState("yes");
  const [server, setServer] = useState("");
  const [profile, setProfile] = useState("");
  const [dataLimitValue, setDataLimitValue] = useState("0");
  const [dataLimitUnit, setDataLimitUnit] = useState("GB");
  const [timeLimitValue, setTimeLimitValue] = useState("1");
  const [timeLimitUnit, setTimeLimitUnit] = useState("hours");
  const [nameLength, setNameLength] = useState("6");
  const [price, setPrice] = useState("");
  const [mikrotikRouterId, setMikrotikRouterId] = useState("");

  const [routers, setRouters] = useState<MikrotikRouter[]>([]);
  const [hotspotProfiles, setHotspotProfiles] = useState<string[]>([]);
  const [hotspotServers, setHotspotServers] = useState<string[]>([]);
  const [routersLoading, setRoutersLoading] = useState(true);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [serversLoading, setServersLoading] = useState(false);

  useEffect(() => {
    const fetchRouters = async () => {
      try {
        const response = await fetch("/api/mikrotik/routers");
        if (!response.ok) throw new Error("Failed to fetch routers");
        setRouters(await response.json());
      } catch {
        toast({ title: "Error", description: "Failed to load routers.", variant: "destructive" });
      } finally {
        setRoutersLoading(false);
      }
    };
    if (isOpen) {
      fetchRouters();
    }
  }, [isOpen, toast]);

  useEffect(() => {
    const fetchHotspotData = async () => {
      if (!mikrotikRouterId) return;
      setProfilesLoading(true);
      setServersLoading(true);
      try {
        const [profilesRes, serversRes] = await Promise.all([
          fetch(`/api/mikrotik/routers/${mikrotikRouterId}/hotspot-profiles`),
          fetch(`/api/mikrotik/routers/${mikrotikRouterId}/hotspot-servers`),
        ]);
        if (!profilesRes.ok) throw new Error("Failed to fetch Hotspot profiles");
        if (!serversRes.ok) throw new Error("Failed to fetch Hotspot servers");
        setHotspotProfiles(await profilesRes.json());
        setHotspotServers(await serversRes.json());
      } catch {
        toast({ title: "Error", description: "Failed to load hotspot data.", variant: "destructive" });
      } finally {
        setProfilesLoading(false);
        setServersLoading(false);
      }
    };
    if (isOpen) {
      fetchHotspotData();
    }
  }, [isOpen, toast, mikrotikRouterId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const voucherData = { quantity: parseInt(quantity), withPassword: withPassword === "yes", server, profile, dataLimitValue: parseInt(dataLimitValue), dataLimitUnit, timeLimitValue: parseInt(timeLimitValue), timeLimitUnit, nameLength: parseInt(nameLength), price: parseFloat(price), mikrotikRouter: mikrotikRouterId };
    onSubmit(voucherData);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-zinc-900/50 backdrop-blur-lg border-zinc-700 text-white shadow-2xl shadow-blue-500/10 rounded-xl">
        <DialogHeader className="p-4 border-b border-zinc-800">
          <DialogTitle className="text-lg font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Generate Vouchers</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Fill out the form to generate a new batch of vouchers.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1"><Label className="text-xs">Mikrotik Router</Label><Select onValueChange={setMikrotikRouterId} value={mikrotikRouterId} disabled={routersLoading}><SelectTrigger className="bg-zinc-800 border-zinc-700 h-9 text-sm"><SelectValue placeholder="Select a router" /></SelectTrigger><SelectContent className="bg-zinc-800 text-white border-zinc-700">{routers.map(r => <SelectItem key={r._id} value={r._id} className="text-sm">{r.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1"><Label className="text-xs">Quantity</Label><Input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} required className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
            <div className="space-y-1"><Label className="text-xs">Create with Password</Label><Select onValueChange={setWithPassword} value={withPassword}><SelectTrigger className="bg-zinc-800 border-zinc-700 h-9 text-sm"><SelectValue /></SelectTrigger><SelectContent className="bg-zinc-800 text-white border-zinc-700"><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent></Select></div>
            <div className="space-y-1"><Label className="text-xs">Server</Label><Select onValueChange={setServer} value={server} disabled={serversLoading}><SelectTrigger className="bg-zinc-800 border-zinc-700 h-9 text-sm"><SelectValue placeholder="Select a server" /></SelectTrigger><SelectContent className="bg-zinc-800 text-white border-zinc-700">{hotspotServers.map(s => <SelectItem key={s} value={s} className="text-sm">{s}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1"><Label className="text-xs">Profile</Label><Select onValueChange={setProfile} value={profile} disabled={profilesLoading}><SelectTrigger className="bg-zinc-800 border-zinc-700 h-9 text-sm"><SelectValue placeholder="Select a profile" /></SelectTrigger><SelectContent className="bg-zinc-800 text-white border-zinc-700">{hotspotProfiles.map(p => <SelectItem key={p} value={p} className="text-sm">{p}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1"><Label className="text-xs">Data Limit</Label><div className="flex gap-2"><Input type="number" value={dataLimitValue} onChange={e => setDataLimitValue(e.target.value)} required className="h-9 bg-zinc-800 border-zinc-700 text-sm" /><Select onValueChange={setDataLimitUnit} value={dataLimitUnit}><SelectTrigger className="bg-zinc-800 border-zinc-700 h-9 text-sm w-[120px]"><SelectValue /></SelectTrigger><SelectContent className="bg-zinc-800 text-white border-zinc-700"><SelectItem value="MB">MB</SelectItem><SelectItem value="GB">GB</SelectItem></SelectContent></Select></div></div>
            <div className="space-y-1"><Label className="text-xs">Time Limit</Label><div className="flex gap-2"><Input type="number" value={timeLimitValue} onChange={e => setTimeLimitValue(e.target.value)} required className="h-9 bg-zinc-800 border-zinc-700 text-sm" /><Select onValueChange={setTimeLimitUnit} value={timeLimitUnit}><SelectTrigger className="bg-zinc-800 border-zinc-700 h-9 text-sm w-[120px]"><SelectValue /></SelectTrigger><SelectContent className="bg-zinc-800 text-white border-zinc-700"><SelectItem value="minutes">Minutes</SelectItem><SelectItem value="hours">Hours</SelectItem><SelectItem value="days">Days</SelectItem></SelectContent></Select></div></div>
            <div className="space-y-1"><Label className="text-xs">Name Length</Label><Select onValueChange={setNameLength} value={nameLength}><SelectTrigger className="bg-zinc-800 border-zinc-700 h-9 text-sm"><SelectValue /></SelectTrigger><SelectContent className="bg-zinc-800 text-white border-zinc-700">{[4,5,6,7,8,9].map(n => <SelectItem key={n} value={n.toString()}>{n}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1"><Label className="text-xs">Price</Label><Input type="number" value={price} onChange={e => setPrice(e.target.value)} required className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
          </div>
          <DialogFooter className="p-4 flex items-center justify-end border-t border-zinc-800">
            <Button type="submit" size="sm" disabled={isSubmitting} className="bg-gradient-to-r from-blue-600 to-cyan-500">{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}{isSubmitting ? "Generating..." : "Generate Vouchers"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
