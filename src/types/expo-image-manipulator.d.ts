declare module 'expo-image-manipulator' {
  export enum SaveFormat {
    JPEG = 'jpeg',
    PNG = 'png',
    WEBP = 'webp',
  }

  export interface ImageResult {
    uri: string;
    width: number;
    height: number;
  }

  export function manipulateAsync(
    uri: string,
    actions: any[],
    options?: { compress?: number; format?: SaveFormat },
  ): Promise<ImageResult>;
}