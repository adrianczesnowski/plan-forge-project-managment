import { AxiosError } from 'axios';
import i18n from '@/i18n/i18n';
import type { ApiErrorResponse } from '@planforge/shared';

/**
 * Maps a backend error (English message) to the user's language
 * via the `errors` namespace. Unknown messages fall back to a generic one.
 */
export function translateApiError(error: unknown): string {
  const fallback = i18n.t('fallback', { ns: 'errors' });

  if (error instanceof AxiosError) {
    const body = error.response?.data as ApiErrorResponse | undefined;
    const message = body?.error?.message;
    if (message) {
      return i18n.t(message, { ns: 'errors', defaultValue: fallback });
    }
  }
  return fallback;
}
