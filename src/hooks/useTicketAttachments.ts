import * as Haptics from 'expo-haptics';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  AttachmentRef,
  COMPRESS_QUALITY,
  MAX_IMAGE_BYTES,
  MAX_IMAGES,
  MAX_VIDEO_BYTES,
  MAX_VIDEO_SECONDS,
  MAX_VIDEOS,
  PendingAttachment,
  PresignFileInput,
  formatMB,
  getFileSize,
  putToS3,
  requestPresign,
  resizeAction,
  uid,
  videoContentType,
} from '@/utils/ticketAttachments';

// Thrown by upload() when the caller cancels; screens use it to skip the
// error alert (the user initiated the stop).
export const UPLOAD_CANCELLED = 'UPLOAD_CANCELLED';

/**
 * Reusable pick -> compress -> validate -> presign -> PUT-upload flow for
 * ticket media, shared by the create screen and the chat composer.
 *
 * The hook owns the staged (pending) attachment list and the upload lifecycle:
 * - addImages(): multi-select images, compress each (resize longest edge to
 *   ~1600px, JPEG ~0.7) and enforce <=5 MB / <=5 total.
 * - addVideo(): single video, enforce <=60s / <=50 MB / <=2 total (user-only).
 * - upload(): presign the whole batch, PUT every file to S3 in parallel with
 *   per-file status + overall progress, and return the AttachmentRef[] to send
 *   with the ticket/message. Any failure throws (leaving the failed rows marked
 *   so the user can retry/remove).
 *
 * The add* helpers return a human-readable message string when something was
 * rejected/skipped (so the caller can surface it), or null on a clean add.
 */
