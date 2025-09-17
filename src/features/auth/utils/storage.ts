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
let asyncStoragePromise: Promise<AsyncStorageStatic> | null = null;

const getAsyncStorage = async (): Promise<AsyncStorageStatic | null> => {
  if (isWeb) {
    return null;
  }

  if (!asyncStoragePromise) {
    asyncStoragePromise = import('@react-native-async-storage/async-storage').then(
      (module) => module.default as AsyncStorageStatic,
    );
  }

  return asyncStoragePromise;
};

export const storage = {
  getItem: async (key: string): Promise<string | null> => {
    if (isWeb) {
      return webStorage?.getItem(key) ?? null;
    }

    const asyncStorage = await getAsyncStorage();
    return asyncStorage?.getItem(key) ?? null;
  },

  setItem: async (key: string, value: string): Promise<void> => {
    if (isWeb) {
      webStorage?.setItem(key, value);
      return;
    }

    const asyncStorage = await getAsyncStorage();
    await asyncStorage?.setItem(key, value);
  },

  removeItem: async (key: string): Promise<void> => {
    if (isWeb) {
      webStorage?.removeItem(key);
      return;
    }

    const asyncStorage = await getAsyncStorage();
    await asyncStorage?.removeItem(key);
  },

  multiRemove: async (keys: string[]): Promise<void> => {
    if (isWeb) {
      if (webStorage) {
        keys.forEach((key) => webStorage.removeItem(key));
      }
      return;
    }

    const asyncStorage = await getAsyncStorage();
    await asyncStorage?.multiRemove(keys);
  },
};
