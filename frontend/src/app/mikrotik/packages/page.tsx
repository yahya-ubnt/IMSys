"use client"

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
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
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/data-table";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { getColumns } from "./columns";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PackageForm, PackageFormData } from "./package-form";
import { Package } from "@/types/mikrotik-package";
import { Topbar } from "@/components/topbar";

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isLoggingOut } = useAuth();
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);

  // Table states
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  const [globalFilter, setGlobalFilter] = useState('');

  const fetchPackages = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/mikrotik/packages');
      if (!response.ok) throw new Error(`Failed to fetch packages: ${response.statusText}`);
      setPackages(await response.json());
    } catch (err: unknown) {
      setError((err instanceof Error) ? err.message : 'Failed to fetch packages');
    }
    finally {
      setLoading(false);
    }
  }, []);

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
        headers: { "Content-Type": "application/json" },
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

  const columns = useMemo(() => getColumns(user, handleOpenForm, (id) => setDeleteCandidateId(id)), [user]);

  const table = useReactTable({
    data: packages,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: fuzzyFilter, // Add this line
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      pagination,
      globalFilter,
    },
  })

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
            <div className="flex items-center gap-2">
              {/* Mobile: Icon-only button */}
              <Button asChild size="icon" className="sm:hidden bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg transition-all duration-300 hover:scale-105">
                <Link href="/mikrotik/packages/new"><Plus className="h-4 w-4" /></Link>
              </Button>
              {/* Desktop: Full button */}
              <Button asChild className="hidden sm:flex bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg transition-all duration-300 hover:scale-105">
                <Link href="/mikrotik/packages/new"><Plus className="mr-2 h-4 w-4" />Add New Package</Link>
              </Button>
            </div>
          </div>

          <div className="bg-zinc-900/50 backdrop-blur-lg shadow-2xl shadow-blue-500/10 rounded-xl overflow-hidden">
            <Card className="bg-transparent border-none">
              <CardContent className="p-4 space-y-4">
                <DataTableToolbar table={table} />
                <div className="overflow-x-auto">
                  <DataTable table={table} columns={columns} />
                </div>
                <DataTablePagination table={table} />
              </CardContent>
            </Card>
          </div>
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

// --- SUB-COMPONENTS ---
const DataTableToolbar = ({ table }: { table: ReturnType<typeof useReactTable<Package>> }) => (
  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-2 bg-zinc-800/50 rounded-lg">
    <div className="relative w-full sm:max-w-xs">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
      <Input
        placeholder="Search all columns..."
        value={(table.getState().globalFilter as string) ?? ""}
        onChange={(event) => table.setGlobalFilter(event.target.value)}
        className="pl-10 h-9 bg-zinc-800 border-zinc-700 w-full"
      />
    </div>
  </div>
);

// Custom fuzzy filter function for global search
const fuzzyFilter = (row: any, columnId: string, filterValue: string) => {
  const search = filterValue.toLowerCase();

  // Fields to search across
  const name = row.original.name?.toLowerCase() || '';
  const price = row.original.price?.toString().toLowerCase() || '';
  const mikrotikRouterName = row.original.mikrotikRouter?.name?.toLowerCase() || '';
  const downloadSpeed = row.original.downloadSpeed?.toLowerCase() || '';
  const uploadSpeed = row.original.uploadSpeed?.toLowerCase() || '';

  return (
    name.includes(search) ||
    price.includes(search) ||
    mikrotikRouterName.includes(search) ||
    downloadSpeed.includes(search) ||
    uploadSpeed.includes(search)
  );
};
