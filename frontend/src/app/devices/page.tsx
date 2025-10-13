'use client'

import { useEffect, useState, useMemo, useCallback } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { PlusCircledIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { getColumns } from "./columns";
import { Device, getDevices, deleteDevice } from "@/lib/deviceService";
import { Input } from "@/components/ui/input";
import { Search, Server, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { Topbar } from "@/components/topbar";
import { motion } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "UP" | "DOWN">("all");
  const [deviceTypeFilter, setDeviceTypeFilter] = useState<"all" | "Access" | "Station">("all");

  const fetchDevices = useCallback(async () => {
    if (!token) {
      setError("Authentication token not found. Please log in.");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const deviceType = deviceTypeFilter === "all" ? undefined : deviceTypeFilter;
      const data = await getDevices(token, deviceType);
      setDevices(data);
    } catch (err: unknown) {
      setError((err instanceof Error) ? err.message : "Failed to fetch devices");
    } finally {
      setLoading(false);
    }
  }, [token, deviceTypeFilter]);

  useEffect(() => {
    fetchDevices();
  }, [token, fetchDevices]);

  const handleDeleteDevice = async (deviceId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!token) {
      toast({ title: "Authentication Error", variant: "destructive" });
      return;
    }
    if (!confirm("Are you sure you want to delete this device?")) {
      return;
    }
    try {
      await deleteDevice(deviceId, token);
      toast({ title: "Device Deleted" });
      fetchDevices();
    } catch (error: unknown) {
      toast({
        title: "Error deleting device",
        description: (error instanceof Error) ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const columns = getColumns(handleDeleteDevice);

  const filteredDevices = useMemo(() => {
    return devices.filter((device) => {
      const search = searchTerm.toLowerCase();
      const matchesSearch = (
        device.deviceName?.toLowerCase().includes(search) ||
        device.ipAddress.toLowerCase().includes(search) ||
        device.macAddress.toLowerCase().includes(search)
      );
      const matchesStatus = statusFilter === "all" || device.status === statusFilter;
      const matchesDeviceType = deviceTypeFilter === "all" || device.deviceType === deviceTypeFilter;
      return matchesSearch && matchesStatus && matchesDeviceType;
    });
  }, [devices, searchTerm, statusFilter, deviceTypeFilter]);

  const totalDevices = devices.length;
  const devicesUp = devices.filter(d => d.status === 'UP').length;
  const devicesDown = totalDevices - devicesUp;

  if (loading) return <div className="flex h-screen items-center justify-center bg-zinc-900 text-white">Loading devices...</div>;
  if (error) return <div className="flex h-screen items-center justify-center bg-zinc-900 text-red-400">{error}</div>;

  return (
    <div className="flex flex-col min-h-screen bg-zinc-900 text-white">
      <Topbar />
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Device Management</h1>
            <p className="text-sm text-zinc-400">Monitor and manage all network devices.</p>
          </div>
          <Button asChild className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg transition-all duration-300 hover:scale-105">
            <Link href="/devices/new"><PlusCircledIcon className="mr-2 h-4 w-4" /> Add New Device</Link>
          </Button>
        </div>

        <motion.div layout className="bg-zinc-900/50 backdrop-blur-lg border-zinc-700 shadow-2xl shadow-blue-500/10 rounded-xl overflow-hidden">
          <Card className="bg-transparent border-none">
            <CardHeader className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-zinc-800">
              <StatCard title="Total Devices" value={totalDevices} icon={Server} />
              <StatCard title="Online" value={devicesUp} icon={ArrowUpCircle} color="text-green-400" />
              <StatCard title="Offline" value={devicesDown} icon={ArrowDownCircle} color="text-red-400" />
            </CardHeader>
            <div className="p-4 border-t border-zinc-800">
              <DataTableToolbar 
                searchTerm={searchTerm} 
                onSearch={setSearchTerm} 
                statusFilter={statusFilter} 
                onStatusFilter={setStatusFilter}
                deviceTypeFilter={deviceTypeFilter}
                onDeviceTypeFilter={setDeviceTypeFilter}
              />
            </div>
            <div className="overflow-x-auto">
              <DataTable
                columns={columns}
                data={filteredDevices}
                onRowClick={(row) => window.location.href = `/devices/${row._id}`}
              />
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
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

const DataTableToolbar = ({ searchTerm, onSearch, statusFilter, onStatusFilter, deviceTypeFilter, onDeviceTypeFilter }: any) => (
  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
    <div className="flex items-center gap-2">
      <Button size="sm" variant={statusFilter === 'all' ? 'default' : 'outline'} onClick={() => onStatusFilter('all')}>All</Button>
      <Button size="sm" variant={statusFilter === 'UP' ? 'default' : 'outline'} onClick={() => onStatusFilter('UP')}>Online</Button>
      <Button size="sm" variant={statusFilter === 'DOWN' ? 'default' : 'outline'} onClick={() => onStatusFilter('DOWN')}>Offline</Button>
    </div>
    <div className="flex items-center gap-2">
        <Select value={deviceTypeFilter} onValueChange={onDeviceTypeFilter}>
          <SelectTrigger className="w-[180px] h-9 bg-zinc-800 border-zinc-700">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Access">Access Points</SelectItem>
            <SelectItem value="Station">Stations</SelectItem>
          </SelectContent>
        </Select>
      <div className="relative w-full sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <Input
          placeholder="Search by name, IP, or MAC..."
          value={searchTerm}
          onChange={e => onSearch(e.target.value)}
          className="pl-10 h-9 bg-zinc-800 border-zinc-700"
        />
      </div>
    </div>
  </div>
);