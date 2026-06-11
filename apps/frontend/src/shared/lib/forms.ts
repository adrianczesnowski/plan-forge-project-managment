import type { ZodTypeAny, output } from 'zod';

export type FieldErrors = Record<string, string>;

export interface ValidationResult<T> {
  data: T | null;
  /** Map of field path → first issue message key (the caller translates it). */
  errors: FieldErrors;
}

/** Validates form values against a Zod schema and groups issues by field. */
export function validateForm<Schema extends ZodTypeAny>(
  schema: Schema,
  values: unknown,
): ValidationResult<output<Schema>> {
  const result = schema.safeParse(values);
  if (result.success) {
    return { data: result.data, errors: {} };
  }

  const errors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path.join('.');
    if (field && !errors[field]) {
      errors[field] = issue.message;
    }
  }
  return { data: null, errors };
}
