"use client"

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
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
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/data-table";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { getColumns } from "./columns.tsx";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { HotspotUserForm } from "./hotspot-user-form";
import { Topbar } from "@/components/topbar";

// TODO: Move to a types file
interface HotspotUser {
  _id: string;
  officialName: string;
  hotspotName: string;
  profile: string;
  server: string;
  phoneNumber: string;
  mikrotikRouter: {
    _id: string;
    name: string;
  };
}

export default function HotspotUsersPage() {
  const [users, setUsers] = useState<HotspotUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isLoggingOut } = useAuth();
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<HotspotUser | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);

  // Table states
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/hotspot/users');
      if (!response.ok) throw new Error(`Failed to fetch users: ${response.statusText}`);
      setUsers(await response.json());
    } catch (err: unknown) {
      setError((err instanceof Error) ? err.message : 'Failed to fetch users');
    }
    finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoggingOut) { setLoading(false); return; }
    fetchUsers();
  }, [fetchUsers, isLoggingOut]);

  const handleFormSubmit = async (data: any) => {
    setIsSubmitting(true);
    const method = editingUser ? "PUT" : "POST";
    const url = editingUser ? `/api/hotspot/users/${editingUser._id}` : "/api/hotspot/users";
    const action = editingUser ? "updated" : "created";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error((await response.json()).message || `Failed to ${action} user`);
      toast({ title: `User ${action}`, description: `User has been successfully ${action}.` });
      setIsFormOpen(false);
      fetchUsers();
    } catch (error: unknown) {
      toast({ title: "Error", description: (error instanceof Error) ? error.message : `Failed to ${action} user.`, variant: "destructive" });
    }
    finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenForm = (user: HotspotUser | null = null) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!deleteCandidateId) return;
    try {
      const response = await fetch(`/api/hotspot/users/${deleteCandidateId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error((await response.json()).message || 'Failed to delete user');
      }
      toast({ title: 'User Deleted', description: 'The user has been successfully deleted.' });
      fetchUsers();
    } catch (error) {
      toast({ title: 'Error', description: (error instanceof Error) ? error.message : 'An unexpected error occurred.', variant: 'destructive' });
    }
    finally {
      setDeleteCandidateId(null);
    }
  };

  const columns = useMemo(() => getColumns(user, handleOpenForm, (id) => setDeleteCandidateId(id)), [user]);

  const table = useReactTable({
    data: users,
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

  if (loading) return <div className="flex h-screen items-center justify-center bg-zinc-900 text-white">Loading users...</div>;
  if (error) return <div className="flex h-screen items-center justify-center bg-zinc-900 text-red-400">{error}</div>;

  return (
    <>
      <div className="flex flex-col min-h-screen bg-zinc-900 text-white">
        <Topbar />
        <div className="flex-1 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Hotspot Users</h1>
              <p className="text-sm text-zinc-400">Manage your recurring hotspot users.</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Mobile: Icon-only button */}
              <Button asChild size="icon" className="sm:hidden bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg transition-all duration-300 hover:scale-105">
                <Link href="/hotspot/users/new"><Plus className="h-4 w-4" /></Link>
              </Button>
              {/* Desktop: Full button */}
              <Button asChild className="hidden sm:flex bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg transition-all duration-300 hover:scale-105">
                <Link href="/hotspot/users/new"><Plus className="mr-2 h-4 w-4" />Add New User</Link>
              </Button>
            </div>
          </div>

          <div className="bg-zinc-900/50 backdrop-blur-lg shadow-2xl shadow-blue-500/10 rounded-xl overflow-hidden">
            <Card className="bg-transparent border-none">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-end">
                  <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <Input
                      placeholder="Search by name or username..."
                      value={(table.getColumn("officialName")?.getFilterValue() as string) ?? ""}
                      onChange={(event) => table.getColumn("officialName")?.setFilterValue(event.target.value)}
                      className="pl-10 h-9 bg-zinc-800 border-zinc-700"
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <DataTable table={table} columns={columns} />
                </div>
                <DataTablePagination table={table} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <HotspotUserForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingUser}
        isSubmitting={isSubmitting}
      />
      <AlertDialog open={!!deleteCandidateId} onOpenChange={() => setDeleteCandidateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
