const MAX_WIDTH = 1200;
const MAX_HEIGHT = 800;
const QUALITY = 0.9;

interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

/**
 * Compresses an image to WebP format with specified quality
 * Falls back to JPEG if WebP is not supported
 */
export async function compressToWebP(
  file: File,
  options: CompressOptions = {}
): Promise<{ blob: Blob; extension: string; mimeType: string }> {
  const { 
    maxWidth = MAX_WIDTH, 
    maxHeight = MAX_HEIGHT, 
    quality = QUALITY 
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    img.onload = () => {
      let { width, height } = img;

      // Calculate new dimensions maintaining aspect ratio
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      canvas.width = width;
      canvas.height = height;

      ctx?.drawImage(img, 0, 0, width, height);

      // Try WebP first, fallback to JPEG
      const tryWebP = () => {
        canvas.toBlob(
          (blob) => {
            if (blob && blob.size > 0) {
              resolve({ blob, extension: 'webp', mimeType: 'image/webp' });
            } else {
              // Fallback to JPEG
              canvas.toBlob(
                (jpegBlob) => {
                  if (jpegBlob) {
                    resolve({ blob: jpegBlob, extension: 'jpg', mimeType: 'image/jpeg' });
                  } else {
                    reject(new Error("Falha ao comprimir imagem"));
                  }
                },
                "image/jpeg",
                quality
              );
            }
          },
          "image/webp",
          quality
        );
      };

      // Check WebP support
      if (typeof canvas.toBlob === 'function') {
        tryWebP();
      } else {
        reject(new Error("Browser não suporta compressão de imagem"));
      }
    };

    img.onerror = () => reject(new Error("Falha ao carregar imagem"));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Check if browser supports WebP
 */
export function supportsWebP(): boolean {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').startsWith('data:image/webp');
}
