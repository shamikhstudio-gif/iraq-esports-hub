/**
 * Extracts the most dominant vibrant color from an image URL using HTML5 Canvas.
 */
export async function extractDominantColor(imageUrl?: string | null): Promise<string> {
  return new Promise((resolve) => {
    if (!imageUrl || typeof window === 'undefined') {
      resolve('rgb(99, 102, 241)'); // Default modern indigo
      return;
    }

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imageUrl;

    const fallbackColor = 'rgb(99, 102, 241)';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          resolve(fallbackColor);
          return;
        }

        const size = 32;
        canvas.width = size;
        canvas.height = size;
        ctx.drawImage(img, 0, 0, size, size);

        const imgData = ctx.getImageData(0, 0, size, size).data;
        const colorBuckets: Record<string, { r: number; g: number; b: number; score: number }> = {};

        for (let i = 0; i < imgData.length; i += 4) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const a = imgData[i + 3];

          // Skip low alpha (transparent)
          if (a < 100) continue;

          // Calculate brightness & saturation
          const brightness = (r * 299 + g * 587 + b * 114) / 1000;
          if (brightness < 25 || brightness > 240) continue; // Skip near black or near white

          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const saturation = max === 0 ? 0 : (max - min) / max;

          // Key quantized by 24 to group similar shades
          const qr = Math.round(r / 24) * 24;
          const qg = Math.round(g / 24) * 24;
          const qb = Math.round(b / 24) * 24;
          const key = `${qr},${qg},${qb}`;

          if (!colorBuckets[key]) {
            colorBuckets[key] = { r: qr, g: qg, b: qb, score: 0 };
          }

          // Prioritize saturated/vibrant colors
          colorBuckets[key].score += 1 + saturation * 4;
        }

        const buckets = Object.values(colorBuckets);
        if (buckets.length === 0) {
          // If image was mostly monochrome/black/white, calculate average RGB
          let totalR = 0, totalG = 0, totalB = 0, count = 0;
          for (let i = 0; i < imgData.length; i += 4) {
            if (imgData[i + 3] >= 128) {
              totalR += imgData[i];
              totalG += imgData[i + 1];
              totalB += imgData[i + 2];
              count++;
            }
          }
          if (count > 0) {
            resolve(`rgb(${Math.round(totalR / count)}, ${Math.round(totalG / count)}, ${Math.round(totalB / count)})`);
          } else {
            resolve(fallbackColor);
          }
          return;
        }

        buckets.sort((a, b) => b.score - a.score);
        const top = buckets[0];
        resolve(`rgb(${top.r}, ${top.g}, ${top.b})`);
      } catch (err) {
        resolve(fallbackColor);
      }
    };

    img.onerror = () => {
      resolve(fallbackColor);
    };
  });
}
