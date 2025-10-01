export interface Unit {
  _id: string;
  building: string;
  label?: string;
  visitStatus?: 'Visited' | 'Not Visited';
  provider?: string;
  clientName?: string;
  phone?: string;
  nextBillingDate?: string;
  comments?: string;
  wifiName?: string;
  wifiPassword?: string;
  pppoeUsername?: string;
  pppoePassword?: string;
  staticIpAddress?: string;
  wifiInstallationDate?: string;
  initialPaymentAmount?: number;
  routerOwnership?: 'Own' | 'Provided';
  poeAdapter?: boolean;
  active?: boolean;
  status?: 'active' | 'inactive';
  createdAt?: string;
}