import Constants from 'expo-constants';

type Stage = 'production' | 'cvdev';
export const stage = ((Constants.expoConfig?.extra as any)?.stage ?? 'production') as Stage;

export const API_BASE_URL =
  stage === 'cvdev'
    ? process.env.EXPO_PUBLIC_API_DEV_URL
    : process.env.EXPO_PUBLIC_API_URL;