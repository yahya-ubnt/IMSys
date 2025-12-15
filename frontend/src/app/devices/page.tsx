'use client'

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  ColumnFiltersState,
  SortingState,
  PaginationState,
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
} from "@tanstack/react-table";
import { Card, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/data-table";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { Button } from "@/components/ui/button";
import { PlusCircledIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { getColumns } from "./columns";
import { Device, getDevices, deleteDevice } from "@/lib/deviceService";
import { Input } from "@/components/ui/input";
import { Search, Server, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { Topbar } from "@/components/topbar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
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
  const { toast } = useToast();
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);

  // Table states
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  const fetchDevices = useCallback(async () => {
    try {
      setLoading(true);
      const deviceType = columnFilters.find(f => f.id === 'deviceType')?.value as "Access" | "Station" | undefined;
      const data = await getDevices(deviceType);
      setDevices(data);
    } catch (err: unknown) {
      setError((err instanceof Error) ? err.message : "Failed to fetch devices");
    } finally {
      setLoading(false);
    }
  }, [columnFilters]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const handleDeleteDevice = async (deviceId: string) => {
    if (!confirm("Are you sure you want to delete this device?")) {
      return;
    }
    try {
      await deleteDevice(deviceId);
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

  const columns = useMemo(() => getColumns(handleDeleteDevice), [handleDeleteDevice]);

  const table = useReactTable({
    data: devices,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      pagination,
    },
  })

  const totalDevices = devices.length;
  const devicesUp = devices.filter(d => d.status === 'UP').length;
  const devicesDown = totalDevices - devicesUp;

  if (loading && devices.length === 0) return <div className="flex h-screen items-center justify-center bg-zinc-900 text-white">Loading devices...</div>;
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
          <div className="flex items-center gap-2">
            {/* Mobile: Icon-only button */}
            <Button asChild size="icon" className="sm:hidden bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg transition-all duration-300 hover:scale-105">
              <Link href="/devices/new"><PlusCircledIcon className="h-4 w-4" /></Link>
            </Button>
            {/* Desktop: Full button */}
            <Button asChild className="hidden sm:flex bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg transition-all duration-300 hover:scale-105">
              <Link href="/devices/new"><PlusCircledIcon className="mr-2 h-4 w-4" /> Add New Device</Link>
            </Button>
          </div>
        </div>

        <div className="bg-zinc-900/50 backdrop-blur-lg shadow-2xl shadow-blue-500/10 rounded-xl overflow-hidden">
          <Card className="bg-transparent border-none">
            <CardHeader className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard title="Total Devices" value={totalDevices} icon={Server} />
              <StatCard title="Online" value={devicesUp} icon={ArrowUpCircle} color="text-green-400" />
              <StatCard title="Offline" value={devicesDown} icon={ArrowDownCircle} color="text-red-400" />
            </CardHeader>
            <div className="p-4">
              <DataTableToolbar table={table} />
            </div>
            <div className="overflow-x-auto">
              <DataTable
                table={table}
                columns={columns}
                onRowClick={(row) => window.location.href = `/devices/${row._id}`}
              />
            </div>
            <DataTablePagination table={table} />
          </Card>
        </div>
      </div>
      <AlertDialog open={!!deleteCandidateId} onOpenChange={() => setDeleteCandidateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the device.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
                if (deleteCandidateId) {
                    handleDeleteDevice(deleteCandidateId);
                }
            }}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// --- Sub-components ---
const StatCard = ({ title, value, icon: Icon, color = "text-white" }: { title: string, value: number, icon: React.ElementType, color?: string }) => (
  <div className="bg-zinc-800/50 p-3 rounded-lg flex items-center gap-4">
    <div className={`p-2 bg-zinc-700 rounded-md ${color}`}><Icon className="h-5 w-5" /></div>
    <div>
      <p className="text-xs text-zinc-400">{title}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  </div>
);

const DataTableToolbar = ({ table }: { table: ReturnType<typeof useReactTable<Device>> }) => (
  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
    <div className="flex items-center gap-2">
      <Button size="sm" className={!table.getColumn('status')?.getFilterValue() ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-transparent border border-zinc-700 text-zinc-400 hover:bg-zinc-800'} onClick={() => table.getColumn('status')?.setFilterValue(undefined)}>All</Button>
      <Button size="sm" className={table.getColumn('status')?.getFilterValue() === 'UP' ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-transparent border border-zinc-700 text-zinc-400 hover:bg-zinc-800'} onClick={() => table.getColumn('status')?.setFilterValue('UP')}>Online</Button>
      <Button size="sm" className={table.getColumn('status')?.getFilterValue() === 'DOWN' ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-transparent border border-zinc-700 text-zinc-400 hover:bg-zinc-800'} onClick={() => table.getColumn('status')?.setFilterValue('DOWN')}>Offline</Button>
    </div>
    <div className="flex items-center gap-2">
        <Select value={table.getColumn('deviceType')?.getFilterValue() as string ?? 'all'} onValueChange={(value) => table.getColumn('deviceType')?.setFilterValue(value === 'all' ? undefined : value)}>
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
          value={(table.getColumn("deviceName")?.getFilterValue() as string) ?? ""}
          onChange={(event) => table.getColumn("deviceName")?.setFilterValue(event.target.value)}
          className="pl-10 h-9 bg-zinc-800 border-zinc-700"
        />
      </div>
    </div>
  </div>
);