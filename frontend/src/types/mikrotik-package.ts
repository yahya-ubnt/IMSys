export interface Package {
  _id: string;
  mikrotikRouter: { _id: string; name: string; ipAddress: string }; // Populated router
  serviceType: 'pppoe' | 'static';
  name: string;
  price: number;
  status: 'active' | 'disabled';
  profile?: string;
  rateLimit?: string;
  tenant?: {
    _id: string;
    fullName: string;
  };
}