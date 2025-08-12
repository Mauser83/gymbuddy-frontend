import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra ?? {}) as {
  apiUrl?: string;
  stage?: string;
};

export const API_BASE_URL = extra.apiUrl ?? '';
export const STAGE = (extra.stage ?? 'production').toLowerCase();

if (!API_BASE_URL) {
  console.warn('API_BASE_URL missing — check app.config.js (extra.apiUrl)');
}