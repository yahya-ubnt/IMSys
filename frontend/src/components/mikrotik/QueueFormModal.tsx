'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth-provider';

// Helper to format rate from bps to human-readable format (e.g., 1000000 -> 1M)
const formatRateForDisplay = (rateStr?: string): string => {
  if (!rateStr) return '';
  // If the value is already formatted, return it as is.
  if (/[kMG]$/i.test(rateStr)) {
    return rateStr;
  }
  const rate = parseInt(rateStr, 10);
  if (isNaN(rate)) return rateStr;
  if (rate === 0) return '0';
  if (rate % 1000000000 === 0) return `${rate / 1000000000}G`;
  if (rate % 1000000 === 0) return `${rate / 1000000}M`;
  if (rate % 1000 === 0) return `${rate / 1000}k`;
  return rateStr; // Return original if no clean conversion is possible
};

// Helper to format the 'max-limit' property which can be 'upload/download'
const formatMaxLimitForDisplay = (maxLimit?: string): string => {
  if (!maxLimit) return '';
  const parts = maxLimit.split('/');
  if (parts.length === 2) {
    return `${formatRateForDisplay(parts[0])}/${formatRateForDisplay(parts[1])}`;
  }
  return formatRateForDisplay(maxLimit);
};

interface MikroTikQueueApiData {
  '.id'?: string; // Added missing property
  name: string;
  target: string;
  'max-limit': string;
  'burst-limit': string;
  'burst-threshold': string;
  'burst-time': string;
  priority: string;
  parent: string;
  comment: string;
  'limit-at': string;
  disabled: 'yes' | 'no'; // This should be a string for the API
}


interface QueueFormProps {
  isOpen: boolean;
  onClose: () => void;
  queue?: MikroTikQueueApiData; // Optional, for editing existing queue
  routerId: string;
  onSuccess: () => void; // Callback to refresh queues list
}

export function QueueFormModal({ isOpen, onClose, queue, routerId, onSuccess }: QueueFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    target: '',
    'max-limit': '',
    'burst-limit': '',
    'burst-threshold': '',
    'burst-time': '1s',
    priority: '8',
    parent: '',
    comment: '',
    'limit-at': '',
    disabled: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    if (isOpen) {
      if (queue) {
        // Editing an existing queue
        setFormData({
          name: queue.name || '',
          target: queue.target || '',
          'max-limit': formatMaxLimitForDisplay(queue['max-limit']),
          'burst-limit': formatMaxLimitForDisplay(queue['burst-limit']),
          'burst-threshold': formatMaxLimitForDisplay(queue['burst-threshold']),
          'burst-time': queue['burst-time'] || '1s',
          priority: queue.priority || '8',
          parent: queue.parent || '',
          comment: queue.comment || '',
          'limit-at': formatMaxLimitForDisplay(queue['limit-at']),
          disabled: queue.disabled === 'yes',
        });
      } else {
        // Adding a new queue, reset to defaults
        setFormData({
          name: '',
          target: '',
          'max-limit': '',
          'burst-limit': '',
          'burst-threshold': '',
          'burst-time': '1s',
          priority: '8',
          parent: '',
          comment: '',
          'limit-at': '',
          disabled: false, // Enabled by default
        });
      }
      setError(null); // Clear any previous errors when modal opens
    }
  }, [isOpen, queue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!token) {
      setError('Authentication token not found.');
      setLoading(false);
      return;
    }

    const url = `/api/routers/${routerId}/dashboard/queues${queue ? `/${queue['.id']}` : ''}`;
    const method = queue ? 'PUT' : 'POST';

    const dataToSend: MikroTikQueueApiData = {
      name: formData.name,
      target: formData.target,
      'max-limit': formData['max-limit'],
      'burst-limit': formData['burst-limit'],
      'burst-threshold': formData['burst-threshold'],
      'burst-time': formData['burst-time'],
      priority: formData.priority,
      parent: formData.parent,
      comment: formData.comment,
      'limit-at': formData['limit-at'],
      disabled: formData.disabled ? 'yes' : 'no', // Convert boolean to 'yes' or 'no'
    };

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${queue ? 'update' : 'add'} queue`);
      }

      onSuccess(); // Refresh list
      onClose(); // Close modal
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{queue ? 'Edit Queue' : 'Add New Queue'}</DialogTitle>
          <DialogDescription>
            Make changes to your queue here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input id="name" value={formData.name} onChange={handleChange} className="col-span-3" required placeholder="e.g., Client-Queue-1" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="target" className="text-right">
              Target
            </Label>
            <Input id="target" value={formData.target} onChange={handleChange} className="col-span-3" required placeholder="e.g., 192.168.88.254/32 or 10.0.0.0/24" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="max-limit" className="text-right">
              Max Limit
            </Label>
            <Input id="max-limit" value={formData['max-limit']} onChange={handleChange} className="col-span-3" required placeholder="e.g., 10M/10M or 512k/512k" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="burst-limit" className="text-right">
              Burst Limit
            </Label>
            <Input id="burst-limit" value={formData['burst-limit']} onChange={handleChange} className="col-span-3" placeholder="e.g., 20M/20M" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="burst-threshold" className="text-right">
              Burst Threshold
            </Label>
            <Input id="burst-threshold" value={formData['burst-threshold']} onChange={handleChange} className="col-span-3" placeholder="e.g., 8M/8M" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="burst-time" className="text-right">
              Burst Time
            </Label>
            <Input id="burst-time" value={formData['burst-time']} onChange={handleChange} className="col-span-3" placeholder="e.g., 1s or 5s" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="priority" className="text-right">
              Priority
            </Label>
            <Input id="priority" value={formData.priority} onChange={handleChange} className="col-span-3" placeholder="e.g., 8 (1-8)" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="parent" className="text-right">
              Parent
            </Label>
            <Input id="parent" value={formData.parent} onChange={handleChange} className="col-span-3" placeholder="e.g., global-queue" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="comment" className="text-right">
              Comment
            </Label>
            <Input id="comment" value={formData.comment} onChange={handleChange} className="col-span-3" placeholder="e.g., Client's main queue" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="limit-at" className="text-right">
              Limit At
            </Label>
            <Input id="limit-at" value={formData['limit-at']} onChange={handleChange} className="col-span-3" placeholder="e.g., 5M/5M" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="enabled" className="text-right">
              Enabled
            </Label>
            <input
              type="checkbox"
              id="enabled"
              checked={!formData.disabled} // Invert logic: checked means enabled (not disabled)
              onChange={(e) => setFormData((prev) => ({ ...prev, disabled: !e.target.checked }))} // Invert logic
              className="col-span-3 h-5 w-5"
            />
          </div>
          {error && <p className="text-red-500 col-span-4 text-center">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : (queue ? 'Save Changes' : 'Add Queue')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
