import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

export interface ProcessedImage {
  uri: string;
  width: number;
  height: number;
  size: number; // bytes
}

export async function preprocessImage(
  uri: string,
  width: number | undefined,
  height: number | undefined,
  longSide: number,
  quality: number,
): Promise<ProcessedImage> {
  const w = width && width > 0 ? width : longSide;
  const h = height && height > 0 ? height : longSide;
  const scale = Math.min(1, longSide / Math.max(w, h));
  const targetWidth = Math.round(w * scale);
  const targetHeight = Math.round(h * scale);

  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{resize: {width: targetWidth, height: targetHeight}}],
    {compress: quality, format: ImageManipulator.SaveFormat.JPEG},
  );
  const info = await FileSystem.getInfoAsync(result.uri);
  if (!info.exists) {
    throw new Error('Processed image not found');
  }

  return {
    uri: result.uri,
    width: result.width,
    height: result.height,
    size: info.size,
  };
}