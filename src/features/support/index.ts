// src/features/support/index.ts — public entry point for the support feature.
// Interim barrel (Task 3): exposes the attachment layer and media components
// to the create/[id] screens, which still live outside the feature and are
// migrated in a later task (9), which also adds the screen re-exports here.
export { MAX_IMAGES, MAX_VIDEOS, buildAttachmentUri, runUpload } from './attachments';
export { useTicketAttachments } from './hooks/useTicketAttachments';
export { useTicketStream } from './hooks/useTicketStream';
export { collectDiagnostics } from './diagnostics';
export { getStatusColor } from './status';
export type { AttachmentKind, AttachmentRef, PendingAttachment, ServedAttachment } from './types';
export { default as MediaViewer } from './components/MediaViewer';
export type { MediaViewerItem } from './components/MediaViewer';
export { default as AttachmentPreviewStrip } from './components/AttachmentPreviewStrip';
export { default as TicketMessageAttachments } from './components/TicketMessageAttachments';
