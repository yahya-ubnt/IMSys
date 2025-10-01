export type Bill = {
  _id: string;
  name: string;
  amount: number;
  dueDate: number; // Day of the month (1-31)
  category: 'Personal' | 'Company';
  status: 'Paid' | 'Not Paid';
  paymentDate?: Date; // Optional, if paid
  method?: 'M-Pesa' | 'Bank' | 'Cash'; // Optional, if paid
  transactionMessage?: string;
  description?: string;
  month: number; // 1-12
  year: number;
  createdAt: Date;
  updatedAt: Date;
  user: string; // User ID
};