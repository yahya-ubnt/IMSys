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

export default function CompanyTransactionsPage() {
  return (
    <TransactionList<DailyTransaction>
      title="Company Transactions"
      description="Manage all company transactions."
      addTransactionLink="/transactions/new/company"
      transactionService={adaptedDailyTransactionService}
      category="Company"
    />
  );
}
