// src/features/support/index.ts — public entry point for the support feature.
// Interim barrel (Task 3): exposes the attachment layer to the create/[id]
// screens and media components that still live outside the feature and are
// migrated in later tasks (5, 7, 8). Task 9 adds the screen re-exports here.
export { MAX_IMAGES, MAX_VIDEOS, buildAttachmentUri, runUpload } from './attachments';
export { useTicketAttachments } from './hooks/useTicketAttachments';
export { collectDiagnostics } from './diagnostics';
export { getStatusColor } from './status';
export type { AttachmentKind, AttachmentRef, PendingAttachment, ServedAttachment } from './types';
