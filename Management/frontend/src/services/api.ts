const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:7000/api';
const TOKEN_KEY = 'mgmt_token';

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// Auth
export async function login(
  email: string,
  password: string
): Promise<{ token: string; admin: Admin }> {
  return request('POST', '/auth/login', { email, password });
}

// Companies
export async function getCompanies(): Promise<Company[]> {
  return request('GET', '/companies');
}

export async function getCompany(id: string): Promise<Company> {
  return request('GET', `/companies/${id}`);
}

export async function createCompany(data: CreateCompanyData): Promise<Company> {
  return request('POST', '/companies', data);
}

export async function updateCompany(
  id: string,
  data: Partial<CreateCompanyData>
): Promise<Company> {
  return request('PUT', `/companies/${id}`, data);
}

export async function suspendCompany(id: string): Promise<Company> {
  return request('POST', `/companies/${id}/suspend`);
}

export async function activateCompany(id: string): Promise<Company> {
  return request('POST', `/companies/${id}/activate`);
}

export async function deleteCompany(id: string): Promise<void> {
  return request('DELETE', `/companies/${id}`);
}

// Payments
export async function getPayments(companyId: string): Promise<Payment[]> {
  return request('GET', `/payments/company/${companyId}`);
}

export async function createPayment(
  companyId: string,
  data: CreatePaymentData
): Promise<Payment> {
  return request('POST', `/payments/company/${companyId}`, data);
}

export async function createClickLink(
  companyId: string,
  amount: number
): Promise<{ url: string }> {
  return request('POST', `/payments/company/${companyId}/click`, { amount });
}

export async function createPaymeLink(
  companyId: string,
  amount: number
): Promise<{ url: string }> {
  return request('POST', `/payments/company/${companyId}/payme`, { amount });
}

// Monitoring
export async function getCompanyStats(id: string): Promise<CompanyStats> {
  return request('GET', `/monitoring/companies/${id}/stats`);
}

// Types
export interface Admin {
  id: string;
  email: string;
  name: string;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  status: 'ACTIVE' | 'PROVISIONING' | 'SUSPENDED' | 'TERMINATED';
  monthlyPrice: number;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
  frontendPort?: number;
  backendPort?: number;
  dbPort?: number;
  dbName?: string;
  nextPaymentDue?: string;
  daysUntilExpiry?: number;
  lastPayment?: Payment;
  serverStatus?: 'RUNNING' | 'STOPPED';
  createdAt: string;
}

export interface CreateCompanyData {
  name: string;
  slug: string;
  domain?: string;
  monthlyPrice: number;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
}

export interface Payment {
  id: string;
  companyId: string;
  companyName?: string;
  amount: number;
  method: 'CLICK' | 'PAYME' | 'BANK';
  status: 'PAID' | 'PENDING' | 'FAILED';
  periodStart?: string;
  periodEnd?: string;
  paymentLink?: string;
  createdAt: string;
}

export interface CreatePaymentData {
  method: 'CLICK' | 'PAYME' | 'BANK';
  amount: number;
  periodStart?: string;
  periodEnd?: string;
}

export interface CompanyStats {
  status: 'RUNNING' | 'STOPPED';
  cpu: number;
  memoryMb: number;
  diskMb: number;
  uptime?: string;
}
