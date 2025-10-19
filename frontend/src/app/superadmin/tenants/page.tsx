'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { Topbar } from '@/components/topbar';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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

// --- Interface Definitions ---
interface Tenant {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  status: 'Active' | 'Suspended';
  createdAt: string;
}

// --- Main Component ---
export default function TenantManagementPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isSuspendAlertOpen, setIsSuspendAlertOpen] = useState(false);

  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [newTenant, setNewTenant] = useState({ fullName: '', email: '', phone: '', password: '' });
  const [editTenant, setEditTenant] = useState({ fullName: '', email: '', phone: '' });

  const fetchTenants = async () => {
    if (!token) {
      setError('Authentication token not found.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const response = await fetch('/api/super-admin/tenants', { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error('Failed to fetch tenants');
      const data = await response.json();
      setTenants(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (token) fetchTenants(); }, [token]);

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/super-admin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newTenant),
      });
      if (!res.ok) throw new Error(await res.text());
      setIsCreateModalOpen(false);
      setNewTenant({ fullName: '', email: '', phone: '', password: '' });
      fetchTenants();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'An unknown error occurred'); }
  };

  const handleEditClick = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setEditTenant({ fullName: tenant.fullName, email: tenant.email, phone: tenant.phone });
    setIsEditModalOpen(true);
  };

  const handleUpdateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenant) return;
    try {
      const res = await fetch(`/api/super-admin/tenants/${selectedTenant._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(editTenant),
      });
      if (!res.ok) throw new Error(await res.text());
      setIsEditModalOpen(false);
      fetchTenants();
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
        { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ status: newStatus }) });
      if (!res.ok) throw new Error(await res.text());
      setIsSuspendAlertOpen(false);
      fetchTenants();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'An unknown error occurred'); }
  };

  const handleDeleteClick = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setIsDeleteAlertOpen(true);
  };

  const handleDeleteTenant = async () => {
    if (!selectedTenant) return;
    try {
      const res = await fetch(`/api/super-admin/tenants/${selectedTenant._id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(await res.text());
      setIsDeleteAlertOpen(false);
      fetchTenants();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'An unknown error occurred'); }
  };

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
                  <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="fullName" className="text-right text-zinc-400">Full Name</Label><Input id="fullName" value={newTenant.fullName} onChange={(e) => setNewTenant({ ...newTenant, fullName: e.target.value })} className="col-span-3 bg-zinc-800 border-zinc-600 text-white" required /></div>
                  <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="email" className="text-right text-zinc-400">Email</Label><Input id="email" type="email" value={newTenant.email} onChange={(e) => setNewTenant({ ...newTenant, email: e.target.value })} className="col-span-3 bg-zinc-800 border-zinc-600 text-white" required /></div>
                  <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="phone" className="text-right text-zinc-400">Phone</Label><Input id="phone" value={newTenant.phone} onChange={(e) => setNewTenant({ ...newTenant, phone: e.target.value })} className="col-span-3 bg-zinc-800 border-zinc-600 text-white" required /></div>
                  <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="password" className="text-right text-zinc-400">Password</Label><Input id="password" type="password" value={newTenant.password} onChange={(e) => setNewTenant({ ...newTenant, password: e.target.value })} className="col-span-3 bg-zinc-800 border-zinc-600 text-white" required /></div>
              </div><DialogFooter><Button type="submit" className="bg-cyan-500 hover:bg-cyan-600 text-white">Create Tenant</Button></DialogFooter></form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 overflow-hidden">
          <Table>
            <TableHeader><TableRow className="border-zinc-700"><TableHead className="text-white">Tenant Name</TableHead><TableHead className="text-white">Email</TableHead><TableHead className="text-white">Phone</TableHead><TableHead className="text-white">Status</TableHead><TableHead className="text-white">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={5} className="text-center">Loading...</TableCell></TableRow> : error ? <TableRow><TableCell colSpan={5} className="text-center text-red-500">{error}</TableCell></TableRow> : tenants.map((tenant) => (
                <TableRow key={tenant._id} className="border-zinc-800">
                  <TableCell>{tenant.fullName}</TableCell>
                  <TableCell>{tenant.email}</TableCell>
                  <TableCell>{tenant.phone}</TableCell>
                  <TableCell><Badge variant={tenant.status === 'Active' ? 'success' : 'destructive'}>{tenant.status}</Badge></TableCell>
                  <TableCell className="flex items-center space-x-2">
                    <Button variant="ghost" size="icon" className="hover:bg-zinc-700" onClick={() => handleSuspendClick(tenant)}>{tenant.status === 'Active' ? <ToggleLeft className="h-4 w-4" /> : <ToggleRight className="h-4 w-4" />}</Button>
                    <Button variant="ghost" size="icon" className="hover:bg-zinc-700" onClick={() => handleEditClick(tenant)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="hover:bg-zinc-700 text-red-500" onClick={() => handleDeleteClick(tenant)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Edit Tenant Modal */}
        {selectedTenant && <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-zinc-700 text-white">
            <DialogHeader><DialogTitle className="text-cyan-400">Edit Tenant</DialogTitle><DialogDescription className="text-zinc-400">Update the details for {selectedTenant.fullName}.</DialogDescription></DialogHeader>
            <form onSubmit={handleUpdateTenant}><div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="edit-fullName" className="text-right text-zinc-400">Full Name</Label><Input id="edit-fullName" value={editTenant.fullName} onChange={(e) => setEditTenant({ ...editTenant, fullName: e.target.value })} className="col-span-3 bg-zinc-800 border-zinc-600 text-white" required /></div>
                <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="edit-email" className="text-right text-zinc-400">Email</Label><Input id="edit-email" type="email" value={editTenant.email} onChange={(e) => setEditTenant({ ...editTenant, email: e.target.value })} className="col-span-3 bg-zinc-800 border-zinc-600 text-white" required /></div>
                <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="edit-phone" className="text-right text-zinc-400">Phone</Label><Input id="edit-phone" value={editTenant.phone} onChange={(e) => setEditTenant({ ...editTenant, phone: e.target.value })} className="col-span-3 bg-zinc-800 border-zinc-600 text-white" required /></div>
            </div><DialogFooter><Button type="submit" className="bg-cyan-500 hover:bg-cyan-600 text-white">Save Changes</Button></DialogFooter></form>
          </DialogContent>
        </Dialog>}

        {/* Suspend/Activate Alert */}
        {selectedTenant && <AlertDialog open={isSuspendAlertOpen} onOpenChange={setIsSuspendAlertOpen}>
            <AlertDialogContent className="bg-zinc-900 border-zinc-700 text-white"><AlertDialogHeader><AlertDialogTitle className="text-amber-400">Confirm Status Change</AlertDialogTitle><AlertDialogDescription className="text-zinc-400">Are you sure you want to {selectedTenant.status === 'Active' ? 'suspend' : 'activate'} {selectedTenant.fullName}?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="bg-zinc-700">Cancel</AlertDialogCancel><AlertDialogAction onClick={handleToggleSuspend} className={selectedTenant.status === 'Active' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-green-500 hover:bg-green-600'}>{selectedTenant.status === 'Active' ? 'Suspend' : 'Activate'}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
        </AlertDialog>}

        {/* Delete Alert */}
        {selectedTenant && <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
            <AlertDialogContent className="bg-zinc-900 border-zinc-700 text-white"><AlertDialogHeader><AlertDialogTitle className="text-red-500">Confirm Deletion</AlertDialogTitle><AlertDialogDescription className="text-zinc-400">Are you sure you want to delete {selectedTenant.fullName}? This action cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="bg-zinc-700">Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteTenant} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
        </AlertDialog>}
      </div>
    </div>
  );
}
