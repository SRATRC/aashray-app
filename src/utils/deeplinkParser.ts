import { DeepLinkType, ParsedDeepLink, DeepLinkConfig } from '@/src/types/deeplink';

/**
 * Configuration for supported deep link schemes and domains
 */
export const DEEPLINK_CONFIG: DeepLinkConfig = {
  schemes: ['aashray://'],
  domains: ['https://aashray.vitraagvigyaan.org'],
};

/**
 * Regular expressions for matching different deep link patterns
 */
const DEEPLINK_PATTERNS = {
  [DeepLinkType.ADHYAYAN_FEEDBACK]: /^\/adhyayan\/feedback\/([^/]+)$/,
  [DeepLinkType.ADHYAYAN]: /^\/adhyayan\/([^/]+)$/,
  [DeepLinkType.UTSAV]: /^\/utsav\/([^/]+)$/,
} as const;

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
 * Parses a deep link URL and returns structured information
 */
export const parseDeepLink = (url: string): ParsedDeepLink | null => {
  if (!isValidDeepLink(url)) {
    console.warn('⚠️ Invalid deep link format:', url);
    return null;
  }

  const path = normalizeUrl(url);
  console.log('🔍 Parsing deep link path:', path);

  // Try to match against known patterns (order matters - more specific first)
  for (const [type, pattern] of Object.entries(DEEPLINK_PATTERNS)) {
    const match = path.match(pattern);
    if (match) {
      const id = match[1];
      console.log('✅ Matched deep link:', { type, id, path });

      return {
        type: type as DeepLinkType,
        id,
        route: path,
      };
    }
  }

  // No pattern matched
  console.warn('❌ Unrecognized deep link pattern:', path);
  return {
    type: DeepLinkType.UNKNOWN,
    id: '',
    route: path,
  };
};

/**
 * Builds a deep link route path from parsed data
 */
export const buildRoute = (deepLink: ParsedDeepLink): string => {
  switch (deepLink.type) {
    case DeepLinkType.ADHYAYAN_FEEDBACK:
      return `/adhyayan/feedback/${deepLink.id}`;
    case DeepLinkType.ADHYAYAN:
      return `/adhyayan/${deepLink.id}`;
    case DeepLinkType.UTSAV:
      return `/utsav/${deepLink.id}`;
    case DeepLinkType.UNKNOWN:
    default:
      return '/+not-found';
  }
};