// Course color mapping
// Goal: sessions are colored by course/subject (stable), NOT by priority.

// Single, app-theme friendly color for all course/subject blocks.
// This matches the primary blue used across buttons/headers.
const COURSE_COLOR = '#2563EB'; // blue-600

const BUSY_WORDS = ['busy', 'sleep', 'lunch', 'dinner'];

export function courseColorForSubject(subject: string, fallback = COURSE_COLOR): string {
  const s = String(subject || '').trim();
  if (!s) return fallback;

  const sl = s.toLowerCase();
  if (BUSY_WORDS.some((w) => sl.includes(w))) {
    return '#9CA3AF'; // gray for non-course/busy blocks
  }

  // Keep behavior stable and simple: all subjects share the same color.
  return COURSE_COLOR || fallback;
}
