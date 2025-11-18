'use client';

import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
} from "@tanstack/react-table";
import { DataTable } from '@/components/data-table';
import { columns, WalletTransaction } from '../../app/mikrotik/users/[id]/details/wallet-columns';

interface WalletTransactionTableProps {
  data: WalletTransaction[];
}

export function WalletTransactionTable({ data }: WalletTransactionTableProps) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return <DataTable table={table} columns={columns} />;
}
