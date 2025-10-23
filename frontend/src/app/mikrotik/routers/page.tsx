"use client"

import { useEffect, useState, useCallback, useMemo } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { getColumns } from "./columns";
import { Input } from "@/components/ui/input";
import { Search, Plus, Router as RouterIcon, Wifi, WifiOff } from "lucide-react";
import { Topbar } from "@/components/topbar";
import { motion } from "framer-motion";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

// --- Interface Definition ---
interface MikrotikRouter {
  _id: string;
  name: string;
  ipAddress: string;
  apiUsername: string;
  apiPort: number;
  location?: string;
  isOnline: boolean;
  lastChecked?: string;
  tenant?: {
    _id: string;
    fullName: string;
  };
}

// --- Main Component ---
export default function MikrotikRoutersPage() {
  const [routers, setRouters] = useState<MikrotikRouter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isLoggingOut } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);

  const fetchRouters = useCallback(async () => {
    try {
      const response = await fetch('/api/mikrotik/routers');
      if (!response.ok) throw new Error(`Failed to fetch routers: ${response.statusText}`);
      const data = await response.json();
      setRouters(data);
    } catch (err: unknown) {
      setError((err instanceof Error) ? err.message : 'Failed to fetch Mikrotik routers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoggingOut) { setLoading(false); return; }
    fetchRouters();
    const interval = setInterval(fetchRouters, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchRouters, isLoggingOut]);

  const handleDeleteRouter = async () => {
    if (!deleteCandidateId) return;
    try {
      const response = await fetch(`/api/mikrotik/routers/${deleteCandidateId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error(`Failed to delete router: ${response.statusText}`);
      toast({ title: 'Router Deleted', description: 'Mikrotik router has been successfully deleted.' });
      fetchRouters();
    } catch (error: unknown) {
      toast({ title: 'Error', description: (error instanceof Error) ? error.message : 'Failed to delete router.', variant: 'destructive' });
    }
    finally {
      setDeleteCandidateId(null);
    }
  };

  const columns = useMemo(() => getColumns(user, (id) => setDeleteCandidateId(id)), [user]);

  const filteredRouters = useMemo(() =>
    routers.filter(router =>
      router.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      router.ipAddress.toLowerCase().includes(searchTerm.toLowerCase())
    ), [routers, searchTerm]);

  const stats = useMemo(() => ({
    total: routers.length,
    online: routers.filter(r => r.isOnline).length,
    offline: routers.filter(r => !r.isOnline).length,
  }), [routers]);

  if (loading && !routers.length) {
    return <div className="flex h-screen items-center justify-center bg-zinc-900 text-white">Loading routers...</div>;
  }

  if (error) {
    return <div className="flex h-screen items-center justify-center bg-zinc-900 text-white">Error: {error}</div>;
  }

  return (
    <>
      <div className="flex flex-col min-h-screen bg-zinc-900 text-white">
        <Topbar />
        <div className="flex-1 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Mikrotik Routers</h1>
              <p className="text-sm text-zinc-400">Manage all your Mikrotik routers with ease.</p>
            </div>
            <Button asChild className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg transition-all duration-300 hover:scale-105">
              <Link href="/mikrotik/routers/new"><Plus className="mr-2 h-4 w-4" />Add New Router</Link>
            </Button>
          </div>

          <motion.div layout className="bg-zinc-900/50 backdrop-blur-lg border-zinc-700 shadow-2xl shadow-blue-500/10 rounded-xl overflow-hidden">
            <Card className="bg-transparent border-none">
              <CardHeader className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-zinc-800">
                <StatCard title="Total Routers" value={stats.total} icon={RouterIcon} />
                <StatCard title="Online" value={stats.online} icon={Wifi} color="text-green-400" />
                <StatCard title="Offline" value={stats.offline} icon={WifiOff} color="text-red-400" />
              </CardHeader>
              <div className="p-4 border-t border-zinc-800">
                <DataTableToolbar searchTerm={searchTerm} onSearch={setSearchTerm} />
              </div>
              <div className="overflow-x-auto">
                <DataTable
                  columns={columns}
                  data={filteredRouters}
                  filterColumn="name"
                />
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
      <AlertDialog open={!!deleteCandidateId} onOpenChange={() => setDeleteCandidateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the router.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRouter}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// --- Sub-components ---
const StatCard = ({ title, value, icon: Icon, color = "text-white" }: any) => (
  <div className="bg-zinc-800/50 p-3 rounded-lg flex items-center gap-4">
    <div className={`p-2 bg-zinc-700 rounded-md ${color}`}><Icon className="h-5 w-5" /></div>
    <div>
      <p className="text-xs text-zinc-400">{title}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  </div>
);

const DataTableToolbar = ({ searchTerm, onSearch }: any) => (
  <div className="flex items-center justify-end">
    <div className="relative w-full sm:max-w-xs">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
      <Input
        placeholder="Search by name or IP..."
        value={searchTerm}
        onChange={e => onSearch(e.target.value)}
        className="pl-10 h-9 bg-zinc-800 border-zinc-700"
      />
    </div>
  </div>
);
