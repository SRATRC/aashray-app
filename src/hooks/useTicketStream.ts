import { useEffect } from 'react';
import { AppState } from 'react-native';
import EventSource, { EventSourceListener } from 'react-native-sse';
import type { QueryClient } from '@tanstack/react-query';
import { resolveApiBaseUrl } from '@/src/utils/resolveBaseUrl';

const SSE_WATCHDOG_TIMEOUT_MS = 40000;
const SSE_WATCHDOG_CHECK_INTERVAL_MS = 10000;
// Reconnect delay doubles per failed attempt (3s, 6s, 12s, 24s, then 30s),
// with jitter so many clients don't all reconnect in the same instant after
// a backend restart. Reset to the base on every successful open.
const SSE_RETRY_BASE_MS = 3000;
const SSE_RETRY_MAX_MS = 30000;

interface UseTicketStreamOptions {
  ticketId: string | undefined;
  cardno: string | undefined;
  queryClient: QueryClient;
  refetch: () => void;
  // false = don't hold a stream open (ticket failed to load, or is closed and
  // can never change again).
  enabled?: boolean;
}

// A 4xx means the stream will never succeed for this ticket/card (404 =
// ticket gone or not this member's). Retrying it every few seconds forever
// only loads the server. 408/429 are the retryable exceptions.
const isPermanentFailure = (status: unknown) =>
  typeof status === 'number' && status >= 400 && status < 500 && status !== 408 && status !== 429;

/**
 * Connects to a ticket's live SSE stream and keeps the
 * ['ticket', ticketId, cardno] react-query cache in sync with incoming
 * messages and status_update frames.
 *
 * Manages reconnection manually since pollingInterval:0 disables
 * react-native-sse's own auto-reconnect: on an 'error' event we tear down
 * and retry after a short delay, and a watchdog force-reconnects if no
 * activity (not even the backend's ~25s {type:'ping'} heartbeat) arrives for
 * SSE_WATCHDOG_TIMEOUT_MS — a graceful close produces no 'error' event at
 * all in this library, so the watchdog is the only way to detect that.
 *
 * While the app is in the background the stream is closed (no radio wake-ups
 * every 25s for a screen nobody sees); on return to the foreground it
 * reconnects at once, and that reconnect's 'open' refetches to backfill.
 */
