/**
 * Extracts a user-friendly error message from an Axios error response.
 * Handles Spring Boot validation errors (MethodArgumentNotValidException),
 * custom ApiResponse error messages, and network failures.
 */
export function formatApiError(err, fallback = 'Operation failed') {
  if (!err) return fallback;

  const res = err.response;
  if (!res) {
    return err.message || fallback;
  }

  const data = res.data;
  if (!data) {
    return `Server error (${res.status}): ${res.statusText || fallback}`;
  }

  // 1. If backend returned field-level validation errors in data.data
  if (data.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
    const fieldErrors = Object.values(data.data).filter(Boolean);
    if (fieldErrors.length > 0) {
      return fieldErrors.join(' • ');
    }
  }

  // 2. If data.message is specific and not generic
  if (data.message && typeof data.message === 'string') {
    if (data.message !== 'Validation failed for one or more fields') {
      return data.message;
    }
  }

  // 3. Fallback to general message or error string
  return data.error || data.message || fallback;
}
