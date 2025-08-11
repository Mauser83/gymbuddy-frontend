// src/config/env.ts
import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra ?? {}) as {
  apiUrl?: string;
  stage?: string;
};

export const API_BASE_URL = extra.apiUrl ?? process.env.EXPO_PUBLIC_API_BASE_URL ?? '';
export const STAGE = (extra.stage ?? (process.env.APP_ENV ?? 'production')).toLowerCase();