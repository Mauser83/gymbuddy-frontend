// utils/storage.ts
import { Platform } from 'react-native';
import type { AsyncStorageStatic } from '@react-native-async-storage/async-storage';

const isWeb = Platform.OS === 'web';
// Dynamically require AsyncStorage only on native platforms to avoid bundling
// the module on web, where it leads to runtime errors.
const AsyncStorage: AsyncStorageStatic | null = isWeb
  ? null
  : // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('@react-native-async-storage/async-storage').default;

export const storage = {
  getItem: async (key: string): Promise<string | null> =>
    isWeb
      ? Promise.resolve(localStorage.getItem(key))
      : AsyncStorage!.getItem(key),

  setItem: async (key: string, value: string): Promise<void> =>
    isWeb
      ? Promise.resolve(localStorage.setItem(key, value))
      : AsyncStorage!.setItem(key, value),

  removeItem: async (key: string): Promise<void> =>
    isWeb
      ? Promise.resolve(localStorage.removeItem(key))
      : AsyncStorage!.removeItem(key),

  multiRemove: async (keys: string[]): Promise<void> =>
    isWeb
      ? Promise.resolve(keys.forEach(key => localStorage.removeItem(key)))
      : AsyncStorage!.multiRemove(keys),
};