export function useTicketAttachments(cardno: string | undefined, existingVideoCount = 0) {
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Always-current view of the list for the imperative upload() closure.
  const attachmentsRef = useRef(attachments);
  attachmentsRef.current = attachments;

  const cancelledRef = useRef(false);
  const controllersRef = useRef<AbortController[]>([]);

  // Abort any in-flight uploads if the screen unmounts mid-upload.
  useEffect(
    () => () => {
      cancelledRef.current = true;
      controllersRef.current.forEach((c) => c.abort());
    },
    []
  );

  const imageCount = attachments.filter((a) => a.kind === 'image').length;
  const videoCount = attachments.filter((a) => a.kind === 'video').length;
  const canAddImage = imageCount < MAX_IMAGES;
  // Cap against videos already on the ticket too (the limit is per-TICKET), not
  // just the ones staged in this compose batch. `existingVideoCount` is 0 for a
  // brand-new ticket (the create screen).
  const canAddVideo = existingVideoCount + videoCount < MAX_VIDEOS;

  // One gallery picker for BOTH photos and videos — the user picks either (or a
  // mix) in a single system picker. Each asset is routed by its type: images
  // are compressed + size-checked, videos are duration/size-checked; per-type
  // caps (MAX_IMAGES photos, MAX_VIDEOS videos-per-ticket) are enforced as we
  // fill slots, and anything over is skipped with a summary message.
  const addMedia = useCallback(async (): Promise<string | null> => {
    if (isUploading) return null;
    let imgSlots = MAX_IMAGES - imageCount;
    let vidSlots = MAX_VIDEOS - (existingVideoCount + videoCount);
    if (imgSlots <= 0 && vidSlots <= 0) {
      return `You've reached the attachment limit (${MAX_IMAGES} photos, ${MAX_VIDEOS} videos).`;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // System photo picker (PHPicker / PickVisualMedia) showing images AND
    // videos — no media-library permission needed, grants access to just the
    // selected items.
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      selectionLimit: Math.max(1, imgSlots + vidSlots),
      videoMaxDuration: MAX_VIDEO_SECONDS,
      quality: 1,
    });
    if (result.canceled) return null;

    const picked: PendingAttachment[] = [];
    let skippedLimit = 0;
    let skippedSize = 0;
    let skippedOther = 0;

    for (const asset of result.assets) {
      if (asset.type === 'video') {
        if (vidSlots <= 0) {
          skippedLimit += 1;
          continue;
        }
        const durationSec = asset.duration != null ? asset.duration / 1000 : undefined;
        if (durationSec == null || durationSec > MAX_VIDEO_SECONDS + 0.5) {
          skippedOther += 1;
          continue;
        }
        const size = getFileSize(asset.uri);
        if (size <= 0) {
          skippedOther += 1;
          continue;
        }
        if (size > MAX_VIDEO_BYTES) {
          skippedSize += 1;
          continue;
        }
        picked.push({
          id: uid(),
          uri: asset.uri,
          kind: 'video',
          contentType: videoContentType(asset),
          filename: asset.fileName || `${uid()}.mp4`,
          size,
          durationSec: Math.min(Math.round(durationSec), MAX_VIDEO_SECONDS),
          width: asset.width,
          height: asset.height,
          status: 'pending',
        });
        vidSlots -= 1;
      } else {
        if (imgSlots <= 0) {
          skippedLimit += 1;
          continue;
        }
        try {
          const resize = resizeAction(asset.width, asset.height);
          const compressed = await manipulateAsync(asset.uri, resize ? [{ resize }] : [], {
            compress: COMPRESS_QUALITY,
            format: SaveFormat.JPEG,
          });
          const size = getFileSize(compressed.uri);
          if (size <= 0 || size > MAX_IMAGE_BYTES) {
            skippedSize += 1;
            continue;
          }
          picked.push({
            id: uid(),
            uri: compressed.uri,
            kind: 'image',
            contentType: 'image/jpeg',
            filename: `${uid()}.jpg`,
            size,
            width: compressed.width,
            height: compressed.height,
            status: 'pending',
          });
          imgSlots -= 1;
        } catch {
          skippedOther += 1;
        }
      }
    }

    if (picked.length) setAttachments((prev) => [...prev, ...picked]);

    const notes: string[] = [];
    if (skippedLimit > 0) {
      notes.push(
        `${skippedLimit} skipped — limit is ${MAX_IMAGES} photos and ${MAX_VIDEOS} videos.`
      );
    }
    if (skippedSize > 0) {
      notes.push(
        `${skippedSize} too large (photos ≤ ${formatMB(MAX_IMAGE_BYTES)}, videos ≤ ${formatMB(
          MAX_VIDEO_BYTES
        )}).`
      );
    }
    if (skippedOther > 0) {
      notes.push(`${skippedOther} couldn't be added (unreadable or over ${MAX_VIDEO_SECONDS}s).`);
    }
    return notes.length ? notes.join(' ') : null;
  }, [imageCount, videoCount, existingVideoCount, isUploading]);

  const remove = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const clear = useCallback(() => {
    setAttachments([]);
    setProgress(0);
  }, []);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    controllersRef.current.forEach((c) => c.abort());
  }, []);

  // Presign the staged batch and PUT each file to S3. Returns the refs to send
  // with the create/message call. Throws on any failure (or UPLOAD_CANCELLED).
  const upload = useCallback(async (): Promise<AttachmentRef[]> => {
    const current = attachmentsRef.current;
    if (current.length === 0) return [];
    if (!cardno) throw new Error('Missing card number.');

    cancelledRef.current = false;
    controllersRef.current = [];

    const refFor = (a: PendingAttachment, key: string): AttachmentRef => ({
      key,
      contentType: a.contentType,
      kind: a.kind,
    });

    // On a retry after a partial-batch failure, files that already succeeded
    // keep their S3 key — re-presigning/PUTting them would orphan the first
    // copy — so we only upload the ones not yet 'uploaded'.
    const pending = current.filter((a) => !(a.status === 'uploaded' && a.key));

    // Everything was already uploaded on a prior attempt: reuse the stored keys.
    if (pending.length === 0) {
      return current.map((a) => refFor(a, a.key as string));
    }

    setIsUploading(true);
    setProgress(0);
    setAttachments((prev) =>
      prev.map((a) =>
        pending.some((p) => p.id === a.id) ? { ...a, status: 'uploading', error: undefined } : a
      )
    );

    try {
      const files: PresignFileInput[] = pending.map((a) => ({
        filename: a.filename,
        contentType: a.contentType,
        size: a.size,
        kind: a.kind,
        ...(a.kind === 'video' && a.durationSec ? { durationSec: a.durationSec } : {}),
      }));

      const presigned = await requestPresign(cardno, files);
      if (presigned.length !== pending.length) {
        throw new Error('Upload preparation failed. Please try again.');
      }

      let done = 0;
      const results = await Promise.allSettled(
        pending.map(async (a, i) => {
          const { key, uploadUrl } = presigned[i];
          const controller = new AbortController();
          controllersRef.current.push(controller);
          await putToS3(uploadUrl, a.uri, a.contentType, controller.signal);
          done += 1;
          setProgress(done / pending.length);
          setAttachments((prev) =>
            prev.map((p) => (p.id === a.id ? { ...p, status: 'uploaded', key } : p))
          );
          return { id: a.id, key };
        })
      );

      if (cancelledRef.current) throw new Error(UPLOAD_CANCELLED);

      // Map freshly-uploaded keys back to their file id.
      const keyById = new Map<string, string>();
      let failed = 0;
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') {
          keyById.set(r.value.id, r.value.key);
        } else {
          failed += 1;
          setAttachments((prev) =>
            prev.map((p) =>
              p.id === pending[i].id ? { ...p, status: 'error', error: 'Upload failed' } : p
            )
          );
        }
      });

      if (failed > 0) {
        throw new Error(
          `${failed} file${failed > 1 ? 's' : ''} failed to upload. Please remove ${
            failed > 1 ? 'them' : 'it'
          } or try again.`
        );
      }

      // Refs for the whole batch in original order: previously-uploaded files
      // reuse their stored key, the rest use the key we just obtained.
      return current.map((a) =>
        refFor(a, a.status === 'uploaded' && a.key ? a.key : (keyById.get(a.id) as string))
      );
    } finally {
      controllersRef.current = [];
      setIsUploading(false);
    }
  }, [cardno]);

  return {
    attachments,
    imageCount,
    videoCount,
    canAddImage,
    canAddVideo,
    canAddMedia: canAddImage || canAddVideo,
    hasAttachments: attachments.length > 0,
    addMedia,
    remove,
    clear,
    cancel,
    upload,
    isUploading,
    progress,
  };
}
