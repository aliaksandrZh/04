import { describe, expect, it } from 'vitest';
import { parseTagInput, validateTaskTitle } from './validation';

describe('validateTaskTitle', () => {
  it('accepts a plain title and trims whitespace', () => {
    const result = validateTaskTitle('  Buy milk  ');
    expect(result.valid).toBe(true);
    expect(result.trimmed).toBe('Buy milk');
    expect(result.error).toBeUndefined();
  });

  it('rejects an empty title', () => {
    const result = validateTaskTitle('');
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('rejects a whitespace-only title', () => {
    const result = validateTaskTitle('   \t ');
    expect(result.valid).toBe(false);
  });

  it('rejects overly long titles', () => {
    const result = validateTaskTitle('x'.repeat(201));
    expect(result.valid).toBe(false);
  });

  it('accepts a title of exactly 200 characters', () => {
    const result = validateTaskTitle('x'.repeat(200));
    expect(result.valid).toBe(true);
  });
});

describe('parseTagInput', () => {
  it('splits, trims and lowercases comma-separated tags', () => {
    expect(parseTagInput(' Work, home ,URGENT')).toEqual(['work', 'home', 'urgent']);
  });

  it('deduplicates and drops empty pieces', () => {
    expect(parseTagInput('a, , a, b')).toEqual(['a', 'b']);
  });

  it('returns an empty list for empty input', () => {
    expect(parseTagInput('')).toEqual([]);
  });
});
