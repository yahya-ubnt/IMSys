'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { Topbar } from "@/components/topbar";
import { Building2, Users, Wifi, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from '@/components/auth-provider';

// --- Interface Definitions ---
interface SuperAdminStats {
  totalTenants: number;
  activeTenants: number;
  totalRouters: number;
  totalUsers: number;
}

// --- Main Page Component ---
export default function SuperAdminDashboardPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState<SuperAdminStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!token) {
        setError("Authentication token not found. Please log in.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/super-admin/dashboard/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error(`Failed to fetch stats: ${response.statusText}`);

        setStats(await response.json());

      } catch (err: unknown) {
        setError((err instanceof Error) ? err.message : 'Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [token]);

  if (loading) return <div className="flex h-screen items-center justify-center bg-zinc-900 text-white">Loading dashboard...</div>;
  if (error) return <div className="flex h-screen items-center justify-center bg-zinc-900 text-red-400">{error}</div>;

  return (
    <div className="flex flex-col min-h-screen bg-zinc-900 text-white">
      <Topbar />
      <div className="flex-1 p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Super Admin Dashboard</h1>
          <p className="text-sm text-zinc-400">A global overview of all tenants and system metrics.</p>
        </div>

        <motion.div layout className="bg-zinc-900/50 backdrop-blur-lg border-zinc-700 shadow-2xl shadow-blue-500/10 rounded-xl overflow-hidden">
          <Card className="bg-transparent border-none">
            <CardHeader className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 border-b border-zinc-800">
              <StatCard title="Total Tenants" value={stats?.totalTenants || 0} icon={Building2} />
              <StatCard title="Active Tenants" value={stats?.activeTenants || 0} icon={CheckCircle} />
              <StatCard title="Total Routers" value={stats?.totalRouters || 0} icon={Wifi} />
              <StatCard title="Total Users" value={stats?.totalUsers || 0} icon={Users} />
            </CardHeader>
            {/* Charting components can be added here later */}
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

// --- Sub-components ---
const StatCard = ({ title, value, icon: Icon }: { title: string; value: number; icon: React.ElementType; }) => (
  <div className="bg-zinc-800/50 p-3 rounded-lg flex items-center gap-4">
    <div className="p-2 bg-zinc-700 rounded-md text-cyan-400"><Icon className="h-5 w-5" /></div>
    <div>
      <p className="text-xs text-zinc-400">{title}</p>
      <p className="text-xl font-bold text-white">{value.toLocaleString()}</p>
    </div>
  </div>
);