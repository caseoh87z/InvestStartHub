import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Combines tailwind classes properly
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format date
export function formatDate(date: Date | string): string {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

// Format wallet address
export function formatWalletAddress(address: string | undefined | null): string {
  if (!address) return '';
  
  const start = address.substring(0, 6);
  const end = address.substring(address.length - 4);
  
  return `${start}...${end}`;
}

// Get investment stages
export function getInvestmentStages(): string[] {
  return [
    'Idea',
    'Prototype',
    'MVP',
    'Growth',
    'Scale'
  ];
}

// Get industries
export function getIndustries(): string[] {
  return [
    'Technology',
    'Healthcare',
    'Finance',
    'Education',
    'Energy',
    'E-commerce',
    'Transportation',
    'Media',
    'Real Estate',
    'Food & Beverage',
  ];
}

// Get locations
export function getLocations(): string[] {
  return [
    'North America',
    'Europe',
    'Asia',
    'Africa',
    'South America',
    'Oceania',
  ];
}

// Validate UPI ID
export function isValidUpiId(upiId: string): boolean {
  // Basic UPI ID validation
  const upiRegex = /^[\w.-]+@[\w]+$/;
  return upiRegex.test(upiId);
}

// Validate email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Generate random avatar letters
export function getNameInitials(name: string): string {
  if (!name) return 'U';
  
  const parts = name.split(' ');
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
