'use client';

import { useReactTable, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel } from '@tanstack/react-table';
import { DataTable } from '@/components/data-table';
import { getColumns } from '@/app/payments/wallet-transactions/columns';
import { WalletTransaction } from '@/app/payments/wallet-transactions/page';

interface WalletTransactionsTableProps {
  data: WalletTransaction[];
}

export function WalletTransactionsTable({ data }: WalletTransactionsTableProps) {
  const columns = getColumns();
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="w-full">
      <DataTable
        table={table}
        columns={columns}
      />
    </div>
  );
}
