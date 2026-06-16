import { get } from './client';

export interface VapidPublicKey {
  publicKey: string;
}

export function getVapidPublicKey(): Promise<VapidPublicKey> {
  return get<VapidPublicKey>('/push/vapid-public-key');
}
