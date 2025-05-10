// utils/storage.ts
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = {
  getItem: async (key: string): Promise<string | null> =>
    Platform.OS === 'web'
      ? Promise.resolve(localStorage.getItem(key))
      : AsyncStorage.getItem(key),

  setItem: async (key: string, value: string): Promise<void> =>
    Platform.OS === 'web'
      ? Promise.resolve(localStorage.setItem(key, value))
      : AsyncStorage.setItem(key, value),

  removeItem: async (key: string): Promise<void> =>
    Platform.OS === 'web'
      ? Promise.resolve(localStorage.removeItem(key))
      : AsyncStorage.removeItem(key),

  multiRemove: async (keys: string[]): Promise<void> =>
    Platform.OS === 'web'
      ? Promise.resolve(keys.forEach(key => localStorage.removeItem(key)))
      : AsyncStorage.multiRemove(keys),
};
