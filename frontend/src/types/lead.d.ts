export interface Lead {
  _id: string;
  name: string;
  phoneNumber: string;
  leadSource: string;
  desiredPackage?: string;
  currentIsp?: string;
  notes?: string;
  broughtInBy?: string;
  broughtInByContact?: string;
  agreedInstallationFee?: number;
  agreedMonthlySubscription?: number;
  totalAmount?: number;
  customerHasRouter?: boolean;
  routerType?: string;
  followUpDate?: string;
  status: 'New' | 'Contacted' | 'Interested' | 'Site Survey Scheduled' | 'Converted' | 'Not Interested' | 'Future Prospect';
  statusHistory?: { status: string; changedBy: string; changedAt: string }[];
  isConverted?: boolean;
  mikrotikUser?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStatsProps {
  totalLeads: number;
  newLeadsThisMonth: number;
  totalConvertedLeads: number;
}

export interface MonthlyLeadData {
  _id: {
    month: number;
    year: number;
  };
  newLeads: number;
  convertedLeads: number;
}

export interface LeadFormData {
  name: string;
  phoneNumber: string;
  leadSource: string;
  desiredPackage?: string;
  currentIsp?: string;
  notes?: string;
  broughtInBy?: string;
  broughtInByContact?: string;
  agreedInstallationFee?: number;
  agreedMonthlySubscription?: number;
  customerHasRouter?: boolean;
  routerType?: string;
  followUpDate?: string;
}

export interface MikrotikUserDetails {
  username: string;
  password?: string;
  profile: string;
}
