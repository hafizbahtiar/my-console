/**
 * CSRF Token Utilities
 * Provides a reusable function to get CSRF tokens for API requests
 */

/**
 * Fetches a CSRF token from the API
 * @returns Promise<string> The CSRF token
 * @throws Error if the token cannot be fetched
 */
export async function getCSRFToken(): Promise<string> {
  try {
    const response = await fetch('/api/csrf-token', {
      credentials: 'include', // Include cookies to get the correct session ID
    });
    if (!response.ok) {
      throw new Error('Failed to get CSRF token');
    }
    const data = await response.json();
    return data.token || '';
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
    throw new Error('Failed to get CSRF token');
  }
}

/**
 * Creates headers with CSRF token for API requests
 * @returns Promise<Record<string, string>> Headers object with CSRF token
 */
export async function getCSRFHeaders(): Promise<Record<string, string>> {
  const token = await getCSRFToken();
  return {
    'Content-Type': 'application/json',
    'x-csrf-token': token,
  };
}

/**
 * Creates headers with CSRF token using X-CSRF-Token header name (alternative format)
 * @returns Promise<Record<string, string>> Headers object with CSRF token
 */
export async function getCSRFHeadersAlt(): Promise<Record<string, string>> {
  const token = await getCSRFToken();
  return {
    'Content-Type': 'application/json',
    'X-CSRF-Token': token,
  };
}

