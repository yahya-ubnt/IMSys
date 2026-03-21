export interface SmsProvider {
  _id: string;
  name: string;
  providerType: string;
  isActive: boolean;
  [key: string]: string | boolean;
}

export interface SmsTemplate {
  _id?: string;
  triggerType: string;
  messageBody: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
}

export type SmsTemplateData = {
  triggerType: string;
  messageBody: string;
  status: 'Active' | 'Inactive';
}

export interface SmsExpirySchedule {
  _id?: string;
  name: string;
  description?: string;
  smsTemplate: string; // ID of the linked template
  status: 'Active' | 'Inactive';
}