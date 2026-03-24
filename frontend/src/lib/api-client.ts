import { getSession } from 'next-auth/react';
import type { JsonBin, CreateBinInput, UpdateBinInput, User, PublicSettings, Setting, CreateUserInput } from '@/types';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const session = await getSession();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(session?.user.backendToken
        ? { Authorization: `Bearer ${session.user.backendToken}` }
        : {}),
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg ?? 'Request failed');
  return data;
}

// Auth
export const register = (email: string, name: string, password: string) =>
  apiFetch<{ success: boolean; token: string; user: User }>('/api/v2/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, name, password }),
  });

// Bins
export const fetchGroups = () =>
  apiFetch<{ success: boolean; data: string[] }>('/api/v2/bins/groups').then((r) => r.data);

export const fetchBins = (group?: string) =>
  apiFetch<{ success: boolean; data: JsonBin[] }>(
    `/api/v2/bins${group ? `?group=${group}` : ''}`
  ).then((r) => r.data);

export const fetchBin = (slug: string) =>
  apiFetch<{ success: boolean; data: JsonBin }>(`/api/v2/bins/${slug}`).then((r) => r.data);

export const createBin = (input: CreateBinInput) =>
  apiFetch<{ success: boolean; data: JsonBin }>('/api/v2/bins', {
    method: 'POST',
    body: JSON.stringify(input),
  }).then((r) => r.data);

export const updateBin = (slug: string, input: UpdateBinInput) =>
  apiFetch<{ success: boolean; data: JsonBin }>(`/api/v2/bins/${slug}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  }).then((r) => r.data);

export const deleteBin = (slug: string) =>
  apiFetch(`/api/v2/bins/${slug}`, { method: 'DELETE' });

// Settings (public — no auth)
export const fetchPublicSettings = () =>
  fetch(`${BASE}/api/v2/settings/public`)
    .then((r) => r.json())
    .then((r) => r.data as PublicSettings);

// Settings (admin)
export const fetchAdminSettings = () =>
  apiFetch<{ success: boolean; data: Setting[] }>('/api/v2/settings').then((r) => r.data);

export const updateSetting = (key: string, value: unknown) =>
  apiFetch<{ success: boolean; data: Setting }>(`/api/v2/settings/${key}`, {
    method: 'PATCH',
    body: JSON.stringify({ value }),
  }).then((r) => r.data);

// Admin
export const fetchUsers = () =>
  apiFetch<{ success: boolean; data: User[] }>('/api/v2/admin/users').then((r) => r.data);

export const updateUserRole = (id: string, role: 'admin' | 'user') =>
  apiFetch<{ success: boolean; data: User }>(`/api/v2/admin/users/${id}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  }).then((r) => r.data);

export const deleteUser = (id: string) =>
  apiFetch(`/api/v2/admin/users/${id}`, { method: 'DELETE' });

export const adminCreateUser = (input: CreateUserInput) =>
  apiFetch<{ success: boolean; data: User }>('/api/v2/admin/users', {
    method: 'POST',
    body: JSON.stringify(input),
  }).then((r) => r.data);
