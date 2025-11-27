'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  PaginationState,
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
} from "@tanstack/react-table";
import { useAuth } from '@/components/auth-provider';
import { Topbar } from '@/components/topbar';
import { Button } from '@/components/ui/button';
import { PlusCircle, Building2, CheckCircle, XCircle, BarChart2, Users, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { getColumns } from './columns';
import { DataTable } from '@/components/data-table';
import { DataTablePagination } from '@/components/ui/data-table-pagination';

// --- Interface Definitions ---
interface Tenant {
  _id: string;
  name: string;
  owner: {
    fullName: string;
    email: string;
  };
  status: 'Active' | 'Suspended';
  createdAt: string;
}

interface TenantStats {
  totalTenants: number;
  activeTenants: number;
  suspendedTenants: number;
}

// --- Main Component ---
export default function TenantManagementPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [stats, setStats] = useState<TenantStats | null>(null);
  const [monthlyGrowth, setMonthlyGrowth] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isSuspendAlertOpen, setIsSuspendAlertOpen] = useState(false);

  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [newTenant, setNewTenant] = useState({ fullName: '', tenantName: '', email: '', phone: '', password: '' });
  const [editTenant, setEditTenant] = useState({ name: '' });

  // Table states
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tenantsRes, statsRes, growthRes] = await Promise.all([
        fetch('/api/super-admin/tenants'),
        fetch('/api/super-admin/tenants/stats'),
        fetch(`/api/super-admin/tenants/monthly-growth/${selectedYear}`)
      ]);

      if (!tenantsRes.ok) throw new Error('Failed to fetch tenants');
      if (!statsRes.ok) throw new Error('Failed to fetch tenant stats');
      if (!growthRes.ok) throw new Error('Failed to fetch monthly growth');

      setTenants(await tenantsRes.json());
      setStats(await statsRes.json());
      setMonthlyGrowth(await growthRes.json());

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/super-admin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTenant),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to create tenant');
      }
      setIsCreateModalOpen(false);
      setNewTenant({ fullName: '', tenantName: '', email: '', phone: '', password: '' });
      fetchData(); // Refetch all data
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'An unknown error occurred'); }
  };

  const handleEditClick = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setEditTenant({ name: tenant.name });
    setIsEditModalOpen(true);
  };

  const handleUpdateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenant) return;
    try {
      const res = await fetch(`/api/super-admin/tenants/${selectedTenant._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editTenant),
      });
      if (!res.ok) throw new Error(await res.text());
      setIsEditModalOpen(false);
      fetchData(); // Refetch all data
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'An unknown error occurred'); }
  };

  const handleSuspendClick = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setIsSuspendAlertOpen(true);
  };

  const handleToggleSuspend = async () => {
    if (!selectedTenant) return;
    try {
      const newStatus = selectedTenant.status === 'Active' ? 'Suspended' : 'Active';
      const res = await fetch(`/api/super-admin/tenants/${selectedTenant._id}`,
        { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) });
      if (!res.ok) throw new Error(await res.text());
      setIsSuspendAlertOpen(false);
      fetchData(); // Refetch all data
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'An unknown error occurred'); }
  };

  const handleDeleteClick = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setIsDeleteAlertOpen(true);
  };

  const handleDeleteTenant = async () => {
    if (!selectedTenant) return;
    try {
      const res = await fetch(`/api/super-admin/tenants/${selectedTenant._id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      setIsDeleteAlertOpen(false);
      fetchData(); // Refetch all data
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'An unknown error occurred'); }
  };

  const columns = useMemo(() => getColumns(handleEditClick, handleSuspendClick, handleDeleteClick), []);

  const table = useReactTable({
    data: tenants,
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
  });

  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());

  if (loading && !tenants.length) return <div className="flex h-screen items-center justify-center bg-zinc-900 text-white">Loading...</div>;
  if (error) return <div className="flex h-screen items-center justify-center bg-zinc-900 text-red-400">{error}</div>;

  return (
    <div className="flex flex-col min-h-screen bg-zinc-900 text-white">
      <Topbar />
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Tenant Management</h1>
            <p className="text-sm text-zinc-400">Create, view, and manage all tenants in the system.</p>
          </div>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild><Button className="bg-cyan-500 hover:bg-cyan-600 text-white"><PlusCircle className="mr-2 h-4 w-4" /> Create Tenant</Button></DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-zinc-700 text-white">
              <DialogHeader><DialogTitle className="text-cyan-400">Create New Tenant</DialogTitle><DialogDescription className="text-zinc-400">Fill in the details below to create a new tenant account.</DialogDescription></DialogHeader>
              <form onSubmit={handleCreateTenant}><div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="tenantName" className="text-right text-zinc-400">Tenant Name</Label><Input id="tenantName" value={newTenant.tenantName} onChange={(e) => setNewTenant({ ...newTenant, tenantName: e.target.value })} className="col-span-3 bg-zinc-800 border-zinc-600 text-white" required /></div>
                  <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="fullName" className="text-right text-zinc-400">Owner Name</Label><Input id="fullName" value={newTenant.fullName} onChange={(e) => setNewTenant({ ...newTenant, fullName: e.target.value })} className="col-span-3 bg-zinc-800 border-zinc-600 text-white" required /></div>
                  <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="email" className="text-right text-zinc-400">Owner Email</Label><Input id="email" type="email" value={newTenant.email} onChange={(e) => setNewTenant({ ...newTenant, email: e.target.value })} className="col-span-3 bg-zinc-800 border-zinc-600 text-white" required /></div>
                  <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="phone" className="text-right text-zinc-400">Owner Phone</Label><Input id="phone" value={newTenant.phone} onChange={(e) => setNewTenant({ ...newTenant, phone: e.target.value })} className="col-span-3 bg-zinc-800 border-zinc-600 text-white" required /></div>
                  <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="password" className="text-right text-zinc-400">Owner Password</Label><Input id="password" type="password" value={newTenant.password} onChange={(e) => setNewTenant({ ...newTenant, password: e.target.value })} className="col-span-3 bg-zinc-800 border-zinc-600 text-white" required /></div>
              </div><DialogFooter><Button type="submit" className="bg-cyan-500 hover:bg-cyan-600 text-white">Create Tenant</Button></DialogFooter></form>
            </DialogContent>
          </Dialog>
        </div>

        <motion.div layout className="bg-zinc-900/50 backdrop-blur-lg border-zinc-700 shadow-2xl shadow-blue-500/10 rounded-xl overflow-hidden">
          <Card className="bg-transparent border-none">
            <CardHeader className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-zinc-800">
              <StatCard title="Total Tenants" value={stats?.totalTenants || 0} icon={Building2} />
              <StatCard title="Active Tenants" value={stats?.activeTenants || 0} icon={CheckCircle} color="text-green-400" />
              <StatCard title="Suspended Tenants" value={stats?.suspendedTenants || 0} icon={XCircle} color="text-red-400" />
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ChartCard title="New Tenants Trend" selectedYear={selectedYear} onYearChange={setSelectedYear} years={years} data={monthlyGrowth} />
              <DonutChartCard active={stats?.activeTenants || 0} suspended={stats?.suspendedTenants || 0} total={stats?.totalTenants || 0} />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div layout className="bg-zinc-900/50 backdrop-blur-lg border-zinc-700 shadow-2xl shadow-blue-500/10 rounded-xl overflow-hidden">
          <Card className="bg-transparent border-none">
            <CardHeader className="p-4 border-b border-zinc-800">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  placeholder="Search by name or email..."
                  value={(table.getColumn("fullName")?.getFilterValue() as string) ?? ""}
                  onChange={(event) => table.getColumn("fullName")?.setFilterValue(event.target.value)}
                  className="pl-10 h-9 bg-zinc-800 border-zinc-700"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable columns={columns} table={table} />
            </CardContent>
            <CardFooter className="p-2 border-t border-zinc-800">
              <DataTablePagination table={table} />
            </CardFooter>
          </Card>
        </motion.div>

        {/* Edit Tenant Modal */}
        {selectedTenant && <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-zinc-700 text-white">
            <DialogHeader><DialogTitle className="text-cyan-400">Edit Tenant</DialogTitle><DialogDescription className="text-zinc-400">Update the details for {selectedTenant.name}.</DialogDescription></DialogHeader>
            <form onSubmit={handleUpdateTenant}><div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="edit-name" className="text-right text-zinc-400">Tenant Name</Label><Input id="edit-name" value={editTenant.name} onChange={(e) => setEditTenant({ ...editTenant, name: e.target.value })} className="col-span-3 bg-zinc-800 border-zinc-600 text-white" required /></div>
            </div><DialogFooter><Button type="submit" className="bg-cyan-500 hover:bg-cyan-600 text-white">Save Changes</Button></DialogFooter></form>
          </DialogContent>
        </Dialog>}

        {/* Suspend/Activate Alert */}
        {selectedTenant && <AlertDialog open={isSuspendAlertOpen} onOpenChange={setIsSuspendAlertOpen}>
            <AlertDialogContent className="bg-zinc-900 border-zinc-700 text-white"><AlertDialogHeader><AlertDialogTitle className="text-amber-400">Confirm Status Change</AlertDialogTitle><AlertDialogDescription className="text-zinc-400">Are you sure you want to {selectedTenant.status === 'Active' ? 'suspend' : 'activate'} {selectedTenant.name}?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="bg-zinc-700">Cancel</AlertDialogCancel><AlertDialogAction onClick={handleToggleSuspend} className={selectedTenant.status === 'Active' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-green-500 hover:bg-green-600'}>{selectedTenant.status === 'Active' ? 'Suspend' : 'Activate'}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
        </AlertDialog>}

        {/* Delete Alert */}
        {selectedTenant && <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
            <AlertDialogContent className="bg-zinc-900 border-zinc-700 text-white"><AlertDialogHeader><AlertDialogTitle className="text-red-500">Confirm Deletion</AlertDialogTitle><AlertDialogDescription className="text-zinc-400">Are you sure you want to delete {selectedTenant.name}? This action cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="bg-zinc-700">Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteTenant} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
        </AlertDialog>}
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

const ChartCard = ({ title, selectedYear, onYearChange, years, data }: any) => (
  <div className="bg-zinc-800/50 p-4 rounded-lg">
    <div className="flex justify-between items-center mb-2">
      <h3 className="text-sm font-semibold text-cyan-400 flex items-center gap-2"><BarChart2 size={16}/> {title}</h3>
      <Select value={selectedYear} onValueChange={onYearChange}>
        <SelectTrigger className="w-32 h-8 text-xs bg-zinc-700 border-zinc-600"><SelectValue /></SelectTrigger>
        <SelectContent className="bg-zinc-800 text-white border-zinc-700">{years.map((y: string) => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
      </Select>
    </div>
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
        <defs><linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22d3ee" stopOpacity={0.8}/><stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/></linearGradient></defs>
        <XAxis dataKey="month" tickFormatter={m => new Date(2000, m - 1).toLocaleString('default', { month: 'short' })} style={{ fontSize: '0.75rem' }} stroke="#888" />
        <YAxis style={{ fontSize: '0.75rem' }} stroke="#888" />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(100,100,100,0.1)' }} />
        <Area type="monotone" dataKey="total" stroke="#22d3ee" fill="url(#chartFill)" />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

const DonutChartCard = ({ active, suspended, total }: any) => (
    <div className="bg-zinc-800/50 p-4 rounded-lg">
        <h3 className="text-sm font-semibold text-cyan-400 mb-2 flex items-center gap-2"><Users size={16}/> Tenant Status</h3>
        <ResponsiveContainer width="100%" height={200}>
            <PieChart>
                <defs>
                    <linearGradient id="activeFill"><stop offset="0%" stopColor="#10b981" /><stop offset="100%" stopColor="#34d399" /></linearGradient>
                    <linearGradient id="suspendedFill"><stop offset="0%" stopColor="#f59e0b" /><stop offset="100%" stopColor="#fbbf24" /></linearGradient>
                </defs>
                <Pie data={[{ name: 'Active', value: active }, { name: 'Suspended', value: suspended }]} dataKey="value" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} stroke="none">
                    <Cell key="active" fill="url(#activeFill)" />
                    <Cell key="suspended" fill="url(#suspendedFill)" />
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: '0.75rem' }} />
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize="24" fontWeight="bold">{total}</text>
                <text x="50%" y="65%" textAnchor="middle" dominantBaseline="middle" fill="#aaa" fontSize="12">Total Tenants</text>
            </PieChart>
        </ResponsiveContainer>
    </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-800/80 backdrop-blur-sm text-white p-2 rounded-md text-xs border border-zinc-700">
        <p className="font-bold">{label || payload[0].name}</p>
        <p>{`Tenants: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};