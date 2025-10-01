export interface Expense {
  _id: string;
  date: string; // ISO date string
  amount: number;
  method: 'M-Pesa' | 'Bank' | 'Cash';
  transactionMessage: string;
  description: string;
  label: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}
