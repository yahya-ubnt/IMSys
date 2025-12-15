'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Topbar } from '@/components/topbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Hash, AlertTriangle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from "@/components/ui/badge"

// --- TYPE DEFINITIONS ---
// This should be moved to a central types file later
type Invoice = {
  _id: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  status: "Paid" | "Unpaid" | "Overdue" | "Void";
  mikrotikUser: {
    _id: string;
    officialName: string;
  };
  items: {
    description: string;
    amount: number;
  }[];
  billingPeriodStart: string;
  billingPeriodEnd: string;
  createdAt: string;
  paidDate?: string;
};

const DetailItem = ({ label, value, children }: { label: string, value?: string | null, children?: React.ReactNode }) => (
    <div className="flex flex-col space-y-1">
        <p className="text-sm font-medium text-zinc-400">{label}</p>
        <div className="text-base text-white">{children || value || 'N/A'}</div>
    </div>
);

export default function InvoiceDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!id) {
        setError('Invoice ID is missing.');
        setLoading(false);
        return;
      }
      try {
        // This should be moved to a service file like /lib/invoiceService.ts
        const res = await fetch(`/api/invoices/${id}`);
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Failed to fetch invoice details.');
        }
        const data = await res.json();
        setInvoice(data);
      } catch (err: unknown) {
        const errorMessage = (err instanceof Error) ? err.message : 'An unknown error occurred.';
        setError(errorMessage);
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id, toast]);

  const getStatusBadge = (status: Invoice['status']) => {
      let variant: "default" | "secondary" | "destructive" | "outline" = "secondary";
      let Icon = Hash;
      switch (status) {
        case "Paid":
          variant = "default";
          Icon = CheckCircle;
          break;
        case "Unpaid":
          variant = "outline";
          Icon = AlertTriangle;
          break;
        case "Overdue":
          variant = "destructive";
          Icon = AlertTriangle;
          break;
      }
      return <Badge variant={variant} className="capitalize text-base"><Icon className="mr-2 h-4 w-4" />{status}</Badge>;
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-zinc-900 text-white">
        <Topbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto"></div>
            <p className="mt-2 text-zinc-400">Loading invoice details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="flex flex-col min-h-screen bg-zinc-900 text-white">
        <Topbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center bg-zinc-800 p-8 rounded-lg shadow-lg">
            <p className="text-lg font-semibold text-red-500">{error || 'Invoice not found.'}</p>
            <Button onClick={() => router.push('/invoices')} className="mt-4 bg-red-600 hover:bg-red-700 text-white">Back to Invoices</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-zinc-900 text-white">
      <Topbar />
      <main className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Invoice Details</h1>
            <p className="text-sm text-zinc-400">Viewing invoice {invoice.invoiceNumber}.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/invoices')} className="bg-transparent border-zinc-700 hover:bg-zinc-800">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Invoices
            </Button>
            {/* Future actions like 'Download PDF' can be added here */}
          </div>
        </div>

        <div className="bg-zinc-900/50 backdrop-blur-lg shadow-2xl shadow-blue-500/10 rounded-xl max-w-5xl mx-auto">
          <Card className="bg-transparent border-none">
            <CardHeader>
              <CardTitle className="text-cyan-400 flex items-center"><FileText className="mr-2"/>Invoice {invoice.invoiceNumber}</CardTitle>
              <CardDescription className="text-zinc-400">Details for this invoice.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 pt-6">
              {/* Invoice & Client Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 border-b border-zinc-800 pb-6">
                <DetailItem label="Customer" value={invoice.mikrotikUser.officialName} />
                <DetailItem label="Status">
                    {getStatusBadge(invoice.status)}
                </DetailItem>
                <DetailItem label="Date Issued" value={format(new Date(invoice.createdAt), 'PPP')} />
                <DetailItem label="Due Date" value={format(new Date(invoice.dueDate), 'PPP')} />
              </div>

              {/* Line Items Table */}
              <div>
                <h3 className="text-lg font-semibold text-cyan-400 mb-4">Line Items</h3>
                <div className="border border-zinc-700 rounded-md">
                  <div className="w-full text-sm text-left text-zinc-400">
                    <div className="bg-zinc-800/50 grid grid-cols-3 gap-4 p-3 font-semibold">
                      <div className="col-span-2">Description</div>
                      <div className="text-right">Amount</div>
                    </div>
                    {invoice.items.map((item, index) => (
                      <div key={index} className="grid grid-cols-3 gap-4 p-3 border-t border-zinc-800 text-white">
                        <div className="col-span-2">{item.description}</div>
                        <div className="text-right">{new Intl.NumberFormat("en-US", { style: "currency", currency: "KES" }).format(item.amount)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-end">
                <div className="w-full max-w-xs space-y-2">
                    <div className="flex justify-between text-lg">
                        <span className="font-medium text-zinc-400">Total</span>
                        <span className="font-bold text-white">{new Intl.NumberFormat("en-US", { style: "currency", currency: "KES" }).format(invoice.amount)}</span>
                    </div>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
