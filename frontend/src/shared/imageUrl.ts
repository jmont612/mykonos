// src/shared/imageUrl.ts
import { API_BASE } from '../api/client';

export function imageUrl(url: string): string {
  return `${API_BASE}${url}`;
}
