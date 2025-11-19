import { DeepLinkType, ParsedDeepLink, DeepLinkConfig } from '@/src/types/deeplink';
import { DEEPLINK_ROUTES } from '@/src/config/deeplinks';

/**
 * Configuration for supported deep link schemes and domains
 */
export const DEEPLINK_CONFIG: DeepLinkConfig = {
  schemes: ['aashray://'],
  domains: ['https://aashray.vitraagvigyaan.org'],
};

/**
 * Normalizes a URL by removing the scheme/domain and returning just the path
 */
export const normalizeUrl = (url: string): string => {
  let path = url;

  // Remove custom scheme
  for (const scheme of DEEPLINK_CONFIG.schemes) {
    if (path.startsWith(scheme)) {
      path = '/' + path.replace(scheme, '');
      break;
    }
  }

  // Remove domain
  for (const domain of DEEPLINK_CONFIG.domains) {
    if (path.startsWith(domain)) {
      path = path.replace(domain, '');
      break;
    }
  }

  // Ensure path starts with /
  if (!path.startsWith('/')) {
    path = '/' + path;
  }

  return path;
};

/**
 * Checks if a URL is a valid deep link for this app
 */
export const isValidDeepLink = (url: string): boolean => {
  // Check if URL starts with supported scheme or domain
  const hasValidScheme = DEEPLINK_CONFIG.schemes.some((scheme) => url.startsWith(scheme));
  const hasValidDomain = DEEPLINK_CONFIG.domains.some((domain) => url.startsWith(domain));

  return hasValidScheme || hasValidDomain;
};

/**
 * Matches a path against a pattern and returns params if matched
 * Pattern example: /event/:id
 */
const matchPath = (pattern: string, path: string): Record<string, string> | null => {
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = path.split('/').filter(Boolean);

  if (patternParts.length !== pathParts.length) {
    return null;
  }

  const params: Record<string, string> = {};

  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];
    const pathPart = pathParts[i];

    if (patternPart.startsWith(':')) {
      const paramName = patternPart.slice(1);
      params[paramName] = pathPart;
    } else if (patternPart !== pathPart) {
      return null;
    }
  }

  return params;
};

/**
 * Parses a deep link URL and returns structured information
 */
export const parseDeepLink = (url: string): ParsedDeepLink | null => {
  if (!isValidDeepLink(url)) {
    console.warn('⚠️ Invalid deep link format:', url);
    return null;
  }

  const path = normalizeUrl(url);
  console.log('🔍 Parsing deep link path:', path);

  // Try to match against configured routes
  for (const route of DEEPLINK_ROUTES) {
    const params = matchPath(route.pattern, path);
    if (params) {
      console.log('✅ Matched deep link:', { type: route.name, params, path });
      return {
        type: route.name,
        params,
        route: path,
      };
    }
  }

  // No pattern matched
  console.warn('❌ Unrecognized deep link pattern:', path);
  return {
    type: DeepLinkType.UNKNOWN,
    params: {},
    route: path,
  };
};

/**
 * Builds a deep link route path from parsed data
 */
export const buildRoute = (deepLink: ParsedDeepLink): string => {
  if (deepLink.type === DeepLinkType.UNKNOWN) {
    return '/+not-found';
  }

  const routeConfig = DEEPLINK_ROUTES.find((r) => r.name === deepLink.type);
  if (!routeConfig) {
    console.warn('⚠️ No route config found for type:', deepLink.type);
    return '/+not-found';
  }

  let targetPath = routeConfig.target;

  // Replace params in target path (e.g. [id] -> 123)
  // Note: Expo Router uses [param] syntax for dynamic routes
  for (const [key, value] of Object.entries(deepLink.params)) {
    targetPath = targetPath.replace(`[${key}]`, value);
  }

  return targetPath;
};
