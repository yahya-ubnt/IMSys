export interface SmsProvider {
  _id: string;
  name: string;
  providerType: string;
  isActive: boolean;
  [key: string]: any;
}
