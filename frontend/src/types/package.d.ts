export interface Package {
  _id: string;
  name: string;
  price: number;
  serviceType: 'pppoe' | 'static';
  profile?: string;
  rateLimit?: string;
  status: 'active' | 'inactive';
  mikrotikRouter: string;
  tenantOwner: string;
  createdAt: string;
  updatedAt: string;
}
