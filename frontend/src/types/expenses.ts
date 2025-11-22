import { User } from './users'; // Assuming you have a user type defined

export interface ExpenseType {
  _id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  _id: string;
  title: string;
  amount: number;
  expenseType: ExpenseType;
  description?: string;
  expenseDate: string;
  createdAt: string;
  updatedAt: string;
}
