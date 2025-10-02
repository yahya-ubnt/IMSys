'use client';

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

const tillSchema = z.object({
  tillStoreNumber: z.string().min(1, 'Till store number is required'),
  tillNumber: z.string().min(1, 'Till number is required'),
  consumerKey: z.string().min(1, 'Consumer Key is required'),
  consumerSecret: z.string().min(1, 'Consumer Secret is required'),
  passkey: z.string().min(1, 'Passkey is required'),
});

type TillFormValues = z.infer<typeof tillSchema>;

export function MpesaTillForm() {
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActivating, setIsActivating] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<TillFormValues>({
    resolver: zodResolver(tillSchema),
    defaultValues: {
      tillStoreNumber: '',
      tillNumber: '',
      consumerKey: '',
      consumerSecret: '',
      passkey: '',
    },
  });

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/settings/mpesa');
        if (response.ok) {
          const data = await response.json();
          setSettings(data.mpesaTill);
          if (data.mpesaTill) {
            reset(data.mpesaTill);
          }
        }
      } catch (error) {
        toast.error('Failed to fetch M-Pesa settings.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, [reset]);

  const onSubmit = async (data: TillFormValues) => {
    const promise = fetch('/api/settings/mpesa', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'till', data }),
    });

    toast.promise(promise, {
      loading: 'Updating Till settings...',
      success: (res) => {
        promise.then(res => res.json()).then(data => {
            setSettings(data.mpesaTill);
            reset(data.mpesaTill);
        });
        return 'Till settings updated successfully!';
      },
      error: 'Failed to update settings.',
    });
  };

  const handleActivate = async () => {
    setIsActivating(true);
    const promise = fetch('/api/settings/mpesa/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'till' }),
    });

    toast.promise(promise, {
        loading: 'Activating M-Pesa Till...',
        success: 'Activation request sent successfully! Check status.',
        error: 'Activation failed.',
    });

    try {
        await promise;
    } finally {
        setIsActivating(false);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <div className="bg-zinc-900/50 backdrop-blur-lg border border-zinc-700/50 rounded-xl">
        <div className="p-6">
          <h3 className="text-2xl font-bold text-white mb-2">M-Pesa Till (Buy Goods) Settings</h3>
          <p className="text-zinc-400">Configure your M-Pesa Till credentials and callback URLs.</p>
        </div>
        <div className="p-6 pt-0">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div>
                  <Label htmlFor="tillStoreNumber" className="text-zinc-400">Till Store Number</Label>
                  <Controller name="tillStoreNumber" control={control} render={({ field }) => <Input {...field} className="bg-zinc-800 border-zinc-700 text-white" />} />
                  {errors.tillStoreNumber && <p className="text-red-500 text-sm mt-1">{errors.tillStoreNumber.message}</p>}
                </div>
                 <div>
                  <Label htmlFor="tillNumber" className="text-zinc-400">Till Number</Label>
                  <Controller name="tillNumber" control={control} render={({ field }) => <Input {...field} className="bg-zinc-800 border-zinc-700 text-white" />} />
                  {errors.tillNumber && <p className="text-red-500 text-sm mt-1">{errors.tillNumber.message}</p>}
                </div>
                <div>
                  <Label htmlFor="consumerKey" className="text-zinc-400">Consumer Key</Label>
                  <Controller name="consumerKey" control={control} render={({ field }) => <Input {...field} className="bg-zinc-800 border-zinc-700 text-white" />} />
                  {errors.consumerKey && <p className="text-red-500 text-sm mt-1">{errors.consumerKey.message}</p>}
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="consumerSecret" className="text-zinc-400">Consumer Secret</Label>
                  <Controller name="consumerSecret" control={control} render={({ field }) => <Input type="password" {...field} className="bg-zinc-800 border-zinc-700 text-white" />} />
                  {errors.consumerSecret && <p className="text-red-500 text-sm mt-1">{errors.consumerSecret.message}</p>}
                </div>
                <div>
                  <Label htmlFor="passkey" className="text-zinc-400">Passkey</Label>
                  <Controller name="passkey" control={control} render={({ field }) => <Input type="password" {...field} className="bg-zinc-800 border-zinc-700 text-white" />} />
                  {errors.passkey && <p className="text-red-500 text-sm mt-1">{errors.passkey.message}</p>}
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={!isDirty} className="bg-blue-600 hover:bg-blue-700 text-white">
                Update Settings
              </Button>
            </div>
          </form>
        </div>
        <div className="p-6 border-t border-zinc-700/50">
            <div className="flex justify-between items-center">
                <div>
                    <h4 className="font-semibold text-white">Activate M-Pesa</h4>
                    <p className="text-zinc-400 text-sm">Register your callback URLs with Safaricom to start receiving payments.</p>
                </div>
                <Button onClick={handleActivate} disabled={isActivating || settings?.activated} className="bg-green-600 hover:bg-green-700 text-white">
                    {settings?.activated ? 'Activated' : 'Activate M-Pesa'}
                </Button>
            </div>
             <Alert className="mt-4 bg-zinc-800/50 border-zinc-700 text-zinc-300">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Callback URLs</AlertTitle>
                <AlertDescription className="text-xs text-zinc-400">
                    <p>Confirmation: <code className="font-mono">/api/payments/c2b-confirmation</code></p>
                    <p>Validation: <code className="font-mono">/api/payments/c2b-validation</code></p>
                </AlertDescription>
            </Alert>
        </div>
      </div>
    </motion.div>
  );
}