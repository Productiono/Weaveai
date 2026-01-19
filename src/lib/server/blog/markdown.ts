import { parseMarkdown } from '$lib/utils/markdown.js';

export function renderMarkdown(content: string): string {
  return parseMarkdown(content || '');
}
