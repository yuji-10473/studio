'use client';

import type { GenkitErrorCode, GenkitError } from 'genkit';

export function isGenkitError(
  error: unknown
): error is GenkitError<GenkitErrorCode> {
  return (
    typeof error === 'object' &&
    error !== null &&
    'isGenkitError' in error &&
    (error as { isGenkitError: boolean }).isGenkitError === true
  );
}
