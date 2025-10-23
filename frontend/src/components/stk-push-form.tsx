'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle } from 'lucide-react';

export default function StkPushForm() {
  const [amount, setAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [accountReference, setAccountReference] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/payments/initiate-stk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount, phoneNumber, accountReference }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to initiate STK push.');
      }

      setMessage({ type: 'success', text: `Successfully initiated STK push! (CheckoutID: ${data.checkoutRequestID})` });
      // Clear form on success
      setAmount('');
      setPhoneNumber('');
      setAccountReference('');

    } catch (error) {
        setMessage({ type: 'error', text: (error as Error).message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="phoneNumber" className="text-zinc-300">Phone Number</Label>
        <Input
          id="phoneNumber"
          type="text"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="e.g., 254712345678"
          required
          disabled={isLoading}
          className="bg-zinc-800 border-zinc-700 focus:ring-cyan-500"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="amount" className="text-zinc-300">Amount</Label>
        <Input
          id="amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="e.g., 100"
          required
          disabled={isLoading}
          className="bg-zinc-800 border-zinc-700 focus:ring-cyan-500"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="accountReference" className="text-zinc-300">Account Reference</Label>
        <Input
          id="accountReference"
          type="text"
          value={accountReference}
          onChange={(e) => setAccountReference(e.target.value)}
          placeholder="The user's account ID"
          required
          disabled={isLoading}
          className="bg-zinc-800 border-zinc-700 focus:ring-cyan-500"
        />
      </div>
      
      <div className="pt-2">
        <Button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white">
          {isLoading ? 'Sending...' : 'Send STK Push'}
        </Button>
      </div>

      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className="mt-4 w-full bg-opacity-50">
          {message.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertDescription>
            {message.text}
          </AlertDescription>
        </Alert>
      )}
    </form>
  );
}