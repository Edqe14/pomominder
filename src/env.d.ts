/// <reference types="astro/client" />

// Not in lib.dom yet (Chromium-only Document Picture-in-Picture API).
interface DocumentPictureInPicture {
  requestWindow(options?: { width?: number; height?: number }): Promise<Window>;
  readonly window: Window | null;
}

interface Window {
  documentPictureInPicture?: DocumentPictureInPicture;
}
