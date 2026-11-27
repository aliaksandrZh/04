/**
 * Task title validation shared by the quick-add bar and the edit modal.
 */

export interface ValidationResult {
  valid: boolean;
  /** Human-readable message shown inline when the title is invalid. */
  error?: string;
}

export const TITLE_REQUIRED_MESSAGE = 'Please enter a task title before saving.';

/**
 * Validates a task title. A title that is empty or whitespace-only is
 * rejected; otherwise it is trimmed and returned via the result so callers
 * save the normalized value.
 */
export function validateTaskTitle(rawTitle: string): ValidationResult & { trimmed: string } {
  const trimmed = rawTitle.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: TITLE_REQUIRED_MESSAGE, trimmed };
  }
  if (trimmed.length > 200) {
    return { valid: false, error: 'Title must be 200 characters or fewer.', trimmed: trimmed.slice(0, 200) };
  }
  return { valid: true, trimmed };
}

/** Lowercases, trims and drops empty tags from a comma-separated tag input. */
export function parseTagInput(raw: string): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const piece of raw.split(',')) {
    const tag = piece.trim().toLowerCase();
    if (tag.length > 0 && !seen.has(tag)) {
      seen.add(tag);
      tags.push(tag);
    }
  }
  return tags;
}
