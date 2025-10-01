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

// Define the shape of the data the form handles
export interface SmsTemplateFormData {
  name: string;
  messageBody: string;
}

interface SmsTemplateFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SmsTemplateFormData) => void;
  initialData?: SmsTemplateFormData | null;
}

export const SmsTemplateForm: React.FC<SmsTemplateFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [formData, setFormData] = useState<SmsTemplateFormData>({ name: '', messageBody: '' });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({ name: '', messageBody: '' });
    }
  }, [initialData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-zinc-900 text-white border-zinc-700">
        <DialogHeader className="border-b border-zinc-700 pb-4">
          <DialogTitle className="text-blue-400">{initialData ? 'Edit Template' : 'Create New Template'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="name" className="text-right text-zinc-300">
                Name
              </label>
              <Input
                id="name"
                value={formData.name}
                onChange={handleChange}
                className="col-span-3 bg-zinc-800 text-white border-zinc-700 placeholder-zinc-500 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="messageBody" className="text-right text-zinc-300">
                Message
              </label>
              <Textarea
                id="messageBody"
                value={formData.messageBody}
                onChange={handleChange}
                className="col-span-3 bg-zinc-800 text-white border-zinc-700 placeholder-zinc-500 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                required
                rows={5}
              />
            </div>
          </div>
          <DialogFooter className="border-t border-zinc-700 pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700">Cancel</Button>
            </DialogClose>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all duration-300 hover:scale-105">Save Template</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
