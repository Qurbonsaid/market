export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  outputFormat?: "image/webp" | "image/jpeg";
}

/**
 * Compresses an image File or Blob using HTML5 Canvas.
 * Returns a new compressed File object.
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<{ file: File; dataUrl: string }> {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.82,
    outputFormat = "image/jpeg",
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions preserving aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context mavjud emas"));
          return;
        }

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Rasmni siqishda xatolik yuz berdi"));
              return;
            }

            const extension = outputFormat === "image/webp" ? "webp" : "jpg";
            const compressedFile = new File(
              [blob],
              `image_${Date.now()}.${extension}`,
              { type: outputFormat }
            );

            const dataUrl = canvas.toDataURL(outputFormat, quality);
            resolve({ file: compressedFile, dataUrl });
          },
          outputFormat,
          quality
        );
      };

      img.onerror = () => reject(new Error("Rasmni yuklab bo'lmadi"));
    };

    reader.onerror = () => reject(new Error("Faylni o'qishda xatolik yuz berdi"));
  });
}
