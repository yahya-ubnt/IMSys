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
import { HotspotPlanForm } from "./hotspot-plan-form";
import { Topbar } from "@/components/topbar";

// TODO: Move to a types file
interface HotspotPlan {
  _id: string;
  name: string;
  price: number;
  timeLimitValue: number;
  timeLimitUnit: string;
  dataLimitValue: number;
  dataLimitUnit: string;
  sharedUsers: number;
  profile: string;
  server: string;
  rateLimit?: string;
  mikrotikRouter: {
    _id: string;
    name: string;
  };
}

export default function HotspotPlansPage() {
  const [plans, setPlans] = useState<HotspotPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isLoggingOut } = useAuth();
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<HotspotPlan | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);

  // Table states
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/hotspot/plans');
      if (!response.ok) throw new Error(`Failed to fetch plans: ${response.statusText}`);
      setPlans(await response.json());
    } catch (err: unknown) {
      setError((err instanceof Error) ? err.message : 'Failed to fetch plans');
    }
    finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoggingOut) { setLoading(false); return; }
    fetchPlans();
  }, [fetchPlans, isLoggingOut]);

  const handleFormSubmit = async (data: any) => {
    setIsSubmitting(true);
    const method = editingPlan ? "PUT" : "POST";
    const url = editingPlan ? `/api/hotspot/plans/${editingPlan._id}` : "/api/hotspot/plans";
    const action = editingPlan ? "updated" : "created";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error((await response.json()).message || `Failed to ${action} plan`);
      toast({ title: `Plan ${action}`, description: `Plan has been successfully ${action}.` });
      setIsFormOpen(false);
      fetchPlans();
    } catch (error: unknown) {
      toast({ title: "Error", description: (error instanceof Error) ? error.message : `Failed to ${action} plan.`, variant: "destructive" });
    }
    finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenForm = (plan: HotspotPlan | null = null) => {
    setEditingPlan(plan);
    setIsFormOpen(true);
  };

  const handleDeletePlan = async () => {
    if (!deleteCandidateId) return;
    try {
      const response = await fetch(`/api/hotspot/plans/${deleteCandidateId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error((await response.json()).message || 'Failed to delete plan');
      }
      toast({ title: 'Plan Deleted', description: 'The plan has been successfully deleted.' });
      fetchPlans();
    } catch (error) {
      toast({ title: 'Error', description: (error instanceof Error) ? error.message : 'An unexpected error occurred.', variant: 'destructive' });
    }
    finally {
      setDeleteCandidateId(null);
    }
  };

  const columns = useMemo(() => getColumns(user, handleOpenForm, (id) => setDeleteCandidateId(id)), [user]);

  const table = useReactTable({
    data: plans,
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

  if (loading) return <div className="flex h-screen items-center justify-center bg-zinc-900 text-white">Loading plans...</div>;
  if (error) return <div className="flex h-screen items-center justify-center bg-zinc-900 text-red-400">{error}</div>;

  return (
    <>
      <div className="flex flex-col min-h-screen bg-zinc-900 text-white">
        <Topbar />
        <div className="flex-1 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Hotspot Plans</h1>
              <p className="text-sm text-zinc-400">A centralized hub for managing all your hotspot plans.</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Mobile: Icon-only button */}
              <Button asChild size="icon" className="sm:hidden bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg transition-all duration-300 hover:scale-105">
                <Link href="/hotspot/plans/new"><Plus className="h-4 w-4" /></Link>
              </Button>
              {/* Desktop: Full button */}
              <Button asChild className="hidden sm:flex bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg transition-all duration-300 hover:scale-105">
                <Link href="/hotspot/plans/new"><Plus className="mr-2 h-4 w-4" />Add New Plan</Link>
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
                      placeholder="Search by name or router..."
                      value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                      onChange={(event) => table.getColumn("name")?.setFilterValue(event.target.value)}
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
      <HotspotPlanForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingPlan}
        isSubmitting={isSubmitting}
      />
      <AlertDialog open={!!deleteCandidateId} onOpenChange={() => setDeleteCandidateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the plan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePlan}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
