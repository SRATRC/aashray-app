import { useEffect } from 'react';
import EventSource, { EventSourceListener } from 'react-native-sse';
import type { QueryClient } from '@tanstack/react-query';
import { resolveApiBaseUrl } from '@/src/utils/resolveBaseUrl';

const SSE_WATCHDOG_TIMEOUT_MS = 40000;
const SSE_WATCHDOG_CHECK_INTERVAL_MS = 10000;

interface UseTicketStreamOptions {
  ticketId: string | undefined;
  cardno: string | undefined;
  queryClient: QueryClient;
  refetch: () => void;
}

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
 */
export function useTicketStream({
  ticketId,
  cardno,
  queryClient,
  refetch,
}: UseTicketStreamOptions) {
  useEffect(() => {
    if (!ticketId || !cardno) return;

    let es: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let watchdogInterval: ReturnType<typeof setInterval> | null = null;
    let isCleanedUp = false;
    let hasConnected = false;
    let lastActivityAt = Date.now();

    const listener: EventSourceListener = (event) => {
      if (event.type === 'open') {
        if (__DEV__) console.log('[SSE] Connection opened');
        lastActivityAt = Date.now();
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
        if (__DEV__)
          console.error('[SSE] Connection Error:', (event as any).message || 'Unknown error');
        scheduleReconnect();
      }
    };

    const connect = () => {
      if (isCleanedUp) return;
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
      if (isCleanedUp || reconnectTimer) return;
      if (es) {
        es.removeAllEventListeners();
        es.close();
        es = null;
      }
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        connect();
      }, 3000);
    };

    connect();

    watchdogInterval = setInterval(() => {
      if (Date.now() - lastActivityAt > SSE_WATCHDOG_TIMEOUT_MS) {
        if (__DEV__) console.warn('[SSE] Watchdog: no activity, forcing reconnect');
        scheduleReconnect();
      }
    }, SSE_WATCHDOG_CHECK_INTERVAL_MS);

    return () => {
      if (__DEV__) console.log('[SSE] Closing connection');
      isCleanedUp = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (watchdogInterval) clearInterval(watchdogInterval);
      if (es) {
        es.removeAllEventListeners();
        es.close();
      }
    };
  }, [ticketId, cardno, queryClient, refetch]);
}
