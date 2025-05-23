// utils/tokenStorage.ts
import { storage } from './storage';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

export const getAccessToken = () => storage.getItem(ACCESS_TOKEN_KEY);
export const setAccessToken = (token: string) => storage.setItem(ACCESS_TOKEN_KEY, token);

export const getRefreshToken = () => storage.getItem(REFRESH_TOKEN_KEY);
export const setRefreshToken = (token: string) => storage.setItem(REFRESH_TOKEN_KEY, token);

export const clearTokens = () =>
  storage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
