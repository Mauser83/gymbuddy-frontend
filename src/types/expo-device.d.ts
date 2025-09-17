declare module 'expo-device' {
  export const isDevice: boolean;
  export const brand: string | null;
  export const manufacturer: string | null;
  export const modelName: string | null;
  export const osName: string | null;
  export const osVersion: string | null;
}
