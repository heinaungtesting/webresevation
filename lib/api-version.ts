/**
 * API Versioning Utilities
 *
 * Supports versioning via:
 * 1. URL path: /api/v1/sessions
 * 2. Header: Accept-Version: v1
 * 3. Query param: ?version=1
 *
 * Default version: v1
 */

export const CURRENT_API_VERSION = 'v1';
export const SUPPORTED_VERSIONS = ['v1'] as const;
export const DEFAULT_VERSION = 'v1';

export type ApiVersion = (typeof SUPPORTED_VERSIONS)[number];

/**
 * Extract API version from request
 * Priority: URL path > Header > Query param > Default
 */
export function getApiVersion(request: Request): ApiVersion {
  const url = new URL(request.url);

  // Check URL path for version (e.g., /api/v1/sessions)
  const pathMatch = url.pathname.match(/\/api\/(v\d+)\//);
  if (pathMatch && isValidVersion(pathMatch[1])) {
    return pathMatch[1] as ApiVersion;
  }

  // Check Accept-Version header
  const headerVersion = request.headers.get('Accept-Version');
  if (headerVersion && isValidVersion(headerVersion)) {
    return headerVersion as ApiVersion;
  }

  // Check query parameter
  const queryVersion = url.searchParams.get('version');
  if (queryVersion) {
    const versionString = queryVersion.startsWith('v') ? queryVersion : `v${queryVersion}`;
    if (isValidVersion(versionString)) {
      return versionString as ApiVersion;
    }
  }

  return DEFAULT_VERSION;
}

/**
 * Check if a version string is valid
 */
export function isValidVersion(version: string): version is ApiVersion {
  return SUPPORTED_VERSIONS.includes(version as ApiVersion);
}

/**
 * Check if a version is deprecated
 */
export function isDeprecatedVersion(version: ApiVersion): boolean {
  // Currently no deprecated versions
  const deprecatedVersions: string[] = [];
  return deprecatedVersions.includes(version);
}

/**
 * Get deprecation warning message
 */
export function getDeprecationWarning(version: ApiVersion): string | null {
  if (!isDeprecatedVersion(version)) {
    return null;
  }
  return `API version ${version} is deprecated and will be removed in a future release. Please migrate to ${CURRENT_API_VERSION}.`;
}

/**
 * Version response headers
 */
export function getVersionHeaders(version: ApiVersion): HeadersInit {
  const headers: HeadersInit = {
    'X-API-Version': version,
    'X-API-Current-Version': CURRENT_API_VERSION,
  };

  const deprecationWarning = getDeprecationWarning(version);
  if (deprecationWarning) {
    headers['X-API-Deprecation-Warning'] = deprecationWarning;
    headers['Deprecation'] = 'true';
    headers['Sunset'] = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toUTCString(); // 90 days
  }

  return headers;
}

/**
 * Apply version headers to response
 */
export function applyVersionHeaders(
  response: Response,
  version: ApiVersion
): Response {
  const versionHeaders = getVersionHeaders(version);

  Object.entries(versionHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

/**
 * Version-aware response helper
 */
export function versionedResponse<T>(
  data: T,
  version: ApiVersion,
  options: ResponseInit = {}
): Response {
  const headers = new Headers(options.headers);

  // Add version headers
  const versionHeaders = getVersionHeaders(version);
  Object.entries(versionHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });

  // Add content type
  headers.set('Content-Type', 'application/json');

  return new Response(JSON.stringify(data), {
    ...options,
    headers,
  });
}

/**
 * Transform data based on API version
 * Use this to handle breaking changes between versions
 */
export function transformForVersion<T>(
  data: T,
  version: ApiVersion,
  transformers: Partial<Record<ApiVersion, (data: T) => any>>
): any {
  const transformer = transformers[version];
  if (transformer) {
    return transformer(data);
  }
  return data;
}

/**
 * Version router - map different handlers to versions
 */
export type VersionedHandler = (request: Request) => Promise<Response>;

export function createVersionedHandler(
  handlers: Partial<Record<ApiVersion, VersionedHandler>>,
  defaultHandler: VersionedHandler
): VersionedHandler {
  return async (request: Request) => {
    const version = getApiVersion(request);
    const handler = handlers[version] || defaultHandler;
    const response = await handler(request);
    return applyVersionHeaders(response, version);
  };
}

/**
 * API Version Context
 * For use with versioned route handlers
 */
export interface VersionContext {
  version: ApiVersion;
  isDeprecated: boolean;
  currentVersion: string;
}

export function getVersionContext(request: Request): VersionContext {
  const version = getApiVersion(request);
  return {
    version,
    isDeprecated: isDeprecatedVersion(version),
    currentVersion: CURRENT_API_VERSION,
  };
}

/**
 * Middleware to add version to request context
 * Usage: wrap your route handler with this
 */
export function withVersioning(
  handler: (request: Request, context: VersionContext) => Promise<Response>
): (request: Request) => Promise<Response> {
  return async (request: Request) => {
    const versionContext = getVersionContext(request);
    const response = await handler(request, versionContext);
    return applyVersionHeaders(response, versionContext.version);
  };
}
