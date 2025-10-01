export interface Building {
  _id: string;
  name: string;
  address: string;
  gps?: {
    lat?: number;
    lng?: number;
  };
  owner?: string;
  staffName?: string;
  staffPhone?: string;
  notes?: string;
  images?: string[];
  providers?: string[];
  totalUnits?: number;
  active?: boolean;
  status?: 'completed' | 'in-progress';
  equipment?: {
    deviceName: string;
    ipAddress?: string;
    username?: string;
    password?: string;
    type?: string;
  }[];
  reversePoeSwitches?: {
    count?: number;
    serialNumber?: string;
  }[];
  createdAt?: string;
}