export enum DeepLinkType {
  ADHYAYAN = 'adhyayan',
  ADHYAYAN_FEEDBACK = 'adhyayan_feedback',
  UTSAV = 'utsav',
  MENU = 'menu',
  MAINTENANCE = 'maintenance',
  PENDING_PAYMENT = 'pending_payment',
  BOOKINGS = 'bookings',
  UNKNOWN = 'unknown',
}

export interface ParsedDeepLink {
  type: DeepLinkType;
  params: Record<string, string>;
  route: string;
}

export interface DeepLinkConfig {
  schemes: string[];
  domains: string[];
}

export interface DeepLinkHandler {
  parseUrl: (url: string) => ParsedDeepLink | null;
  navigate: (deepLink: ParsedDeepLink) => void;
  canHandle: (url: string) => boolean;
}

export type DeepLinkUrl = string;