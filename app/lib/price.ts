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

export function matchTier(tiers: Tier[], widthCm: number, heightCm: number): Tier | null {
  const area = widthCm * heightCm;
  for (const t of tiers) {
    const W = t.rules.width ?? {};
    const H = t.rules.height ?? {};
    const A = t.rules.area ?? {};
    const wOk = (W.min == null || widthCm >= W.min) && (W.max == null || widthCm <= W.max);
    const hOk = (H.min == null || heightCm >= H.min) && (H.max == null || heightCm <= H.max);
    const aOk = (A.min == null || area >= A.min) && (A.max == null || area <= A.max);
    if (wOk && hOk && aOk) return t;
  }
  return null;
}