'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label"; // Assuming a Label component exists
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Assuming a Select component exists

// Define the shape of the data the form handles
export interface SmsExpiryScheduleFormData {
  name: string;
  days: number;
  timing: 'Before' | 'After' | 'Not Applicable';
  messageBody: string;
  status: 'Active' | 'Inactive';
}

interface SmsExpiryScheduleFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SmsExpiryScheduleFormData) => void;
  initialData?: Partial<SmsExpiryScheduleFormData> | null;
}

export const SmsExpiryScheduleForm: React.FC<SmsExpiryScheduleFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [formData, setFormData] = useState<SmsExpiryScheduleFormData>({
    name: '',
    days: 0,
    timing: 'Before',
    messageBody: '',
    status: 'Active',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        days: initialData.days || 0,
        timing: initialData.timing || 'Before',
        messageBody: initialData.messageBody || '',
        status: initialData.status || 'Active',
      });
    } else {
      setFormData({
        name: '',
        days: 0,
        timing: 'Before',
        messageBody: '',
        status: 'Active',
      });
    }
  }, [initialData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: id === 'days' ? Number(value) : value }));
  };

  const handleSelectChange = (field: keyof SmsExpiryScheduleFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-zinc-900 text-white border-zinc-700">
        <DialogHeader className="border-b border-zinc-700 pb-4">
          <DialogTitle className="text-blue-400">{initialData ? 'Edit Expiry Schedule' : 'Create New Expiry Schedule'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right text-zinc-300">
                Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={handleChange}
                className="col-span-3 bg-zinc-800 text-white border-zinc-700 placeholder-zinc-500 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="days" className="text-right text-zinc-300">
                Days
              </Label>
              <Input
                id="days"
                type="number"
                value={formData.days}
                onChange={handleChange}
                className="col-span-3 bg-zinc-800 text-white border-zinc-700 placeholder-zinc-500 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                required
                min="0"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="timing" className="text-right text-zinc-300">
                Timing
              </Label>
              <Select value={formData.timing} onValueChange={(value: 'Before' | 'After' | 'Not Applicable') => handleSelectChange('timing', value)}>
                <SelectTrigger className="col-span-3 bg-zinc-800 text-white border-zinc-700 focus:border-blue-500 focus:ring-blue-500 rounded-lg"> 
                  <SelectValue placeholder="Select timing" className="text-zinc-400" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 text-white border-zinc-700 rounded-lg">
                  <SelectItem value="Before" className="focus:bg-zinc-700 focus:text-white">Before</SelectItem>
                  <SelectItem value="After" className="focus:bg-zinc-700 focus:text-white">After</SelectItem>
                  <SelectItem value="Not Applicable" className="focus:bg-zinc-700 focus:text-white">Not Applicable</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="messageBody" className="text-right text-zinc-300">
                Message
              </Label>
              <Textarea
                id="messageBody"
                value={formData.messageBody}
                onChange={handleChange}
                className="col-span-3 bg-zinc-800 text-white border-zinc-700 placeholder-zinc-500 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                required
                rows={5}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right text-zinc-300">
                Status
              </Label>
              <Select value={formData.status} onValueChange={(value: 'Active' | 'Inactive') => handleSelectChange('status', value)}>
                <SelectTrigger className="col-span-3 bg-zinc-800 text-white border-zinc-700 focus:border-blue-500 focus:ring-blue-500 rounded-lg">
                  <SelectValue placeholder="Select status" className="text-zinc-400" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 text-white border-zinc-700 rounded-lg">
                  <SelectItem value="Active" className="focus:bg-zinc-700 focus:text-white">Active</SelectItem>
                  <SelectItem value="Inactive" className="focus:bg-zinc-700 focus:text-white">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="border-t border-zinc-700 pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700">Cancel</Button>
            </DialogClose>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all duration-300 hover:scale-105">Save Schedule</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
