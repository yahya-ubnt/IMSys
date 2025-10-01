'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getSmsTemplates } from '@/lib/api/sms'; // To fetch templates

// Define the shape of the data the form handles
export interface SmsAcknowledgementFormData {
  triggerType: string;
  description?: string;
  smsTemplate: string; // This will be the _id of the linked template
  status: 'Active' | 'Inactive';
}

// Define the shape of an SMS Template for the dropdown
interface SmsTemplateOption {
  _id: string;
  name: string;
}

interface SmsAcknowledgementFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SmsAcknowledgementFormData) => void;
  initialData?: Partial<SmsAcknowledgementFormData> | null;
}

export const SmsAcknowledgementForm: React.FC<SmsAcknowledgementFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [formData, setFormData] = useState<SmsAcknowledgementFormData>({
    triggerType: '',
    description: '',
    smsTemplate: '',
    status: 'Active',
  });
  const [templates, setTemplates] = useState<SmsTemplateOption[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [templatesError, setTemplatesError] = useState<string | null>(null);

  // Fetch templates when the modal opens
  useEffect(() => {
    if (isOpen) {
      const fetchTemplates = async () => {
        try {
          setLoadingTemplates(true);
          const data = await getSmsTemplates();
          setTemplates(data);
          setTemplatesError(null);
        } catch (err: unknown) {
          setTemplatesError((err instanceof Error) ? err.message : 'An unknown error occurred');
        } finally {
          setLoadingTemplates(false);
        }
      };
      fetchTemplates();
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        triggerType: initialData.triggerType || '',
        description: initialData.description || '',
        smsTemplate: initialData.smsTemplate || '', // This should be the _id
        status: initialData.status || 'Active',
      });
    } else {
      setFormData({
        triggerType: '',
        description: '',
        smsTemplate: '',
        status: 'Active',
      });
    }
  }, [initialData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (field: keyof SmsAcknowledgementFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // Predefined trigger types from the spec
  const triggerTypes = [
    'New User Registration',
    'Payment Received',
    'Renewal Confirmation',
    'Installation Scheduled',
    'Installation Completed',
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-zinc-900 text-white border-zinc-700">
        <DialogHeader className="border-b border-zinc-700 pb-4">
          <DialogTitle className="text-blue-400">{initialData ? 'Edit Acknowledgement' : 'Create New Acknowledgement'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="triggerType" className="text-right text-zinc-300">
                Trigger Type
              </Label>
              <Select value={formData.triggerType} onValueChange={(value: string) => handleSelectChange('triggerType', value)}>
                <SelectTrigger className="col-span-3 bg-zinc-800 text-white border-zinc-700 focus:border-blue-500 focus:ring-blue-500 rounded-lg">
                  <SelectValue placeholder="Select trigger type" className="text-zinc-400" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 text-white border-zinc-700 rounded-lg">
                  {triggerTypes.map(type => (
                    <SelectItem key={type} value={type} className="focus:bg-zinc-700 focus:text-white">{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right text-zinc-300">
                Description (Optional)
              </Label>
              <Input
                id="description"
                value={formData.description}
                onChange={handleChange}
                className="col-span-3 bg-zinc-800 text-white border-zinc-700 placeholder-zinc-500 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="smsTemplate" className="text-right text-zinc-300">
                SMS Template
              </Label>
              {loadingTemplates ? (
                <div className="col-span-3 text-sm text-zinc-400">Loading templates...</div>
              ) : templatesError ? (
                <div className="col-span-3 text-sm text-red-500">Error loading templates: {templatesError}</div>
              ) : (
                <Select value={formData.smsTemplate} onValueChange={(value: string) => handleSelectChange('smsTemplate', value)}>
                  <SelectTrigger className="col-span-3 bg-zinc-800 text-white border-zinc-700 focus:border-blue-500 focus:ring-blue-500 rounded-lg">
                    <SelectValue placeholder="Select a template" className="text-zinc-400" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 text-white border-zinc-700 rounded-lg">
                    {templates.map(template => (
                      <SelectItem key={template._id} value={template._id} className="focus:bg-zinc-700 focus:text-white">{template.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
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
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all duration-300 hover:scale-105">Save Acknowledgement</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
