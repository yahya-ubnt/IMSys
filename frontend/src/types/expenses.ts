import { User } from './users'; // Assuming you have a user type defined

export interface ExpenseType {
  _id: string;
  name: string;
  description?: string;
  status: 'Active' | 'Inactive';
  addedBy: User;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  _id: string;
  title: string;
  amount: number;
  expenseType: ExpenseType;
  expenseBy: User;
  description?: string;
  expenseDate: string;
  status: 'Due' | 'Paid';
  createdAt: string;
  updatedAt: string;
}
