/**
 * Client-side image compression utility using HTML5 Canvas.
 * Resizes large images (e.g. 5MB-15MB camera photos) down to a max dimension
 * and compresses to high-quality JPEG (<150KB), ensuring fast uploads on any connection.
 */
export async function compressImage(
  file: File,
  maxDimension: number = 800,
  quality: number = 0.85
): Promise<Blob> {
  // If not in browser or not an image, return original file
  if (typeof window === "undefined" || !file.type.startsWith("image/")) {
    return file;
  }

  // If already tiny (<100KB), return original file to save processing
  if (file.size < 100 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => resolve(file);
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => resolve(file);
      img.onload = () => {
        let { width, height } = img;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }

        // Draw image smoothed
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              resolve(file);
            }
          },
          "image/jpeg",
          quality
        );
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}
