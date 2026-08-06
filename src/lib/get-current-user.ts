import { cache } from 'react';
import { getToken } from './auth-cookie';
import type { UserResponse } from './api-types';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:8080';

export const getCurrentUser = cache(async (): Promise<UserResponse | null> => {
  const token = await getToken();
  if (!token) return null;

  const res = await fetch(`${API_BASE_URL}/api/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',   // 因人而異的資料，絕不能快取
  });

  if (!res.ok) return null;   // token 過期 → 視為未登入
  return res.json();
});