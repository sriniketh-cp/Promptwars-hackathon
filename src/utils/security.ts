/**
 * Festivo AI - Security & Input Sanitization Utilities
 * Prevents XSS, control character injection, and unsafe numeric mutations.
 */

/**
 * Sanitize plain text strings by stripping HTML tags, script elements,
 * null bytes, and dangerous control characters.
 */
export function sanitizeInput(input: string | undefined | null): string {
  if (input === undefined || input === null) return '';
  if (typeof input !== 'string') return String(input);

  return input
    // Remove null bytes and control characters (except newline, tab, carriage return)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Strip HTML/XML tag markers to prevent stored XSS or unexpected markup injection
    .replace(/<[^>]*>/g, '')
    // Trim excess whitespace
    .trim();
}

/**
 * Validate and safely parse integer monetary amounts.
 * Guarantees that NaN, Infinity, negative values, and non-numeric inputs
 * are bounded deterministically.
 */
export function sanitizeNumericAmount(
  value: unknown,
  min: number = 0,
  max: number = 100_000_000,
  fallback: number = min
): number {
  if (value === undefined || value === null || value === '') return fallback;
  const num = typeof value === 'number' ? value : Number(value);
  if (isNaN(num) || !isFinite(num)) return fallback;
  if (num < min) return fallback;
  return Math.min(Math.max(Math.round(num), min), max);
}

/**
 * Deep-sanitize event requirements before persistence or external dispatch.
 */
export function sanitizeEventPayload<T extends Record<string, unknown>>(data: T): T {
  const sanitized: Record<string, unknown> = {};

  for (const [key, val] of Object.entries(data)) {
    if (typeof val === 'string') {
      sanitized[key] = sanitizeInput(val);
    } else if (typeof val === 'number') {
      sanitized[key] = isNaN(val) || !isFinite(val) ? 0 : val;
    } else if (Array.isArray(val)) {
      sanitized[key] = val.map((item) =>
        typeof item === 'string'
          ? sanitizeInput(item)
          : typeof item === 'object' && item !== null
          ? sanitizeEventPayload(item as Record<string, unknown>)
          : item
      );
    } else if (typeof val === 'object' && val !== null) {
      sanitized[key] = sanitizeEventPayload(val as Record<string, unknown>);
    } else {
      sanitized[key] = val;
    }
  }

  return sanitized as T;
}
