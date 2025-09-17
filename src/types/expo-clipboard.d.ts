declare module 'expo-clipboard' {
  export type ClipboardEvent = {
    contentTypes: string[];
  };

  export type ClipboardListener = (event: ClipboardEvent) => void;

  export type ClipboardSubscription = {
    remove: () => void;
  };

  export function setStringAsync(content: string): Promise<void>;
  export function getStringAsync(): Promise<string>;
  export function setUrlAsync(url: string): Promise<void>;
  export function getUrlAsync(): Promise<string | null>;
  export function hasStringAsync(): Promise<boolean>;
  export function addClipboardListener(
    listener: ClipboardListener,
  ): ClipboardSubscription;
  export function removeClipboardListener(listener: ClipboardListener): void;
}