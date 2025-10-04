"use client"

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { getColumns } from "./columns";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PackageForm } from "./package-form";
import { Package } from "@/types/mikrotik-package";
import { motion } from "framer-motion";
import { Topbar } from "@/components/topbar";

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token, isLoggingOut } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);

  const fetchPackages = useCallback(async () => {
    if (!token) {
      setError('Authentication token not found.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const response = await fetch('/api/mikrotik/packages', { headers: { 'Authorization': `Bearer ${token}` } });
      if (!response.ok) throw new Error(`Failed to fetch packages: ${response.statusText}`);
      setPackages(await response.json());
    } catch (err: unknown) {
      setError((err instanceof Error) ? err.message : 'Failed to fetch packages');
    }
    finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isLoggingOut) { setLoading(false); return; }
    fetchPackages();
  }, [fetchPackages, isLoggingOut]);

  const handleFormSubmit = async (data: PackageFormData) => {
    setIsSubmitting(true);
    const method = editingPackage ? "PUT" : "POST";
    const url = editingPackage ? `/api/mikrotik/packages/${editingPackage._id}` : "/api/mikrotik/packages";
    const action = editingPackage ? "updated" : "created";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error((await response.json()).message || `Failed to ${action} package`);
      toast({ title: `Package ${action}`, description: `Package has been successfully ${action}.` });
      setIsFormOpen(false);
      fetchPackages();
    } catch (error: unknown) {
      toast({ title: "Error", description: (error instanceof Error) ? error.message : `Failed to ${action} package.`, variant: "destructive" });
    }
    finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenForm = (pkg: Package | null = null) => {
    setEditingPackage(pkg);
    setIsFormOpen(true);
  };

  const handleDeletePackage = async () => {
    if (!deleteCandidateId) return;
    try {
      const response = await fetch(`/api/mikrotik/packages/${deleteCandidateId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error((await response.json()).message || 'Failed to delete package');
      }
      toast({ title: 'Package Deleted', description: 'The package has been successfully deleted.' });
      fetchPackages();
    } catch (error) {
      toast({ title: 'Error', description: (error instanceof Error) ? error.message : 'An unexpected error occurred.', variant: 'destructive' });
    }
    finally {
      setDeleteCandidateId(null);
    }
  };

  const columns = getColumns(handleOpenForm, (id) => setDeleteCandidateId(id));

  const filteredPackages = useMemo(() => packages.filter(pkg => {
    const routerName = (pkg.mikrotikRouter && typeof pkg.mikrotikRouter !== 'string') ? pkg.mikrotikRouter.name : '';
    return pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) || routerName.toLowerCase().includes(searchTerm.toLowerCase());
  }), [packages, searchTerm]);

  if (loading) return <div className="flex h-screen items-center justify-center bg-zinc-900 text-white">Loading packages...</div>;
  if (error) return <div className="flex h-screen items-center justify-center bg-zinc-900 text-red-400">{error}</div>;

  return (
    <>
      <div className="flex flex-col min-h-screen bg-zinc-900 text-white">
        <Topbar />
        <div className="flex-1 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Mikrotik Packages</h1>
              <p className="text-sm text-zinc-400">A centralized hub for managing all your internet service packages.</p>
            </div>
            <Link href="/mikrotik/packages/new" passHref>
              <Button as="a" className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg transition-all duration-300 hover:scale-105">
                <Plus className="mr-2 h-4 w-4" />
                Add New Package
              </Button>
            </Link>
          </div>

          <motion.div layout className="bg-zinc-900/50 backdrop-blur-lg border-zinc-700 shadow-2xl shadow-blue-500/10 rounded-xl overflow-hidden">
            <Card className="bg-transparent border-none">
              <div className="p-4 border-b border-zinc-800">
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <Input
                    placeholder="Search by name or router..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10 h-9 bg-zinc-800 border-zinc-700"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <DataTable columns={columns} data={filteredPackages} />
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
      <PackageForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingPackage}
        isSubmitting={isSubmitting}
      />
      <AlertDialog open={!!deleteCandidateId} onOpenChange={() => setDeleteCandidateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the package.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePackage}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
