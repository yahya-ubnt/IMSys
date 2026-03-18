import { z } from 'zod';

const ipAddressRegex = /^(\d{1,3}\.){3}\d{1,3}$/;

export const mikrotikUserFormSchema = z.object({
  mikrotikRouter: z.string().min(1, "Mikrotik router is required"),
  serviceType: z.enum(['pppoe', 'static'], { required_error: "Service type is required" }),
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
});

export type MikrotikUserFormSchema = z.infer<typeof mikrotikUserFormSchema>;
