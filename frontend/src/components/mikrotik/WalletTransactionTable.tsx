'use client';

import { DataTable } from '@/components/data-table';
import { columns, WalletTransaction } from '../../app/mikrotik/users/[id]/details/wallet-columns';

interface WalletTransactionTableProps {
  data: WalletTransaction[];
}

export function WalletTransactionTable({ data }: WalletTransactionTableProps) {
  return <DataTable columns={columns} data={data} />;
}
