export interface SmsProvider {
  _id: string;
  name: string;
  providerType: string;
  isActive: boolean;
  [key: string]: string | boolean;
}

export interface SmsTemplate {
  _id?: string;
  name: string;
  messageBody: string;
  createdAt: string;
}

export type SmsTemplateData = {
  name: string;
  messageBody: string;
}

export interface SmsExpirySchedule {
  _id?: string;
  name: string;
  description?: string;
  smsTemplate: string; // ID of the linked template
  status: 'Active' | 'Inactive';
}

export interface SmsAcknowledgement {
  _id?: string;
  triggerType: string;
  description?: string;
  smsTemplate: string; // ID of the linked template
  status: 'Active' | 'Inactive';
}