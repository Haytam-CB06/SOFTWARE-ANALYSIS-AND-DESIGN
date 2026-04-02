// Priority color mapping for study sessions.
// 3-level priority palette (no red/green/yellow).
// High = strong accent, Medium = neutral, Low = muted.
export type PriorityLevel = 'high' | 'medium' | 'low';

export const PRIORITY_COLORS: Record<PriorityLevel, string> = {
  high: '#3B4EFF',
  medium: '#6B7CFF',
  low: '#C6CCFF',
};

export function colorForPriority(priority?: string, fallback: string = PRIORITY_COLORS.medium): string {
  const p = String(priority || '').toLowerCase();
  if (p === 'high') return PRIORITY_COLORS.high;
  if (p === 'low') return PRIORITY_COLORS.low;
  if (p === 'medium') return PRIORITY_COLORS.medium;
  return fallback;
}
