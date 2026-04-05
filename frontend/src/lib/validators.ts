import { z } from 'zod';

const ipAddressRegex = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

export const mikrotikUserFormSchema = z.object({
  mikrotikRouter: z.string().min(1, "Mikrotik router is required"),
  serviceType: z.enum(['pppoe', 'static'], { message: "Service type is required" }),
  package: z.string().min(1, "Package is required"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  officialName: z.string().min(1, "Official name is required"),
  emailAddress: z.string().email("Invalid email address").optional().or(z.literal('')),
  mPesaRefNo: z.string().min(1, "M-Pesa reference number is required"),
  installationFee: z.number().optional(),
  customPackagePrice: z.number().optional(),
  mobileNumber: z.string().min(10, "Mobile number must be at least 10 digits"),
  expiryDate: z.date().optional(),
  pppoePassword: z.string().optional(),
  ipAddress: z.string().optional(),
  macAddress: z.string().optional(),
  building: z.string().optional(),
  station: z.string().optional(),
  door_number_unit_label: z.string().optional(),
  rateLimit: z.string().optional(),
  profile: z.string().optional(),
  sendWelcomeSms: z.boolean().optional(),
}).superRefine((data, ctx) => {
  if (data.serviceType === 'pppoe' && (!data.pppoePassword || data.pppoePassword.length < 1)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['pppoePassword'],
      message: 'PPPoE password is required',
    });
  }
  if (data.serviceType === 'static' && (data.ipAddress && !ipAddressRegex.test(data.ipAddress))) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['ipAddress'],
      message: 'Invalid IP address',
    });
  }
    if (data.serviceType === 'static' && !data.ipAddress) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['ipAddress'],
            message: 'IP address is required for static service type',
        });
    }
  if (data.serviceType === 'static') {
    if (!data.macAddress) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['macAddress'],
        message: 'MAC address is required for static service type',
      });
    } else if (!/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(data.macAddress)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['macAddress'],
        message: 'Invalid MAC address format (e.g., AA:BB:CC:DD:EE:FF)',
      });
    }
  }
});

export type MikrotikUserFormSchema = z.infer<typeof mikrotikUserFormSchema>;

export const mikrotikRouterFormSchema = z.object({
  name: z.string().min(1, "Router name is required"),
  ipAddress: z.string().regex(ipAddressRegex, "Invalid IP address format (e.g., 192.168.1.1)"),
  apiUsername: z.string().min(1, "API username is required"),
  apiPassword: z.string().optional(),
  apiPort: z.coerce.number().min(1, "API port is required"),
  location: z.string().optional(),
});

export type MikrotikRouterFormSchema = z.infer<typeof mikrotikRouterFormSchema>;

export const mikrotikPackageFormSchema = z.object({
  mikrotikRouter: z.string().min(1, "Mikrotik router is required"),
  serviceType: z.enum(['pppoe', 'static'], { message: "Service type is required" }),
  name: z.string().min(1, "Package name is required"),
  price: z.coerce.number().min(0, "Price must be a positive number"),
  durationInDays: z.coerce.number().min(1, "Duration must be at least 1 day"),
  profile: z.string().optional(),
  rateLimit: z.string().optional(),
  status: z.enum(['active', 'disabled'], { message: "Status is required" }),
}).superRefine((data, ctx) => {
  if (data.serviceType === 'pppoe' && !data.profile) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['profile'],
      message: 'Profile is required for PPPoE service type',
    });
  }
  if (data.serviceType === 'static' && !data.rateLimit) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['rateLimit'],
      message: 'Rate Limit is required for Static IP service type',
    });
  }
});

export type MikrotikPackageFormSchema = z.infer<typeof mikrotikPackageFormSchema>;

export const deviceFormSchema = z.object({
  router: z.string().min(1, "Mikrotik router is required"),
  deviceType: z.enum(['Access', 'Station'], { message: "Device type is required" }),
  monitoringMode: z.enum(['SNITCH', 'NONE'], { message: "Monitoring mode is required" }),
  deviceName: z.string().min(1, "Device name is required"),
  deviceModel: z.string().optional(),
  physicalBuilding: z.string().optional(),
  serviceArea: z.array(z.string()).optional(),
  ipAddress: z.string().regex(ipAddressRegex, "Invalid IP address format (e.g., 192.168.1.1)"),
  macAddress: z.string().regex(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/, "Invalid MAC address format (e.g., AA:BB:CC:DD:EE:FF)").optional(),
  loginUsername: z.string().optional(),
  loginPassword: z.string().optional(),
  ssid: z.string().optional(),
  wirelessPassword: z.string().optional(),
  parentId: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.deviceType === 'Station' && !data.parentId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['parentId'],
      message: 'Parent device is required for Station type',
    });
  }
  if (data.deviceType === 'Access' && !data.ssid) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['ssid'],
      message: 'SSID is required for Access Point type',
    });
  }
});

export type DeviceFormSchema = z.infer<typeof deviceFormSchema>;