declare module 'expo-image-picker' {
  export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

  export interface PermissionResponse {
    granted: boolean;
    expires: 'never' | number;
    status: PermissionStatus;
    canAskAgain: boolean;
  }

  export type MediaTypeValue = 'Images' | 'Videos' | 'All';

  export const MediaTypeOptions: Record<MediaTypeValue, MediaTypeValue>;

  export const CameraType: {
    front: 'front';
    back: 'back';
  };

  export interface ImagePickerAsset {
    uri: string;
    width?: number;
    height?: number;
    fileName?: string | null;
    fileSize?: number | null;
    type?: string | null;
    duration?: number | null;
    exif?: Record<string, unknown> | null;
    base64?: string | null;
  }

  export interface ImagePickerResult {
    canceled: boolean;
    assets?: ImagePickerAsset[];
  }

  export interface MediaLibraryOptions {
    mediaTypes?: MediaTypeValue;
    allowsEditing?: boolean;
    quality?: number;
    aspect?: [number, number];
    base64?: boolean;
    exif?: boolean;
    presentationStyle?: string;
    allowsMultipleSelection?: boolean;
  }

  export interface CameraOptions extends MediaLibraryOptions {
    videoMaxDuration?: number;
    cameraType?: 'front' | 'back';
  }

  export function useCameraPermissions(): [PermissionResponse | null, () => Promise<PermissionResponse>];
  export function requestMediaLibraryPermissionsAsync(): Promise<PermissionResponse>;
  export function requestCameraPermissionsAsync(): Promise<PermissionResponse>;
  export function launchImageLibraryAsync(
    options?: MediaLibraryOptions,
  ): Promise<ImagePickerResult>;
  export function launchCameraAsync(options?: CameraOptions): Promise<ImagePickerResult>;
}