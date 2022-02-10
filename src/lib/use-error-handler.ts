import { useState } from 'react';

/**
 * Utility hook to declaratively or imperatively propagate an
 * error to the nearest error boundary.
 * *Should only be called from a child of ErrorBoundary*
 *
 * * Pass an error prop to declaratively propagate errors
 * when its value is truthy
 *
 * * Call the returned handler with a truthy value to
 * imperatively propagate errors
 *
 * @param errorProp - Declarative error prop that will throw when it is truthy
 */
export default function useErrorHandler(
  errorProp?: unknown
): (error: unknown) => void {
  const [error, setError] = useState<unknown>(null);

  if (errorProp) {
    throw errorProp;
  }
  if (error) {
    throw error;
  }

  return setError;
}
