import { useCallback, useEffect, useRef, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as Haptics from 'expo-haptics';
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
} from '@/src/utils/ticketAttachments';

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
export function useTicketAttachments(cardno: string | undefined) {
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
  const canAddVideo = videoCount < MAX_VIDEOS;

  const addImages = useCallback(async (): Promise<string | null> => {
    if (isUploading) return null;
    const remaining = MAX_IMAGES - imageCount;
    if (remaining <= 0) return `You can attach up to ${MAX_IMAGES} images.`;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // System photo picker (PHPicker / PickVisualMedia) — no media-library
    // permission needed, grants access to just the selected items.
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 1,
    });
    if (result.canceled) return null;

    const picked: PendingAttachment[] = [];
    let skipped = 0;
    for (const asset of result.assets.slice(0, remaining)) {
      try {
        const resize = resizeAction(asset.width, asset.height);
        const compressed = await manipulateAsync(asset.uri, resize ? [{ resize }] : [], {
          compress: COMPRESS_QUALITY,
          format: SaveFormat.JPEG,
        });
        const size = getFileSize(compressed.uri);
        if (size <= 0 || size > MAX_IMAGE_BYTES) {
          skipped += 1;
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
      } catch {
        skipped += 1;
      }
    }

    if (picked.length) setAttachments((prev) => [...prev, ...picked]);
    if (skipped > 0) {
      return `${skipped} image${skipped > 1 ? 's' : ''} couldn't be added (over ${formatMB(
        MAX_IMAGE_BYTES
      )} or unreadable).`;
    }
    return null;
  }, [imageCount, isUploading]);

  const addVideo = useCallback(async (): Promise<string | null> => {
    if (isUploading) return null;
    if (videoCount >= MAX_VIDEOS) return `You can attach up to ${MAX_VIDEOS} videos.`;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsMultipleSelection: false,
      videoMaxDuration: MAX_VIDEO_SECONDS,
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) return null;

    const asset = result.assets[0];
    const durationSec = asset.duration != null ? asset.duration / 1000 : undefined;
    if (durationSec == null) return "Couldn't read the video's length. Please try another.";
    if (durationSec > MAX_VIDEO_SECONDS + 0.5) {
      return `Videos must be ${MAX_VIDEO_SECONDS} seconds or shorter.`;
    }

    const size = getFileSize(asset.uri);
    if (size <= 0) return "Couldn't read the video file. Please try another.";
    if (size > MAX_VIDEO_BYTES) return `Videos must be ${formatMB(MAX_VIDEO_BYTES)} or smaller.`;

    const contentType = videoContentType(asset);
    setAttachments((prev) => [
      ...prev,
      {
        id: uid(),
        uri: asset.uri,
        kind: 'video',
        contentType,
        filename: asset.fileName || `${uid()}.mp4`,
        size,
        durationSec: Math.min(Math.round(durationSec), MAX_VIDEO_SECONDS),
        width: asset.width,
        height: asset.height,
        status: 'pending',
      },
    ]);
    return null;
  }, [videoCount, isUploading]);

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
    setIsUploading(true);
    setProgress(0);
    setAttachments((prev) => prev.map((a) => ({ ...a, status: 'uploading', error: undefined })));

    try {
      const files: PresignFileInput[] = current.map((a) => ({
        filename: a.filename,
        contentType: a.contentType,
        size: a.size,
        kind: a.kind,
        ...(a.kind === 'video' && a.durationSec ? { durationSec: a.durationSec } : {}),
      }));

      const presigned = await requestPresign(cardno, files);
      if (presigned.length !== current.length) {
        throw new Error('Upload preparation failed. Please try again.');
      }

      let done = 0;
      const results = await Promise.allSettled(
        current.map(async (a, i) => {
          const { key, uploadUrl } = presigned[i];
          const controller = new AbortController();
          controllersRef.current.push(controller);
          await putToS3(uploadUrl, a.uri, a.contentType, controller.signal);
          done += 1;
          setProgress(done / current.length);
          setAttachments((prev) =>
            prev.map((p) => (p.id === a.id ? { ...p, status: 'uploaded', key } : p))
          );
          return { key, contentType: a.contentType, kind: a.kind } as AttachmentRef;
        })
      );

      if (cancelledRef.current) throw new Error(UPLOAD_CANCELLED);

      const refs: AttachmentRef[] = [];
      let failed = 0;
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') {
          refs.push(r.value);
        } else {
          failed += 1;
          setAttachments((prev) =>
            prev.map((p) =>
              p.id === current[i].id ? { ...p, status: 'error', error: 'Upload failed' } : p
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

      return refs;
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
    hasAttachments: attachments.length > 0,
    addImages,
    addVideo,
    remove,
    clear,
    cancel,
    upload,
    isUploading,
    progress,
  };
}
