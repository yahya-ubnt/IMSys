export interface DailyTransaction {
  _id: string;
  date: string;
  amount: number;
  method: 'M-Pesa' | 'Bank' | 'Cash';
  transactionMessage: string;
  description: string;
  label: string;
  transactionId?: string;
  transactionDate: string;
  transactionTime?: string;
  senderReceiverName?: string;
  phoneNumber?: string;
  transactionCost?: number;
  createdAt: string;
  updatedAt: string;
}
