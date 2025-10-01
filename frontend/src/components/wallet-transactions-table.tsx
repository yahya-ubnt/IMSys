'use client';

import { DataTable } from '@/components/data-table';
import { getColumns } from '@/app/payments/wallet-transactions/columns';
import { WalletTransaction } from '@/app/payments/wallet-transactions/page';

interface WalletTransactionsTableProps {
  data: WalletTransaction[];
}

export function WalletTransactionsTable({ data }: WalletTransactionsTableProps) {
  const columns = getColumns();

  return (
    <div className="w-full">
      <DataTable
        columns={columns}
        data={data}
        filterColumn="transactionId" // or 'userId.officialName', 'source', etc.
      />
    </div>
  );
}
