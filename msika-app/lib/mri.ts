// ============================================================
// Msika Reliability Index (MRI) — client-safe constants & types
// ============================================================
// The scoring math lives in lib/market-intel.ts (server-only, uses
// Prisma). This module holds everything the UI needs to render MRI
// data without pulling Prisma into the client bundle.

export const MRI_WEIGHTS = { ewma: 0.6, momentum: 0.25, consistency: 0.15 } as const;
export const MRI_HALF_LIFE_DAYS = 10;
export const MRI_MOMENTUM_SATURATION_DAYS = 14;
export const MRI_PRIOR_STRENGTH = 10;
export const INTEL_WINDOW_DAYS = 30;

export type MriTier = "Excellent" | "Reliable" | "Watch" | "At Risk" | "Chronic";

export function mriTier(score: number): MriTier {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Reliable";
  if (score >= 50) return "Watch";
  if (score >= 30) return "At Risk";
  return "Chronic";
}

export const TIER_STYLES: Record<
  MriTier,
  { text: string; bg: string; ring: string; dot: string }
> = {
  Excellent: { text: "text-emerald-700", bg: "bg-emerald-50", ring: "ring-emerald-200", dot: "bg-emerald-500" },
  Reliable: { text: "text-teal-700", bg: "bg-teal-50", ring: "ring-teal-200", dot: "bg-teal-500" },
  Watch: { text: "text-amber-700", bg: "bg-amber-50", ring: "ring-amber-200", dot: "bg-amber-500" },
  "At Risk": { text: "text-orange-700", bg: "bg-orange-50", ring: "ring-orange-200", dot: "bg-orange-500" },
  Chronic: { text: "text-red-700", bg: "bg-red-50", ring: "ring-red-200", dot: "bg-red-500" },
};
