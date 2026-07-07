import { File as ExpoFile } from 'expo-file-system';
import handleAPICall from '@/src/utils/HandleApiCall';
import { resolveApiBaseUrl } from '@/src/utils/resolveBaseUrl';

// Pure (React-free) types + helpers for ticket media attachments, shared by the
// useTicketAttachments hook and the create / chat screens. Limits mirror
// aashray-backend/config/constants.js — the backend re-validates every batch on
// presign and every key on attach, so these are UX-only pre-checks.

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

// ---- Limits (mirror the backend) ----------------------------------------
export const MAX_IMAGES = 5;
export const MAX_VIDEOS = 2;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB (post-compression)
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50 MB
export const MAX_VIDEO_SECONDS = 60;

// ---- Compression targets ------------------------------------------------
export const COMPRESS_MAX_EDGE = 1600; // resize longest edge to ~1600px
export const COMPRESS_QUALITY = 0.7; // JPEG quality

export function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function formatMB(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return `${Number.isInteger(mb) ? mb : mb.toFixed(0)} MB`;
}

// Cheap on-disk size lookup (reads metadata, never loads the bytes). Returns 0
// when the file is missing/unreadable so callers can reject it up front.
export function getFileSize(uri: string): number {
  try {
    const f = new ExpoFile(uri);
    if (!f.exists) return 0;
    return f.size ?? 0;
  } catch {
    return 0;
  }
}

// Resize action for expo-image-manipulator: shrink the longest edge to
// COMPRESS_MAX_EDGE while preserving aspect ratio. Returns null (no resize)
// when the image is already small enough, so we never upscale.
export function resizeAction(
  width?: number,
  height?: number
): { width?: number; height?: number } | null {
  if (!width || !height) return { width: COMPRESS_MAX_EDGE };
  const longest = Math.max(width, height);
  if (longest <= COMPRESS_MAX_EDGE) return null;
  return width >= height ? { width: COMPRESS_MAX_EDGE } : { height: COMPRESS_MAX_EDGE };
}

export function videoContentType(asset: {
  mimeType?: string;
  uri: string;
  fileName?: string | null;
}): string {
  if (asset.mimeType && asset.mimeType.startsWith('video/')) return asset.mimeType;
  const source = asset.fileName || asset.uri;
  const ext = source.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'mov':
      return 'video/quicktime';
    case 'm4v':
    case 'mp4':
      return 'video/mp4';
    case 'mkv':
      return 'video/x-matroska';
    case 'webm':
      return 'video/webm';
    case '3gp':
      return 'video/3gpp';
    default:
      return 'video/mp4';
  }
}

export function extFromContentType(contentType: string): string {
  switch (contentType) {
    case 'video/quicktime':
      return 'mov';
    case 'video/x-matroska':
      return 'mkv';
    case 'video/3gpp':
      return '3gp';
    default:
      return contentType.split('/')[1] || 'mp4';
  }
}

// POST /tickets/attachments/presign. Returns order-matched [{ key, uploadUrl }].
// allowToast=false: we surface upload errors ourselves (inline / CustomAlert).
export function requestPresign(
  cardno: string,
  files: PresignFileInput[]
): Promise<PresignResult[]> {
  return new Promise((resolve, reject) => {
    handleAPICall(
      'POST',
      '/tickets/attachments/presign',
      null,
      { cardno, files },
      (res: any) => resolve(res?.data ?? []),
      () => {},
      (err: any) =>
        reject(new Error(err?.message || 'Could not prepare the upload. Please try again.')),
      false
    );
  });
}

// Upload one local file straight to S3 via its presigned PUT url. The signature
// is bound to the exact Content-Type declared at presign, and RN derives the
// request Content-Type from the Blob's own type — so we re-type the blob to
// match (and set the header too) to keep the signature valid.
export async function putToS3(
  uploadUrl: string,
  uri: string,
  contentType: string,
  signal?: AbortSignal
): Promise<void> {
  if (signal?.aborted) throw new Error('Upload cancelled');
  // Upload the local file with expo-file-system's native binary upload rather
  // than `fetch(uri).blob()` + a fetch PUT: React Native's fetch can't reliably
  // read a file:// URI (it rejects with "Network request failed" before the
  // request is even sent), so no bytes ever reach S3. `File.upload` streams the
  // file's raw bytes (UploadType.BINARY_CONTENT by default) straight to the
  // presigned PUT URL with the exact Content-Type the URL was signed for.
  const task = new ExpoFile(uri).createUploadTask(uploadUrl, {
    httpMethod: 'PUT',
    headers: { 'Content-Type': contentType },
  });
  const onAbort = () => task.cancel();
  signal?.addEventListener('abort', onAbort);
  try {
    const result = await task.uploadAsync();
    if (result.status < 200 || result.status >= 300) {
      throw new Error(`Upload failed (HTTP ${result.status})`);
    }
  } finally {
    signal?.removeEventListener('abort', onAbort);
  }
}

// Build a loadable URI from a served attachment's `url` (an absolute API path
// like `/api/v1/tickets/.../attachments/..`). resolveApiBaseUrl() already ends
// in `/api/v1`, so strip that version prefix from the base before joining to
// avoid a doubled `/api/v1` path. RN's Image/Video follow the 302 to S3.
export function buildAttachmentUri(
  serveUrl: string,
  cardno: string,
  baseUrl: string | undefined = resolveApiBaseUrl()
): string | null {
  if (!baseUrl || !serveUrl) return null;
  const origin = baseUrl.replace(/\/api\/v\d+\/?$/, '');
  const sep = serveUrl.includes('?') ? '&' : '?';
  return `${origin}${serveUrl}${sep}cardno=${encodeURIComponent(cardno)}`;
}
