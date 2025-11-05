"use client"

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { getColumns } from "./columns.tsx";
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
            <Link href="/hotspot/vouchers/new">
              <Button className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg transition-all duration-300 hover:scale-105">
                <Plus className="mr-2 h-4 w-4" />
                Generate Vouchers
              </Button>
            </Link>
          </div>

          <motion.div layout className="bg-zinc-900/50 backdrop-blur-lg border-zinc-700 shadow-2xl shadow-blue-500/10 rounded-xl overflow-hidden">
            <Card className="bg-transparent border-none">
              <div className="overflow-x-auto">
                <DataTable columns={columns} data={vouchers} />
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  );
}
