// Backend-accurate types for the support ticketing feature.
// Source of truth: aashray-backend models/{ticket,ticket_message,ticket_attachment}.model.js
// and controllers/client/ticket.controller.js.

// ---- Attachment types (moved verbatim from utils/ticketAttachments.ts) ----
// These will be removed from ticketAttachments.ts in a later task once every
// consumer imports them from here instead.

export type AttachmentKind = 'image' | 'video';

export type PendingStatus = 'pending' | 'uploading' | 'uploaded' | 'error';

// A locally-picked (and, for images, compressed) asset staged for upload.
export interface PendingAttachment {
  id: string; // local uid, used for list keys + removal
  uri: string; // local file:// uri (compressed output for images)
  kind: AttachmentKind;
  contentType: string; // exact type declared to presign + sent as the PUT header
  filename: string;
  size: number; // bytes
  durationSec?: number; // video only
  width?: number;
  height?: number;
  status: PendingStatus;
  key?: string; // s3 key, set once presigned/uploaded
  error?: string;
}

// The shape create/message endpoints expect in their `attachments` array.
export interface AttachmentRef {
  key: string;
  contentType: string;
  kind: AttachmentKind;
}

// The shape GET /tickets/:id returns for each stored attachment.
export interface ServedAttachment {
  id: number;
  kind: AttachmentKind;
  contentType: string;
  url: string; // serve-endpoint PATH (not a raw S3 url); 302s to a presigned GET
  expired: boolean;
}

export interface PresignFileInput {
  filename: string;
  contentType: string;
  size: number;
  kind: AttachmentKind;
  durationSec?: number;
}

export interface PresignResult {
  key: string;
  uploadUrl: string;
}

// ---- Ticket domain (new; derived from backend models) ----

export type TicketStatus = 'open' | 'in progress' | 'resolved' | 'closed';
export type TicketOs = 'Android' | 'iOS' | 'Web' | 'Other';
export type SenderType = 'user' | 'admin';

// GET /tickets list row (raw Ticket model row, no messages/attachments).
export interface TicketListItem {
  id: string;
  service: string;
  description: string | null;
  status: TicketStatus;
  createdAt: string;
}

// A row from ticket_messages, as returned embedded in GET /tickets/:id
// (with attachments grouped in) and as broadcast (bare, no attachments) over
// the SSE stream.
export interface TicketMessage {
  id: number;
  ticket_id: string;
  sender_id?: string;
  sender_type: SenderType;
  message: string | null;
  createdAt: string;
  attachments?: ServedAttachment[];
}

// GET /tickets/:id response body's `data`.
export interface TicketDetail {
  id: string;
  issued_by?: string;
  service: string;
  description: string | null;
  status: TicketStatus;
  os?: TicketOs;
  app_version?: string;
  createdAt: string;
  attachments: ServedAttachment[];
  messages: TicketMessage[];
}

// SSE frame the backend broadcasts (narrower than TicketMessage: no attachments, carries hasAttachments)
export type TicketStreamFrame =
  | { type: 'connected' }
  | { type: 'ping' }
  | { type: 'status_update'; status: TicketStatus; updatedBy?: string }
  | (TicketMessage & { hasAttachments?: boolean });

// The 12 support departments — labels + order mirror the backend's
// TICKET_SERVICE_ROLE_MAP (config/constants.js), which is the source of truth.
// The stored `service` value is the label string itself.
export const TICKET_DEPARTMENTS = [
  'Electrical',
  'Housekeeping',
  'Maintenance',
  'Raj Prasad',
  'Raj Adhyayan',
  'Raj Sharan',
  'Raj Pravas',
  'Raj Utsav',
  'WiFi',
  'Payment/Accounts',
  'IT',
  'Others',
] as const;
