/**
 * Safely extracts an array from various API response shapes.
 * If the input is an array, it returns it.
 * If the input is an object with a 'data' array, it returns data.
 * Otherwise, it returns an empty array.
 */
export function toArray<T>(response: any): T[] {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (response.data && Array.isArray(response.data)) return response.data;
  return [];
}
