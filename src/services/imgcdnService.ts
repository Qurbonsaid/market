import { compressImage } from "../utils/imageCompressor";

export interface UploadResult {
  url: string;
  thumbUrl?: string;
  deleteUrl?: string;
}

const STORAGE_KEYS = {
  IMGCDN_KEY: "market_imgcdn_api_key",
  IMGCDN_ENDPOINT: "market_imgcdn_endpoint",
};

export function getStoredImgcdnKey(): string {
  return (
    localStorage.getItem(STORAGE_KEYS.IMGCDN_KEY) ||
    import.meta.env.VITE_IMGCDN_API_KEY ||
    ""
  );
}

export function setStoredImgcdnKey(key: string): void {
  localStorage.setItem(STORAGE_KEYS.IMGCDN_KEY, key.trim());
}

export function getStoredImgcdnEndpoint(): string {
  return (
    localStorage.getItem(STORAGE_KEYS.IMGCDN_ENDPOINT) ||
    import.meta.env.VITE_IMGCDN_ENDPOINT ||
    "https://imgcdn.dev/api/1/upload"
  );
}

export function setStoredImgcdnEndpoint(endpoint: string): void {
  localStorage.setItem(STORAGE_KEYS.IMGCDN_ENDPOINT, endpoint.trim());
}

/**
 * Uploads an image file to ImgCDN (or compatible Chevereto/ImgBB API).
 * First compresses the image in the browser, then uploads.
 * Requires a configured ImgCDN-compatible endpoint and API key.
 */
export async function uploadImageToImgCDN(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<UploadResult> {
  onProgress?.(15);

  // 1. Client-side compression
  const { file: compressedFile } = await compressImage(file, {
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 0.85,
  });

  onProgress?.(40);

  const apiKey = getStoredImgcdnKey();
  const endpoint = getStoredImgcdnEndpoint();

  if (!apiKey) {
    throw new Error("Rasm yuklash uchun ImgCDN API kalitini sozlang.");
  }

  // 2. Prepare FormData for ImgCDN (Chevereto API v1)
  const formData = new FormData();
  formData.append("key", apiKey);
  formData.append("source", compressedFile);
  formData.append("format", "json");

  try {
    onProgress?.(60);
    const response = await fetch(endpoint, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ImgCDN yuklashda xato:", errorText);
      throw new Error(
        `Rasm yuklashda xatolik (${response.status}): ${errorText.slice(0, 100)}`,
      );
    }

    const data = await response.json();
    onProgress?.(95);

    // Chevereto / ImgCDN response handling
    if (data && data.image) {
      return {
        url: data.image.display_url || data.image.url,
        thumbUrl: data.image.thumb?.url || data.image.url,
        deleteUrl: data.image.delete_url,
      };
    } else if (data && data.data && data.data.url) {
      // ImgBB format compatibility
      return {
        url: data.data.display_url || data.data.url,
        thumbUrl: data.data.thumb?.url || data.data.url,
        deleteUrl: data.data.delete_url,
      };
    } else {
      throw new Error("ImgCDN javobida rasm havolasi topilmadi");
    }
  } catch (error) {
    console.error("ImgCDN serveriga ulanishda muammo bo'ldi:", error);
    throw error;
  } finally {
    onProgress?.(100);
  }
}
