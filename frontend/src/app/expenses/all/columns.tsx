import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Expense } from "@/types/expenses"

declare module "@tanstack/react-table" {
  interface TableMeta<TData> {
    handleEdit?: (expense: TData) => void;
    handleDelete?: (id: string) => void;
  }
}

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.

export const columns: ColumnDef<Expense>[] = [
  {
    id: "rowNumber",
    header: "#",
    cell: ({ row }) => {
      return <div>{row.index + 1}</div>;
    },
  },
  {
    accessorKey: "title",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Expense Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "amount",
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"))
      const formatted = new Intl.NumberFormat("en-KE", {
        style: "currency",
        currency: "KES",
      }).format(amount)

      return <div className="text-right font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: "expenseType",
    header: "Type",
    cell: ({ row }) => {
      const expenseType = row.original.expenseType
      return <div>{expenseType?.name || "N/A"}</div>
    },
    filterFn: (row, columnId, value) => {
      return row.original.expenseType.name === value
    },
  },
  {
    accessorKey: "expenseDate",
    header: "Expense Date",
    cell: ({ row }) => {
      return new Date(row.getValue("expenseDate")).toLocaleString()
    },
    filterFn: (row, columnId, filterValue) => {
        const date = new Date(row.getValue(columnId));
        const { from, to } = filterValue as { from?: Date, to?: Date };
        if (from && !to) {
            return date >= from;
        } else if (!from && to) {
            const toDate = new Date(to);
            toDate.setHours(23, 59, 59, 999); // Include the whole 'to' day
            return date <= toDate;
        } else if (from && to) {
            const toDate = new Date(to);
            toDate.setHours(23, 59, 59, 999); // Include the whole 'to' day
            return date >= from && date <= toDate;
        }
        return true;
    }
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const expense = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-zinc-800 text-white border-zinc-700">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => table.options.meta?.handleEdit && table.options.meta.handleEdit(expense)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => table.options.meta?.handleDelete && table.options.meta.handleDelete(expense._id)} className="text-red-600">
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
