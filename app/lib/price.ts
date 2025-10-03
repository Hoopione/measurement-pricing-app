export type Tier = {
  id: string;
  label: string;
  rules: {
    width?: { min?: number; max?: number };
    height?: { min?: number; max?: number };
    area?: { min?: number; max?: number };
  };
  variantId: string | number;
};

export function matchTier(
  tiers: Tier[],
  widthCm: number,
  heightCm: number
): Tier | null {
  const area = widthCm * heightCm;
  for (const t of tiers) {
    const w = t.rules.width || {};
    const h = t.rules.height || {};
    const a = t.rules.area || {};
    const wOk =
      (w.min == null || widthCm >= w.min) &&
      (w.max == null || widthCm <= w.max);
    const hOk =
      (h.min == null || heightCm >= h.min) &&
      (h.max == null || heightCm <= h.max);
    const aOk =
      (a.min == null || area >= a.min) && (a.max == null || area <= a.max);
    if (wOk && hOk && aOk) return t;
  }
  return null;
}
