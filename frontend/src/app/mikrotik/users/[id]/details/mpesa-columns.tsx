import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";

export interface MpesaTransaction {
  _id: string;
  transactionId: string;
  amount: number;
  referenceNumber: string;
  officialName: string;
  msisdn: string;
  transactionDate: string; // Assuming it comes as a string from the API
  balance?: number;
  createdAt: string;
  updatedAt: string;
}

export const getMpesaColumns = (): ColumnDef<MpesaTransaction>[] => {
  return [
    {
      accessorKey: "sn",
      header: "SN",
      cell: ({ row }) => row.index + 1, // Serial Number
      enableSorting: false,
    },
    {
      accessorKey: "officialName",
      header: ({ column }) => {
        return (
          <Button
            variant="outline"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
          >
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    },
    {
      accessorKey: "amount",
      header: ({ column }) => {
        return (
          <Button
            variant="outline"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
          >
            Amount
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => `KES ${row.original.amount.toFixed(2)}`,
    },
    {
      accessorKey: "transactionId",
      header: ({ column }) => {
        return (
          <Button
            variant="outline"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
          >
            Mpesa Code
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    },
    {
      accessorKey: "transactionDate",
      header: ({ column }) => {
        return (
          <Button
            variant="outline"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
          >
            Time
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => format(new Date(row.original.transactionDate), "MMM dd, yyyy HH:mm"),
    },
  ];
};