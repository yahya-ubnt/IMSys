export interface MikrotikUser {
  _id: string;
  username: string;
  officialName: string;
  serviceType: 'pppoe' | 'static';
  package: {
    _id: string;
    name: string;
    price: number;
  };
  expiryDate: string;
  mikrotikRouter: {
    _id: string;
    name: string;
  };
  mobileNumber: string;
  mPesaRefNo: string;
}

export interface RouterLog {
  _id: string;
  timestamp: string;
  message: string;
  topics: string[];
}