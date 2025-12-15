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
import { Plus } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { getColumns } from "./columns";
import { Topbar } from "@/components/topbar";
import { Voucher } from "@/types/voucher";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isLoggingOut } = useAuth();
  const { toast } = useToast();
  const [deleteCandidateBatchId, setDeleteCandidateBatchId] = useState<string | null>(null);

  // Table states
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

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

  const handleDeleteBatch = async () => {
    if (!deleteCandidateBatchId) return;
    try {
      const response = await fetch(`/api/hotspot/vouchers/batch/${deleteCandidateBatchId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error((await response.json()).message || 'Failed to delete batch');
      }
      toast({ title: 'Batch Deleted', description: 'The voucher batch has been successfully deleted.' });
      fetchVouchers();
    } catch (error) {
      toast({ title: 'Error', description: (error instanceof Error) ? error.message : 'An unexpected error occurred.', variant: 'destructive' });
    }
    finally {
      setDeleteCandidateBatchId(null);
    }
  };

  const columns = useMemo(() => getColumns(user, setDeleteCandidateBatchId), [user]);

  const table = useReactTable({
    data: vouchers,
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
            <div className="flex items-center gap-2">
              {/* Mobile: Icon-only button */}
              <Button asChild size="icon" className="sm:hidden bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg transition-all duration-300 hover:scale-105">
                <Link href="/hotspot/vouchers/new"><Plus className="h-4 w-4" /></Link>
              </Button>
              {/* Desktop: Full button */}
              <Button asChild className="hidden sm:flex bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg transition-all duration-300 hover:scale-105">
                <Link href="/hotspot/vouchers/new"><Plus className="mr-2 h-4 w-4" />Generate Vouchers</Link>
              </Button>
            </div>
          </div>

          <div className="bg-zinc-900/50 backdrop-blur-lg shadow-2xl shadow-blue-500/10 rounded-xl overflow-hidden">
            <Card className="bg-transparent border-none">
              <CardContent className="p-4 space-y-4">
                <div className="overflow-x-auto">
                  <DataTable table={table} columns={columns} />
                </div>
                <DataTablePagination table={table} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <AlertDialog open={!!deleteCandidateBatchId} onOpenChange={() => setDeleteCandidateBatchId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the entire batch of vouchers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBatch}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
