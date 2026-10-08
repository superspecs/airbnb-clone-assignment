// Hosts can add photo URLs from any https site. Only hosts listed in next.config.ts
// `images.remotePatterns` go through the image optimizer; others render as-is.
const OPTIMIZABLE = /^https:\/\/images\.unsplash\.com\/photo-/;

export function isOptimizableImage(url: string): boolean {
  return OPTIMIZABLE.test(url);
}
