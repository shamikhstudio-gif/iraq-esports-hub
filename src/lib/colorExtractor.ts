/**
 * Single source of truth for UI color extraction — strictly locked to pure monochrome #ffffff.
 */
export async function extractDominantColor(_imageUrl?: string | null): Promise<string> {
  return '#ffffff';
}
