import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'KES',
  }).format(amount);
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatSpeed(bitsPerSecond: number, decimals = 2): string {
  if (bitsPerSecond === 0) return '0 bps';

  const k = 1000;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['bps', 'kbps', 'Mbps', 'Gbps', 'Tbps'];

  if (bitsPerSecond < k) {
    return parseFloat(bitsPerSecond.toFixed(dm)) + ' ' + sizes[0];
  }
  
  const i = Math.floor(Math.log(bitsPerSecond) / Math.log(k));

  return parseFloat((bitsPerSecond / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function calculateDaysRemaining(expiryDateString: string): number {
  const now = new Date();
  const expiry = new Date(expiryDateString);

  // Reset time part to 00:00:00 for both dates to compare just the date part
  now.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);

  const diffTime = expiry.getTime() - now.getTime();
  
  // If the expiry date is before today, return 0
  if (diffTime < 0) {
    return 0;
  }

  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}