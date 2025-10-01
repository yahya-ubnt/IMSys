export interface SmsTemplate {
  _id?: string;
  name: string;
  content: string;
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
