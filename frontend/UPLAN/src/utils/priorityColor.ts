export type PriorityLevel = 'high' | 'medium' | 'low';

export const PRIORITY_COLORS: Record<PriorityLevel, string> = {
  high: '#3B4EFF',
  medium: '#6B7CFF',
  low: '#C6CCFF',
};

export function colorForPriority(priority?: string, fallback: string = PRIORITY_COLORS.medium): string {
  const p = String(priority || '').toLowerCase().trim();
  if (p === 'high') return PRIORITY_COLORS.high;
  if (p === 'low') return PRIORITY_COLORS.low;
  if (p === 'medium') return PRIORITY_COLORS.medium;
  return fallback;
}

// Infer priority from study session type where needed.
export function inferPriorityFromType(type?: string): PriorityLevel | undefined {
  const t = String(type || '').toLowerCase();
  if (t === 'revision') return 'high';
  if (t === 'reading') return 'medium';
  if (t === 'practice') return 'low';
  return undefined;
}
