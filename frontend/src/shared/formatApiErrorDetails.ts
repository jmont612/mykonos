// src/shared/formatApiErrorDetails.ts
import { ApiError } from '../api/client';

interface ZodIssueLike {
  path: (string | number)[];
  message: string;
}

function isZodIssueArray(details: unknown): details is ZodIssueLike[] {
  return (
    Array.isArray(details) &&
    details.length > 0 &&
    details.every(
      (issue) =>
        typeof issue === 'object' &&
        issue !== null &&
        Array.isArray((issue as { path?: unknown }).path) &&
        typeof (issue as { message?: unknown }).message === 'string',
    )
  );
}

/**
 * Turns an ApiError into a user-facing message. For a 400 with Zod-shaped
 * validation `details` (the backend's `err.issues` from a ZodError), joins
 * each issue into a readable, comma-separated message instead of the
 * generic "Invalid input" text. Falls back to `error.message` otherwise.
 */
export function formatApiErrorDetails(error: ApiError): string {
  if (error.status === 400 && isZodIssueArray(error.details)) {
    return error.details
      .map((issue) => (issue.path.length > 0 ? `${issue.path.join('.')}: ${issue.message}` : issue.message))
      .join(', ');
  }
  return error.message;
}
