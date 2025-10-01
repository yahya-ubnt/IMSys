export interface Transaction {
  _id: string;
  date: string;
  amount: number;
  method: 'M-Pesa' | 'Bank' | 'Cash';
  transactionMessage: string;
  description: string;
  label: string;
  transactionId?: string;
  transactionDate?: string;
  transactionTime?: string;
  senderReceiverName?: string;
  phoneNumber?: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionStats {
  today: { personal: number; company: number; total: number; };
  thisWeek: { personal: number; company: number; total: number; };
  thisMonth: { personal: number; company: number; total: number; };
  thisYear: { personal: number; company: number; total: number; };
}

export interface MonthlyTotalData {
  month: number;
  total: number;
}