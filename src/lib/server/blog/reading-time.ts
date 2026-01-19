const WORDS_PER_MINUTE = 200;

export function calculateReadingTimeMinutes(content: string): number {
  if (!content) return 0;
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}
