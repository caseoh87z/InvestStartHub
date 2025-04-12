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

// Generate avatar initials from name or email
export function getNameInitials(nameOrEmail: string): string {
  if (!nameOrEmail) return 'U';
  
  // Check if it's an email address
  if (nameOrEmail.includes('@')) {
    // Get the part before @ symbol
    const emailName = nameOrEmail.split('@')[0];
    // Return first 1-2 characters
    return emailName.substring(0, Math.min(2, emailName.length)).toUpperCase();
  }
  
  // Handle as a regular name
  const parts = nameOrEmail.split(' ');
  if (parts.length === 1) {
    // Single word name - return first 1-2 letters
    return parts[0].substring(0, Math.min(2, parts[0].length)).toUpperCase();
  }
  
  // Multiple word name - return first letter of first and last parts
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
