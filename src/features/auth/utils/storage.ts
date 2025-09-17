// utils/storage.ts
import type { AsyncStorageStatic } from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';
type WebStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};
const webStorage: WebStorage | null =
  isWeb && typeof globalThis !== 'undefined' && 'localStorage' in globalThis
    ? (globalThis as unknown as { localStorage: WebStorage }).localStorage
    : null;
// Dynamically require AsyncStorage only on native platforms to avoid bundling
// the module on web, where it leads to runtime errors.
const AsyncStorage: AsyncStorageStatic | null = isWeb
  ? null
  : // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('@react-native-async-storage/async-storage').default;

export const storage = {
  getItem: async (key: string): Promise<string | null> =>
    isWeb ? Promise.resolve(webStorage?.getItem(key) ?? null) : AsyncStorage!.getItem(key),

  setItem: async (key: string, value: string): Promise<void> =>
    isWeb ? Promise.resolve(webStorage?.setItem(key, value)) : AsyncStorage!.setItem(key, value),

  removeItem: async (key: string): Promise<void> =>
    isWeb ? Promise.resolve(webStorage?.removeItem(key)) : AsyncStorage!.removeItem(key),

  multiRemove: async (keys: string[]): Promise<void> =>
    isWeb
      ? Promise.resolve(webStorage ? keys.forEach((key) => webStorage.removeItem(key)) : undefined)
      : AsyncStorage!.multiRemove(keys),
};
