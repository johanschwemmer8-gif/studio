
'use server';

/**
 * Retries a function with exponential backoff.
 * @param fn The function to retry.
 * @param retries The maximum number of retries.
 * @param delay The initial delay in milliseconds.
 * @returns A promise that resolves with the result of the function.
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }
  throw lastError;
}
