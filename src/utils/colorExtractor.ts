// @ts-ignore
import ColorThief from 'colorthief';

export interface DominantColors {
  primary: [number, number, number];
  secondary: [number, number, number];
  accent: [number, number, number];
  gradientCss: string;
}

const DEFAULT_COLORS: DominantColors = {
  primary: [30, 32, 38],
  secondary: [18, 20, 24],
  accent: [29, 185, 84],
  gradientCss: 'radial-gradient(circle at 20% 30%, rgba(30, 32, 38, 0.6) 0%, rgba(12, 13, 15, 0.95) 70%, #000000 100%)',
};

const colorThiefInstance = new ColorThief();

// Cache up to 30 extracted palettes to eliminate redundant processing when songs repeat
const colorCache = new Map<string, DominantColors>();

/**
 * Extracts dominant colors from an image URL and produces smooth, high-contrast CSS gradients
 */
export async function extractArtworkColors(imageUrl: string): Promise<DominantColors> {
  if (!imageUrl) return DEFAULT_COLORS;
  if (colorCache.has(imageUrl)) {
    return colorCache.get(imageUrl)!;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imageUrl;

    img.onload = () => {
      try {
        const palette: [number, number, number][] = colorThiefInstance.getPalette(img, 4) || [];
        const primary = palette[0] || [40, 40, 50];
        const secondary = palette[1] || [20, 20, 30];
        const accent = palette[2] || [29, 185, 84];

        // Slightly deepen colors so text remains razor-sharp and AMOLED true-black is preserved at edges
        const pR = Math.round(primary[0] * 0.7);
        const pG = Math.round(primary[1] * 0.7);
        const pB = Math.round(primary[2] * 0.7);

        const sR = Math.round(secondary[0] * 0.5);
        const sG = Math.round(secondary[1] * 0.5);
        const sB = Math.round(secondary[2] * 0.5);

        const gradientCss = `radial-gradient(circle at 25% 40%, rgba(${pR}, ${pG}, ${pB}, 0.55) 0%, rgba(${sR}, ${sG}, ${sB}, 0.3) 55%, #000000 95%)`;

        const result: DominantColors = {
          primary,
          secondary,
          accent,
          gradientCss,
        };

        if (colorCache.size >= 30) {
          const oldestKey = colorCache.keys().next().value;
          if (oldestKey) colorCache.delete(oldestKey);
        }
        colorCache.set(imageUrl, result);

        resolve(result);
      } catch (err) {
        console.warn('[ColorExtractor] ColorThief failed or CORS issue, fallback to default', err);
        colorCache.set(imageUrl, DEFAULT_COLORS);
        resolve(DEFAULT_COLORS);
      } finally {
        img.src = ''; // Cleanly release image resource from memory
      }
    };

    img.onerror = () => {
      img.src = '';
      colorCache.set(imageUrl, DEFAULT_COLORS);
      resolve(DEFAULT_COLORS);
    };
  });
}
