'use client';

import { TransactionList } from '../components/transaction-list';
import * as dailyTransactionService from '@/lib/dailyTransactionService';
import { DailyTransaction } from '@/types/daily-transaction';

const adaptedDailyTransactionService = {
  getTransactions: dailyTransactionService.getDailyTransactions,
  deleteTransaction: dailyTransactionService.deleteDailyTransaction,
  getStats: dailyTransactionService.getDailyTransactionStats,
  getMonthlyTotals: dailyTransactionService.getMonthlyTransactionTotals,
};

export default function PersonalTransactionsPage() {
  return (
    <TransactionList<DailyTransaction>
      title="Personal Transactions"
      description="Manage all personal transactions."
      addTransactionLink="/transactions/new/personal"
      transactionService={adaptedDailyTransactionService}
      category="Personal"
    />
  );
}