export function useTicketStream({
  ticketId,
  cardno,
  queryClient,
  refetch,
  enabled = true,
}: UseTicketStreamOptions) {
  useEffect(() => {
    if (!enabled || !ticketId || !cardno) return;

    let es: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let watchdogInterval: ReturnType<typeof setInterval> | null = null;
    let isCleanedUp = false;
    let isStopped = false; // permanent 4xx: give up until remount
    let isPaused = AppState.currentState === 'background';
    let hasConnected = false;
    let retryAttempt = 0;
    let lastActivityAt = Date.now();

    const closeStream = () => {
      if (es) {
        es.removeAllEventListeners();
        es.close();
        es = null;
      }
    };

    const listener: EventSourceListener = (event) => {
      if (event.type === 'open') {
        if (__DEV__) console.log('[SSE] Connection opened');
        lastActivityAt = Date.now();
        retryAttempt = 0;
        // A second (or later) open means we reconnected after a drop — pull
        // the latest state to backfill anything missed while disconnected.
        if (hasConnected) refetch();
        hasConnected = true;
      } else if (event.type === 'message') {
        if (event.data) {
          try {
            const data = JSON.parse(event.data);
            if (__DEV__) console.log('[SSE] Message received:', data);
            lastActivityAt = Date.now();

            if (data.type === 'status_update') {
              // A status change isn't always paired with a new message (e.g.
              // an admin picking a status from the dropdown) — without this,
              // the status badge/banner/input state here would only update
              // after a manual reload.
              queryClient.setQueryData(['ticket', ticketId, cardno], (old: any) =>
                old ? { ...old, status: data.status, updatedBy: data.updatedBy } : old
              );
            } else if (data.type !== 'connected' && data.type !== 'ping') {
              queryClient.setQueryData(['ticket', ticketId, cardno], (old: any) => {
                if (!old) return old;

                const existingMessages = old.messages || [];

                // Single pass: bail out if we already have this message, and
                // otherwise look for a matching optimistic temp placeholder
                // to reconcile, at the same time.
                //
                // FIFO assumption: identical-text messages sent by the same
                // client are broadcast by SSE in the same order they were
                // sent (sequential POSTs, handled and broadcast in order by
                // the backend), so matching the first unmatched temp entry
                // with the same text is safe even for repeated identical text.
                let tempIndex = -1;
                for (let i = 0; i < existingMessages.length; i++) {
                  const m = existingMessages[i];
                  if (m.id === data.id) return old;
                  if (
                    tempIndex === -1 &&
                    m.isTemp &&
                    m.message === data.message &&
                    m.sender_type === data.sender_type
                  ) {
                    tempIndex = i;
                  }
                }

                const newMessages = [...existingMessages];
                if (tempIndex !== -1) {
                  const prevTemp = newMessages[tempIndex];
                  // Preserve the original stable _key so FlashList treats this
                  // as an update to the existing cell instead of a remove+add
                  // (which caused a visible flicker right as a message confirms).
                  //
                  // The SSE frame is the bare TicketMessage row and carries no
                  // `attachments`; keep the optimistic `_localMedia` on the
                  // confirmed message so just-sent media stays visible until the
                  // onSettled refetch backfills the real served attachments (the
                  // renderer prefers server attachments once they arrive).
                  newMessages[tempIndex] = {
                    ...data,
                    _key: prevTemp._key,
                    ...(!data.attachments?.length && prevTemp._localMedia
                      ? { _localMedia: prevTemp._localMedia }
                      : {}),
                  };
                } else {
                  newMessages.push({ ...data, _key: String(data.id) });
                }

                return {
                  ...old,
                  messages: newMessages,
                };
              });

              // The SSE frame flags whether the message has attachments but
              // can't carry them (the serve URL is audience-specific) — so when
              // it does, refetch to backfill the served attachments (with this
              // client's URLs) instead of leaving the bubble image-less until a
              // manual reopen. Text-only messages skip the refetch.
              if (data.hasAttachments) refetch();

              // No scroll-to-end here: the caller's own effect watching
              // `messages.length` already handles that for every case that
              // actually adds a message (this cache update always changes
              // that length, since only the "existing message" early-return
              // above can leave it unchanged).
            }
          } catch (err) {
            if (__DEV__) console.error('[SSE] Failed to parse message:', err);
          }
        }
      } else if (event.type === 'error') {
        const xhrStatus = (event as any).xhrStatus;
        if (isPermanentFailure(xhrStatus)) {
          if (__DEV__) console.warn(`[SSE] Stream refused (HTTP ${xhrStatus}), not retrying`);
          isStopped = true;
          closeStream();
          return;
        }
        if (__DEV__)
          console.warn('[SSE] Connection error:', (event as any).message || 'Unknown error');
        scheduleReconnect();
      }
    };

    const connect = () => {
      if (isCleanedUp || isStopped || isPaused) return;
      lastActivityAt = Date.now();

      // Resolved fresh on every (re)connect attempt, not once outside this
      // effect, so a mid-session dev-backend toggle doesn't leave the stream
      // stuck talking to a stale URL while REST calls move to the new one.
      const baseUrl = resolveApiBaseUrl();
      if (!baseUrl) {
        if (__DEV__) console.warn('Base URL is missing, cannot connect to SSE.');
        return;
      }

      const url = `${baseUrl}/tickets/${ticketId}/stream?cardno=${cardno}`;
      es = new EventSource(url, { pollingInterval: 0 });
      es.addEventListener('open', listener);
      es.addEventListener('message', listener);
      es.addEventListener('error', listener);
    };

    const scheduleReconnect = () => {
      if (isCleanedUp || isStopped || isPaused || reconnectTimer) return;
      closeStream();
      const ceiling = Math.min(SSE_RETRY_MAX_MS, SSE_RETRY_BASE_MS * 2 ** retryAttempt);
      const delay = ceiling / 2 + Math.random() * (ceiling / 2);
      retryAttempt += 1;
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        connect();
      }, delay);
    };

    connect();

    watchdogInterval = setInterval(() => {
      if (isStopped || isPaused) return;
      if (Date.now() - lastActivityAt > SSE_WATCHDOG_TIMEOUT_MS) {
        if (__DEV__) console.warn('[SSE] Watchdog: no activity, forcing reconnect');
        scheduleReconnect();
      }
    }, SSE_WATCHDOG_CHECK_INTERVAL_MS);

    const appStateSub = AppState.addEventListener('change', (next) => {
      if (next === 'background') {
        if (isPaused) return;
        isPaused = true;
        if (reconnectTimer) clearTimeout(reconnectTimer);
        reconnectTimer = null;
        closeStream();
      } else if (next === 'active' && isPaused) {
        isPaused = false;
        retryAttempt = 0;
        connect();
      }
    });

    return () => {
      if (__DEV__) console.log('[SSE] Closing connection');
      isCleanedUp = true;
      appStateSub.remove();
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (watchdogInterval) clearInterval(watchdogInterval);
      closeStream();
    };
  }, [enabled, ticketId, cardno, queryClient, refetch]);
}
