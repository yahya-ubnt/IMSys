'use client';

import { DataTable } from '@/components/data-table';
import { getColumns } from '@/app/payments/transactions/columns';
import { Transaction } from '@/app/payments/transactions/page';

interface MpesaTransactionsTableProps {
  data: Transaction[];
}

import { useReactTable, getCoreRowModel } from '@tanstack/react-table';

export function MpesaTransactionsTable({ data }: MpesaTransactionsTableProps) {
  const columns = getColumns();

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
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
