'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { createTransaction } from '@/lib/transactionService';
import { Topbar } from '@/components/topbar';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, ArrowLeft, Save, ChevronRight, ChevronLeft, Loader2, ClipboardPaste, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { parseMpesaSms } from '@/lib/mpesaSmsParser';
import { motion, AnimatePresence } from 'framer-motion';

// --- Step Indicator ---
const StepIndicator = ({ currentStep }: { currentStep: number }) => (
    <div className="flex items-center justify-center gap-3">
        <div className="flex items-center gap-2"><div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all duration-300 ${currentStep === 1 ? 'bg-blue-600 text-white' : 'bg-zinc-700 text-zinc-400'}`}>1</div><span className={`text-sm transition-colors ${currentStep === 1 ? 'text-blue-400' : 'text-zinc-500'}`}>Auto-fill</span></div>
        <div className={`w-12 h-px transition-colors ${currentStep === 2 ? 'bg-blue-500' : 'bg-zinc-700'}`}></div>
        <div className="flex items-center gap-2"><div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all duration-300 ${currentStep === 2 ? 'bg-blue-600 text-white' : 'bg-zinc-700 text-zinc-400'}`}>2</div><span className={`text-sm transition-colors ${currentStep === 2 ? 'text-blue-400' : 'text-zinc-500'}`}>Details</span></div>
    </div>
);

// --- Framer Motion Variants ---
const formVariants = {
    hidden: (direction: number) => ({ opacity: 0, x: direction > 0 ? 50 : -50 }),
    visible: { opacity: 1, x: 0, transition: { duration: 0.2, ease: "easeInOut" } },
    exit: (direction: number) => ({ opacity: 0, x: direction < 0 ? 50 : -50, transition: { duration: 0.2, ease: "easeInOut" } }),
};

export default function AddNewCompanyTransactionPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);

  const [formData, setFormData] = useState({
    transactionId: '',
    transactionDate: '',
    transactionTime: '',
    amount: '',
    method: 'Cash' as 'M-Pesa' | 'Bank' | 'Cash',
    transactionMessage: '',
    description: '',
    label: '',
    receiverEntity: '',
    phoneNumber: '',
    transactionCost: '',
  });
  const [loading, setLoading] = useState(false);
  const [mpesaSmsInput, setMpesaSmsInput] = useState('');

  const handleParseSms = () => {
    try {
      const parsed = parseMpesaSms(mpesaSmsInput);
      setFormData(prev => ({
        ...prev,
        transactionId: parsed.transactionId || prev.transactionId,
        transactionDate: parsed.date || prev.transactionDate,
        transactionTime: parsed.time || prev.transactionTime,
        amount: parsed.amount ? parsed.amount.toString() : prev.amount,
        method: 'M-Pesa',
        transactionMessage: mpesaSmsInput,
        receiverEntity: parsed.receiverEntity || prev.receiverEntity,
        phoneNumber: parsed.phoneNumber || prev.phoneNumber,
        transactionCost: parsed.transactionCost ? parsed.transactionCost.toString() : prev.transactionCost,
      }));
      toast({ title: 'SMS Parsed', description: 'Transaction details extracted and pre-filled.' });
      handleNext();
    } catch (err: unknown) {
      toast({ title: 'Parsing Error', description: err instanceof Error ? err.message : 'Failed to parse M-Pesa SMS.', variant: 'destructive' });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleSelectChange = (name: string, value: string) => setFormData({ ...formData, [name]: value });
  const handleDateChange = (date: Date | undefined) => setFormData({ ...formData, transactionDate: date ? format(date, 'yyyy-MM-dd') : '' });

  const handleNext = () => { setDirection(1); setStep(2); };
  const handleBack = () => { setDirection(-1); setStep(1); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const transactionData = {
        ...formData,
        amount: parseFloat(formData.amount),
        category: 'Company',
        date: `${formData.transactionDate}T${formData.transactionTime}`
      };
      await createTransaction(transactionData);
      toast({ title: 'Transaction Added', description: 'New company transaction has been successfully recorded.' });
      router.push(`/transactions/company`);
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to add transaction.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-900 text-white">
      <Topbar />
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/transactions/company"><Button variant="ghost" size="icon" className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">New Company Transaction</h1>
            <p className="text-sm text-zinc-400">Record a new company transaction.</p>
          </div>
        </div>

        <div className="flex justify-center">
          <div className="w-full max-w-3xl">
            <motion.div layout className="bg-zinc-900/50 backdrop-blur-lg border-zinc-700 shadow-2xl shadow-blue-500/10 rounded-xl overflow-hidden">
              <Card className="bg-transparent border-none">
                <CardHeader className="p-4 border-b border-zinc-800"><StepIndicator currentStep={step} /></CardHeader>
                <form onSubmit={handleSubmit}>
                  <CardContent className="p-5">
                    <AnimatePresence mode="wait" custom={direction}>
                      {step === 1 ? (
                        <motion.div key={1} custom={direction} variants={formVariants} initial="hidden" animate="visible" exit="exit" className="space-y-3">
                          <CardTitle className="text-base text-cyan-400 border-b border-zinc-800 pb-2 mb-3 flex items-center gap-2"><ClipboardPaste size={18} /> Auto-fill from M-Pesa SMS</CardTitle>
                          <Textarea placeholder="Paste the full M-Pesa SMS message here..." value={mpesaSmsInput} onChange={(e) => setMpesaSmsInput(e.target.value)} rows={5} className="bg-zinc-800 border-zinc-700 text-sm" />
                          <Button type="button" onClick={handleParseSms} disabled={!mpesaSmsInput.trim()} className="w-full">Parse & Continue</Button>
                        </motion.div>
                      ) : (
                        <motion.div key={2} custom={direction} variants={formVariants} initial="hidden" animate="visible" exit="exit" className="space-y-3">
                          <CardTitle className="text-base text-cyan-400 border-b border-zinc-800 pb-2 mb-3 flex items-center gap-2"><FileText size={18} /> Transaction Details</CardTitle>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1"><Label className="text-xs">Transaction ID</Label><Input name="transactionId" value={formData.transactionId} onChange={handleChange} className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
                            <div className="space-y-1"><Label className="text-xs">Transaction Date</Label>
                              <Popover>
                                <PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start text-left font-normal h-9 bg-zinc-800 border-zinc-700 text-sm hover:bg-zinc-700", !formData.transactionDate && "text-zinc-400")}>{formData.transactionDate ? format(new Date(formData.transactionDate), "PPP") : "Pick a date"}<CalendarIcon className="ml-auto h-4 w-4" /></Button></PopoverTrigger>
                                <PopoverContent className="w-auto p-0 bg-zinc-800 text-white border-zinc-700"><Calendar mode="single" selected={formData.transactionDate ? new Date(formData.transactionDate) : undefined} onSelect={handleDateChange} initialFocus /></PopoverContent>
                              </Popover>
                            </div>
                            <div className="space-y-1"><Label className="text-xs">Transaction Time</Label><Input name="transactionTime" value={formData.transactionTime} onChange={handleChange} className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
                            <div className="space-y-1"><Label className="text-xs">Amount</Label><Input name="amount" type="number" value={formData.amount} onChange={handleChange} required className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
                            <div className="space-y-1"><Label className="text-xs">Receiver/Entity</Label><Input name="receiverEntity" value={formData.receiverEntity} onChange={handleChange} className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
                            <div className="space-y-1"><Label className="text-xs">Phone Number</Label><Input name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
                            <div className="space-y-1"><Label className="text-xs">Payment Method</Label>
                              <Select name="method" value={formData.method} onValueChange={(v) => handleSelectChange('method', v)}>
                                <SelectTrigger className="bg-zinc-800 border-zinc-700 h-9 text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-zinc-800 text-white border-zinc-700"><SelectItem value="M-Pesa">M-Pesa</SelectItem><SelectItem value="Bank">Bank</SelectItem><SelectItem value="Cash">Cash</SelectItem></SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1"><Label className="text-xs">Label/Category</Label><Input name="label" value={formData.label} onChange={handleChange} required className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
                            <div className="space-y-1 sm:col-span-2"><Label className="text-xs">Description</Label><Textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="bg-zinc-800 border-zinc-700 text-sm" /></div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                  <CardFooter className="p-4 flex items-center justify-between border-t border-zinc-800">
                    <div>{step > 1 && <Button type="button" variant="outline" size="sm" onClick={handleBack}><ChevronLeft className="mr-1 h-4 w-4" />Back</Button>}</div>
                    <div>
                      {step === 1 && <Button type="button" size="sm" onClick={handleNext}>Skip & Enter Manually<ChevronRight className="ml-1 h-4 w-4" /></Button>}
                      {step === 2 && <Button type="submit" size="sm" disabled={loading} className="bg-gradient-to-r from-blue-600 to-cyan-500">{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}{loading ? "Saving..." : "Save Transaction"}</Button>}
                    </div>
                  </CardFooter>
                </form>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}