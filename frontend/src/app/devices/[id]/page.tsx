'use client'

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
} from "@tanstack/react-table";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { ArrowLeft, Edit, Server, MapPin, Network, Lock, Wifi, Clock, Users, HardDrive, WifiOff } from "lucide-react";
import { Topbar } from "@/components/topbar";
import { Device, DowntimeLog, getDeviceById, getDeviceDowntimeLogs } from "@/lib/deviceService";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/data-table";
import { columns as downtimeColumns } from "./columns";
import { connectedStationsColumns } from "./connected-stations-columns";
import { getConnectedUserColumns } from "./connected-users-columns";
import { motion } from "framer-motion";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { MikrotikUser } from "@/app/mikrotik/users/page";

// --- Sub-components ---
const DetailItem = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number | undefined; }) => (
    <div className="flex items-start space-x-3 rounded-lg p-2 hover:bg-zinc-800/50 transition-colors">
        <Icon className="h-4 w-4 text-zinc-400 mt-1 flex-shrink-0" />
        <div>
            <p className="text-xs text-zinc-400">{label}</p>
            <p className="text-sm font-semibold text-zinc-100">{value || 'N/A'}</p>
        </div>
    </div>
);

const HeaderStat = ({ icon: Icon, label, value, color = 'text-zinc-300' }: { icon: React.ElementType, label: string, value: React.ReactNode, color?: string }) => (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-zinc-800/50">
        <Icon className={`h-5 w-5 flex-shrink-0 ${color}`} />
        <div>
            <p className="text-xs text-zinc-400">{label}</p>
            <p className={`text-sm font-bold ${color}`}>{value}</p>
        </div>
    </div>
);

// --- Main Page Component ---
export default function DeviceDetailsPage() {
  const [device, setDevice] = useState<Device | null>(null);
  const [downtimeLogs, setDowntimeLogs] = useState<DowntimeLog[]>([]);
  const [users, setUsers] = useState<MikrotikUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const { toast } = useToast();
  const params = useParams();
  const id = params.id as string;

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const [deviceData, logsData] = await Promise.all([
          getDeviceById(id),
          getDeviceDowntimeLogs(id),
        ]);
        setDevice(deviceData);
        setDowntimeLogs(logsData);
      } catch (err) {
        setError("Failed to load device details.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    if (!id || !device) { setUsersLoading(false); return; }
    if (device.deviceType !== 'Station') { setUsersLoading(false); return; }
    const fetchUsers = async () => {
      try {
        const response = await fetch(`/api/devices/${id}/users`);
        if (!response.ok) throw new Error("Failed to fetch users");
        setUsers(await response.json());
      } catch (err) {
        toast({ title: "Error fetching users", variant: "destructive" });
      } finally {
        setUsersLoading(false);
      }
    };
    fetchUsers();
  }, [id, toast, device]);

  const downtimeTable = useReactTable({
    data: downtimeLogs,
    columns: downtimeColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const usersTable = useReactTable({
    data: users,
    columns: getConnectedUserColumns(),
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const stationsTable = useReactTable({
    data: device?.connectedStations || [],
    columns: connectedStationsColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  if (loading) return <div className="flex h-screen items-center justify-center bg-zinc-900 text-white">Loading device profile...</div>;
  if (error) return <div className="flex h-screen items-center justify-center bg-zinc-900 text-red-400">{error}</div>;
  if (!device) return <div className="flex h-screen items-center justify-center bg-zinc-900 text-white">Device not found.</div>;

  const userColumns = getConnectedUserColumns();

  const tabs = [
    { id: "overview", label: "Overview", icon: HardDrive },
    { id: "downtime", label: "Downtime", icon: Clock },
    ...(device.deviceType === 'Station' ? [{ id: "users", label: "Connected Users", icon: Users }] : []),
    ...(device.deviceType === 'Access' ? [{ id: "stations", label: "Connected Stations", icon: Wifi }] : []),
  ];

  return (
    <div className="flex flex-col min-h-screen bg-zinc-900 text-white">
      <Topbar />
      <div className="flex-1 p-6 flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/devices"><Button variant="ghost" size="icon" className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700"><ArrowLeft className="h-4 w-4" /></Button></Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">{device.deviceName}</h1>
              <p className="text-sm text-zinc-400">{device.deviceType}</p>
            </div>
          </div>
          <Link href={`/devices/edit/${id}`}><Button variant="outline" size="sm"><Edit className="h-3 w-3 mr-2" />Edit Device</Button></Link>
        </div>

        <motion.div layout className="bg-zinc-900/50 backdrop-blur-lg border-zinc-700 shadow-2xl shadow-blue-500/10 rounded-xl flex-1 flex flex-col">
          <Card className="bg-transparent border-none flex-1 flex flex-col">
            <CardHeader className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-zinc-800">
              <HeaderStat icon={device.status === "UP" ? Wifi : WifiOff} label="Status" value={<Badge variant={device.status === "UP" ? "default" : "destructive"} className={device.status === "UP" ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}>{device.status}</Badge>} />
              <HeaderStat icon={Server} label="Model" value={device.deviceModel} />
              <HeaderStat icon={Network} label="IP Address" value={device.ipAddress} />
              <HeaderStat icon={Clock} label="Last Seen" value={new Date(device.lastSeen || Date.now()).toLocaleString()} />
            </CardHeader>
            
            <TabsPrimitive.Root value={activeTab} onValueChange={setActiveTab} defaultValue="overview" className="flex-1 flex flex-col">
              <TabsPrimitive.List className="relative flex w-full items-center justify-start border-b border-zinc-800 p-2">
                {tabs.map((tab) => (
                  <TabsPrimitive.Trigger key={tab.id} value={tab.id} className="relative px-3 py-1.5 text-sm font-medium text-zinc-400 transition-colors focus-visible:outline-none data-[state=active]:text-white">
                    {activeTab === tab.id && <motion.div layoutId="active-device-tab-indicator" className="absolute inset-0 bg-zinc-700/50 rounded-md" />}
                    <span className="relative z-10 flex items-center"><tab.icon className="mr-2 h-4 w-4" />{tab.label}</span>
                  </TabsPrimitive.Trigger>
                ))}
              </TabsPrimitive.List>

              <CardContent className="p-4 flex-1">
                <TabsPrimitive.Content value="overview" className="h-full">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
                    <DetailItem icon={MapPin} label="Location" value={device.location} />
                    <DetailItem icon={Network} label="MAC Address" value={device.macAddress} />
                    <DetailItem icon={Server} label="Monitoring Router" value={device.router.name} />
                    <DetailItem icon={Wifi} label={device.deviceType === 'Access' ? "Broadcasted SSID" : "AP to Connect To"} value={device.ssid} />
                    <DetailItem icon={Lock} label="Login Username" value={device.loginUsername} />
                  </div>
                </TabsPrimitive.Content>
                <TabsPrimitive.Content value="downtime" className="h-full"><DataTable table={downtimeTable} columns={downtimeColumns} /></TabsPrimitive.Content>
                <TabsPrimitive.Content value="users" className="h-full">{usersLoading ? <p>Loading users...</p> : <DataTable table={usersTable} columns={userColumns} />}</TabsPrimitive.Content>
                <TabsPrimitive.Content value="stations" className="h-full"><DataTable table={stationsTable} columns={connectedStationsColumns} /></TabsPrimitive.Content>
              </CardContent>
            </TabsPrimitive.Root>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
