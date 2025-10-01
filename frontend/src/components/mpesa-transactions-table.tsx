'use client';

import { DataTable } from '@/components/data-table';
import { getColumns } from '@/app/payments/transactions/columns';
import { Transaction } from '@/app/payments/transactions/page';

interface MpesaTransactionsTableProps {
  data: Transaction[];
}

export function MpesaTransactionsTable({ data }: MpesaTransactionsTableProps) {
  const columns = getColumns();

  return (
    <div className="w-full">
      <DataTable
        columns={columns}
        data={data}
        filterColumn="referenceNumber" // or 'transactionId', 'officialName', etc.
      />
    </div>
  );
}
