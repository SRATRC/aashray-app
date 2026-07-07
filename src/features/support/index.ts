// src/features/support/index.ts — public entry point for the support feature.
// The Expo Router route files (app/support/*) re-export these screens; everything
// else in the feature is internal (imported via relative paths within the feature).
export { default as TicketListScreen } from './screens/TicketListScreen';
export { default as CreateTicketScreen } from './screens/CreateTicketScreen';
export { default as TicketDetailScreen } from './screens/TicketDetailScreen';
