export interface HotspotPlan {
  _id: string;
  name: string;
  price: number;
  timeLimitValue: number;
  timeLimitUnit: string;
  dataLimitValue: number;
  dataLimitUnit: string;
  sharedUsers: number;
  profile: string;
  server: string;
  rateLimit?: string;
  mikrotikRouter: {
    _id: string;
    name: string;
  };
}

export interface HotspotUser {
  _id: string;
  officialName: string;
  email: string;
  location: string;
  hotspotName: string;
  hotspotPassword?: string;
  phoneNumber: string;
  referenceNumber: string;
  billAmount: number;
  installationFee: number;
  billingCycleValue: number;
  billingCycleUnit: string;
  expiryDate: string;
  expiryTime: string;
  profile: string;
  server: string;
  mikrotikRouter: {
    _id: string;
    name: string;
  };
}