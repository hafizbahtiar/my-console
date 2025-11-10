// Shared types for customers functionality

export interface Customer {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  userId: string; // Appwrite user ID (owner of this customer record - unique)
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  website?: string;
  status: 'active' | 'inactive' | 'lead' | 'prospect' | 'archived';
  assignedTo?: string; // Admin/sales rep User ID (for internal assignment)
  source?: 'website' | 'referral' | 'social_media' | 'advertising' | 'trade_show' | 'cold_call' | 'email_campaign' | 'other';
  industry?: string;
  customerType: 'individual' | 'company' | 'non-profit' | 'government';
  currency?: string; // ISO 4217 code (e.g., 'USD', 'EUR')
  language?: 'en' | 'ms';
  timezone?: string;
  notes?: string; // JSON string
  metadata?: string; // JSON string
  lastContactAt?: string;
  nextFollowUpAt?: string;
  totalRevenue: number; // Min: 0
  totalInvoices: number; // Min: 0
  createdBy?: string; // User ID who created this record
  updatedBy?: string; // User ID who last updated
}

// Form data type for creating/editing customers
export interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  jobTitle: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  website: string;
  status: 'active' | 'inactive' | 'lead' | 'prospect' | 'archived';
  assignedTo: string;
  source: 'website' | 'referral' | 'social_media' | 'advertising' | 'trade_show' | 'cold_call' | 'email_campaign' | 'other';
  industry: string;
  customerType: 'individual' | 'company' | 'non-profit' | 'government';
  currency: string;
  language: 'en' | 'ms';
  timezone: string;
  notes: string;
  metadata: string;
}

