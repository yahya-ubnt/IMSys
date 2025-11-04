"use client"

import { useEffect, useState, useCallback, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { getColumns } from "./columns.tsx";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { Topbar } from "@/components/topbar";

// TODO: Move to a types file
interface Voucher {
  _id: string;
  username: string;
  profile: string;
  price: number;
}

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isLoggingOut } = useAuth();
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

  const [routers, setRouters] = useState<any[]>([]);
  const [hotspotProfiles, setHotspotProfiles] = useState<string[]>([]);
  const [hotspotServers, setHotspotServers] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [routersLoading, setRoutersLoading] = useState(true);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [serversLoading, setServersLoading] = useState(false);

  const fetchVouchers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/hotspot/vouchers');
      if (!response.ok) throw new Error(`Failed to fetch vouchers: ${response.statusText}`);
      setVouchers(await response.json());
    } catch (err: unknown) {
      setError((err instanceof Error) ? err.message : 'Failed to fetch vouchers');
    }
    finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoggingOut) { setLoading(false); return; }
    fetchVouchers();
  }, [fetchVouchers, isLoggingOut]);

  useEffect(() => {
    const fetchRouters = async () => {
        try {
            const response = await fetch("/api/mikrotik/routers");
            if (!response.ok) throw new Error("Failed to fetch routers");
            setRouters(await response.json());
        } catch (err) {
            toast({ title: "Error", description: "Failed to load routers.", variant: "destructive" });
        } finally {
            setRoutersLoading(false);
        }
    };
    fetchRouters();
  }, [toast]);

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
        } catch (err) {
            toast({ title: "Error", description: "Failed to load hotspot data.", variant: "destructive" });
        } finally {
            setProfilesLoading(false);
            setServersLoading(false);
        }
    };
    fetchHotspotData();
  }, [toast, mikrotikRouterId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const voucherData = { quantity: parseInt(quantity), withPassword: withPassword === "yes", server, profile, dataLimitValue: parseInt(dataLimitValue), dataLimitUnit, timeLimitValue: parseInt(timeLimitValue), timeLimitUnit, nameLength: parseInt(nameLength), price: parseFloat(price), mikrotikRouter: mikrotikRouterId };
    try {
      const response = await fetch("/api/hotspot/vouchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(voucherData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to generate vouchers");
      }
      toast({ title: "Vouchers Generated", description: "Vouchers generated successfully." });
      fetchVouchers();
    } catch (error: unknown) {
      toast({ title: "Error", description: (error instanceof Error) ? error.message : "Failed to generate vouchers.", variant: "destructive" });
    }
    finally {
      setIsSubmitting(false);
    }
  };

  const columns = useMemo(() => getColumns(user), [user]);

  if (loading) return <div className="flex h-screen items-center justify-center bg-zinc-900 text-white">Loading vouchers...</div>;
  if (error) return <div className="flex h-screen items-center justify-center bg-zinc-900 text-red-400">{error}</div>;

  return (
    <>
      <div className="flex flex-col min-h-screen bg-zinc-900 text-white">
        <Topbar />
        <div className="flex-1 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Cash Vouchers</h1>
              <p className="text-sm text-zinc-400">Generate and manage hotspot cash vouchers.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <motion.div layout className="bg-zinc-900/50 backdrop-blur-lg border-zinc-700 shadow-2xl shadow-blue-500/10 rounded-xl overflow-hidden">
                <Card className="bg-transparent border-none">
                  <form onSubmit={handleSubmit}>
                    <div className="p-5 space-y-3">
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
                    <div className="p-4 border-t border-zinc-800">
                      <Button type="submit" size="sm" disabled={isSubmitting} className="w-full bg-gradient-to-r from-blue-600 to-cyan-500">{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}{isSubmitting ? "Generating..." : "Generate Vouchers"}</Button>
                    </div>
                  </form>
                </Card>
              </motion.div>
            </div>
            <div className="lg:col-span-2">
              <motion.div layout className="bg-zinc-900/50 backdrop-blur-lg border-zinc-700 shadow-2xl shadow-blue-500/10 rounded-xl overflow-hidden">
                <Card className="bg-transparent border-none">
                  <div className="overflow-x-auto">
                    <DataTable columns={columns} data={vouchers} />
                  </div>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
