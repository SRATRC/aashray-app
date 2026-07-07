# Phase 3 (Domain 1) — Support / Ticketing Feature Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Migrate the support/ticketing feature into a self-contained `src/features/support/` (list + create + SSE chat screens, feature components/hooks, React Query `api.ts` over the shared `apiClient`, backend-accurate `types.ts`, barrel), reduce the Expo Router `app/support/*` files to thin re-exports, and give tickets real types (they are `any` today) — with ZERO user-visible behavior change. Follows the WiFi template established in Phase 2.

**Architecture:** `src/app/support/{index,create,[id]}.tsx` become thin re-exports of feature screens (via the `@/features/support` barrel); `_layout.tsx` stays as routing config. All ticket REST goes through typed hooks in `features/support/api.ts` (on `@/lib/api/client`). The SSE hook (`useTicketStream`) and the optimistic send-message logic move **intact** — their reconciliation contract is preserved exactly. `resolveBaseUrl` moves to `@/lib/api/` (shared infra). Media components stay feature-owned.

**Tech Stack:** React Native 0.79 / Expo SDK 56, Expo Router 6, TypeScript, NativeWind, TanStack React Query v5, `react-native-sse`, `expo-image-manipulator`/`expo-video`/`expo-file-system`, axios via `apiClient`.

## Global Constraints

- No user-visible behavior change — list, create, and the live SSE chat must behave identically.
- **Lint gate:** `npm run lint` at **0 problems** (0 errors AND 0 warnings) at the end of every task. Run `npx eslint "src/**/*.{js,jsx,ts,tsx}"` and confirm no output; run `npm run format` on new/changed files if import/order or prettier complain.
- **Typecheck gate:** `npx tsc --noEmit --pretty false 2>&1 | grep -c "error TS"` MUST NOT exceed baseline **84** (always `--pretty false`). Prefer to reduce it by typing tickets; never increase.
- **Bundle gate (screen tasks + final):** `npx expo export --platform android --output-dir /tmp/p3-export` exits 0; then `rm -rf /tmp/p3-export`.
- Data access: support code calls `features/support/api.ts` hooks or `apiClient` — never `axios` or `handleAPICall` directly. (SSE via `react-native-sse` and the direct S3 PUT are the two intentional non-`apiClient` network paths — preserve them.)
- Route files import feature screens through the `@/features/support` BARREL, never a deep `@/features/support/screens/...` path (the ESLint `no-restricted-imports` rule blocks `@/features/*/*`).
- No `export *` barrels — explicit named re-exports only.
- **Move-intact rule:** `useTicketStream` (SSE reconnect/watchdog) and the optimistic send-message `onMutate/onError/onSettled` logic + temp-message shape are moved verbatim. Do NOT rewrite their logic. The temp-message shape (`id: 'temp-'+Date.now()`, `_key`, `isTemp`, `_localMedia`) is an implicit contract matched by `useTicketStream`'s reconciliation — keep it byte-identical.
- Commit after every task with a conventional-commit message.

## Verified backend contract (branch `origin/feat/support-ticketing`; base `/api/v1/tickets`, all behind `validateCard`)

| Call | Method + endpoint | Request | Response |
|---|---|---|---|
| list | `GET /tickets` | query `{ cardno, page, page_size? }` | `{ message, data: Ticket[] }` (createdAt DESC) |
| create | `POST /tickets` | body `{ cardno, service, description?, os?, app_version?, metadata?, attachments?: AttachmentRef[] }` | `201 { message, data: Ticket }` |
| details | `GET /tickets/:id` | query `{ cardno }` | `{ message, data: Ticket & { attachments: ServedAttachment[]; messages: (TicketMessage & { attachments: ServedAttachment[] })[] } }` |
| send msg | `POST /tickets/:id/messages` | body `{ cardno, sender_type:'user', message?, attachments?: AttachmentRef[] }` | `201 { message, data: TicketMessage }` |
| resolve | `PATCH /tickets/:id/resolve` | body `{ cardno }` | `200 { message }` (status→`closed`) |
| presign | `POST /tickets/attachments/presign` | body `{ cardno, files: PresignFileInput[] }` | `200 { message, data: PresignResult[] }` (order-matched) |
| serve | `GET /tickets/:id/attachments/:attachmentId?cardno=` | — | 302→S3 (loaded directly by `<Image>`/video) |
| stream | `GET /tickets/:id/stream?cardno=` | — | SSE (see below) |

- `Ticket.id`: STRING (8-char uppercase hex). `status ∈ 'open' | 'in progress' | 'resolved' | 'closed'`. `os ∈ 'Android' | 'iOS' | 'Web' | 'Other'`. `TicketMessage.id`: INTEGER; `sender_type ∈ 'user' | 'admin'`. Attachment served DTO: `{ id, kind: 'image'|'video', contentType, url, expired: boolean }`.
- **SSE frames** (`react-native-sse`): `{type:'connected'}`, `{type:'ping'}` (heartbeat ~25s), `{type:'status_update', status, updatedBy}`, or a bare `TicketMessage` row + `hasAttachments: boolean`. Client watchdog reconnects after 40s idle; reconnect after `error` (3s); `pollingInterval:0`.
- **Rules:** description optional iff ≥1 attachment; reply to `closed` → 400; reply to `resolved` → auto `in progress`; `MAX_VIDEOS_PER_TICKET=2` (across all non-expired), `MAX_IMAGES_PER_BATCH=5`, image ≤5MB, video ≤50MB/≤60s.
- **Departments** (exact order, label == value): Electrical, Housekeeping, Maintenance, Raj Prasad, Raj Adhyayan, Raj Sharan, Raj Pravas, Raj Utsav, WiFi, Payment/Accounts, IT, Others.

---

## Target structure

```
src/features/support/
  screens/TicketListScreen.tsx      (from app/support/index.tsx)
  screens/CreateTicketScreen.tsx    (from app/support/create.tsx)
  screens/TicketDetailScreen.tsx    (from app/support/[id].tsx — god file)
  components/                        (MediaViewer, AttachmentPreviewStrip, TicketMessageAttachments,
                                      + extracted TicketDetail sections)
  hooks/                             (useTicketStream, useTicketAttachments)
  api.ts                             (React Query hooks over apiClient)
  attachments.ts                     (from utils/ticketAttachments.ts — presign via apiClient)
  diagnostics.ts                     (from utils/collectDiagnostics.ts)
  status.ts                          (from utils/ticketStatus.ts — getStatusColor)
  types.ts                           (Ticket, TicketMessage, attachments, SSE frames, departments)
  index.ts                           (barrel: named re-exports of the 3 screens)
src/lib/api/resolveBaseUrl.ts        (moved from utils/resolveBaseUrl.ts)
```
`useRefetchOnFocus` stays at `src/hooks/useRefetchOnFocus.ts` (shared/generic — not moved).

---

## Task 1: Move `resolveBaseUrl` into `lib/api/` (shared infra)

**Files:** create `src/lib/api/resolveBaseUrl.ts` (move); delete `src/utils/resolveBaseUrl.ts`; update importers: `src/lib/api/client.ts`, `src/hooks/useTicketStream.ts`, `src/utils/ticketAttachments.ts`, `src/utils/collectDiagnostics.ts`.

**Interfaces:** Produces `resolveApiBaseUrl(): string | undefined` at `@/lib/api/resolveBaseUrl`.

- [ ] **Step 1:** `git mv src/utils/resolveBaseUrl.ts src/lib/api/resolveBaseUrl.ts` (keep contents identical; it imports `@/constants` + `@/stores` — those paths still resolve).
- [ ] **Step 2:** Update the 4 importers' paths to `@/lib/api/resolveBaseUrl`. (`grep -rn "utils/resolveBaseUrl" src` → fix each; must end at 0.)
- [ ] **Step 3:** Verify `grep -rn "utils/resolveBaseUrl" src` → 0; `npm run lint` → 0; typecheck ≤ 84.
- [ ] **Step 4:** Commit `refactor(lib): move resolveBaseUrl into lib/api (shared infra)`.

---

## Task 2: `features/support/types.ts` (backend-accurate) + move attachment types

**Files:** create `src/features/support/types.ts`.

**Interfaces (produced — consumed by every later task):**

- [ ] **Step 1:** Create `src/features/support/types.ts`. Move the attachment types currently in `src/utils/ticketAttachments.ts` (`AttachmentKind`, `PendingStatus`, `PendingAttachment`, `AttachmentRef`, `ServedAttachment`, `PresignFileInput`, `PresignResult`) here VERBATIM (read that file for exact definitions), and add the missing ticket types:

```ts
// src/features/support/types.ts
// ---- Attachment types (moved verbatim from utils/ticketAttachments.ts) ----
export type AttachmentKind = 'image' | 'video';
// ... (copy PendingStatus, PendingAttachment, AttachmentRef, ServedAttachment,
//      PresignFileInput, PresignResult EXACTLY as defined in the current
//      utils/ticketAttachments.ts — do not alter fields)

// ---- Ticket domain (new; derived from backend models) ----
export type TicketStatus = 'open' | 'in progress' | 'resolved' | 'closed';
export type TicketOs = 'Android' | 'iOS' | 'Web' | 'Other';
export type SenderType = 'user' | 'admin';

export interface TicketListItem {
  id: string;
  service: string;
  description: string | null;
  status: TicketStatus;
  createdAt: string;
}

export interface TicketMessage {
  id: number;
  ticket_id: string;
  sender_id?: string;
  sender_type: SenderType;
  message: string | null;
  createdAt: string;
  attachments?: ServedAttachment[];
}

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

export const TICKET_DEPARTMENTS = [
  'Electrical', 'Housekeeping', 'Maintenance', 'Raj Prasad', 'Raj Adhyayan',
  'Raj Sharan', 'Raj Pravas', 'Raj Utsav', 'WiFi', 'Payment/Accounts', 'IT', 'Others',
] as const;
```

(If the actual field names/optionality in `getTicketDetails`/`TicketMessage` differ from the above once you read the current `[id].tsx` usage, adjust to match what the screen READS — never break a field the UI accesses.)

- [ ] **Step 2:** Verify lint 0; typecheck ≤ 84. Commit `feat(support): backend-accurate ticket + attachment types`.

---

## Task 3: Move the attachment layer into the feature (`attachments.ts` + `useTicketAttachments`)

**Files:** create `src/features/support/attachments.ts` (from `src/utils/ticketAttachments.ts`); create `src/features/support/hooks/useTicketAttachments.ts` (from `src/hooks/useTicketAttachments.ts`); delete both originals; update importers.

- [ ] **Step 1:** Move `utils/ticketAttachments.ts` → `features/support/attachments.ts`. Change it to import the attachment TYPES from `./types` (Task 2) instead of defining them; keep all consts + functions. Update `requestPresign` to call `apiClient.post<{message?:string;data:PresignResult[]}>('/tickets/attachments/presign', { cardno, files }, { allowToast: false })` (it currently uses `handleAPICall`); return `res.data`. Keep `buildAttachmentUri` importing `resolveApiBaseUrl` from `@/lib/api/resolveBaseUrl`. Keep `putToS3`/`runUpload`/`ExpoFile` direct-PUT logic UNCHANGED.
- [ ] **Step 2:** Move `hooks/useTicketAttachments.ts` → `features/support/hooks/useTicketAttachments.ts`; update its import of `ticketAttachments`/types to `../attachments` / `../types`. No logic change; keep the full returned API (`addMedia, remove, clear, cancel, upload, isUploading, progress, canAddMedia, ...`).
- [ ] **Step 3:** Delete `src/utils/ticketAttachments.ts` and `src/hooks/useTicketAttachments.ts`. Update remaining importers (create/[id] screens + the 3 components) to the new paths — but since those files move in later tasks, update only files that are NOT being moved (none here besides the components, handled in Task 5). Use `grep -rn "utils/ticketAttachments\|hooks/useTicketAttachments" src` and fix any that won't be moved later; the screens/components get corrected when they move.
- [ ] **Step 4:** Lint 0; typecheck ≤ 84. Commit `refactor(support): move attachment layer into feature; presign via apiClient`.

---

## Task 4: Move `status.ts` + `diagnostics.ts` into the feature; `api.ts` hooks

**Files:** create `src/features/support/status.ts` (from `utils/ticketStatus.ts`), `src/features/support/diagnostics.ts` (from `utils/collectDiagnostics.ts`), `src/features/support/api.ts`; delete the two originals.

- [ ] **Step 1:** Move `utils/ticketStatus.ts` → `features/support/status.ts` (keep `getStatusColor`; it reads `@/constants` `status` — path unchanged). Move `utils/collectDiagnostics.ts` → `features/support/diagnostics.ts` (update its `resolveBaseUrl` import to `@/lib/api/resolveBaseUrl`). Delete originals. Fix importers via grep.
- [ ] **Step 2:** Create `src/features/support/api.ts` with query-key factory + hooks over `apiClient` (types from `./types`):

```ts
// src/features/support/api.ts
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { AttachmentRef, TicketDetail, TicketListItem, TicketMessage } from './types';

interface Envelope<T> { message?: string; data: T; }

export const ticketKeys = {
  list: (cardno: string) => ['tickets', cardno],
  detail: (id: string, cardno: string) => ['ticket', id, cardno],
};

export function useTicketList(cardno: string, pageSize = 10) {
  return useInfiniteQuery({
    queryKey: ticketKeys.list(cardno),
    queryFn: async ({ pageParam = 1 }) => {
      const res = await apiClient.get<Envelope<TicketListItem[]>>('/tickets', {
        params: { cardno, page: pageParam, page_size: pageSize },
      });
      return Array.isArray(res.data) ? res.data : [];
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) => (lastPage.length === pageSize ? pages.length + 1 : undefined),
    enabled: !!cardno,
  });
}

export function useTicketDetail(id: string, cardno: string) {
  return useQuery<TicketDetail>({
    queryKey: ticketKeys.detail(id, cardno),
    queryFn: async () => {
      const res = await apiClient.get<Envelope<TicketDetail>>(`/tickets/${id}`, { params: { cardno } });
      return res.data;
    },
    enabled: !!id && !!cardno,
    refetchOnMount: 'always',
  });
}

export function useCreateTicket(cardno: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      service: string; description?: string; os?: string; app_version?: string;
      metadata?: Record<string, unknown>; attachments?: AttachmentRef[];
    }) => apiClient.post('/tickets', { cardno, ...body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ticketKeys.list(cardno) }),
  });
}

// NOTE: send-message keeps its optimistic onMutate/onError/onSettled logic in the
// SCREEN (moved verbatim from [id].tsx) because that logic is coupled to the SSE
// reconciliation contract. This hook exposes only the raw mutationFn shape; the
// screen supplies the optimistic callbacks unchanged. See Task 8.
export function sendTicketMessage(
  id: string,
  cardno: string,
  body: { message?: string; attachments?: AttachmentRef[] }
) {
  return apiClient.post<Envelope<TicketMessage>>(`/tickets/${id}/messages`, {
    cardno, sender_type: 'user', ...body,
  }, { allowToast: false });
}

export function resolveTicket(id: string, cardno: string) {
  return apiClient.patch(`/tickets/${id}/resolve`, { cardno }, { allowToast: false });
}
```

- [ ] **Step 3:** Lint 0; typecheck ≤ 84. Commit `feat(support): react-query api (list/detail/create) + status/diagnostics moved`.

---

## Task 5: Move the 3 components into the feature

**Files:** create `src/features/support/components/{MediaViewer,AttachmentPreviewStrip,TicketMessageAttachments}.tsx` (from `src/components/`); delete originals; update their type imports to `@/features/support/types` and helper imports to `@/features/support/attachments`.

- [ ] **Step 1:** Move each component; retype props against `@/features/support/types` (`PendingAttachment`, `ServedAttachment`, `AttachmentKind`, `MediaViewerItem`). No rendering/logic change. Keep `MediaViewerItem` exported from `MediaViewer.tsx` (or move it to `types.ts` and import). Fix relative imports.
- [ ] **Step 2:** Delete the three `src/components/*` originals. `grep -rn "components/MediaViewer\|components/AttachmentPreviewStrip\|components/TicketMessageAttachments" src` → only feature paths remain.
- [ ] **Step 3:** Lint 0 (run `npm run format` on new files); typecheck ≤ 84. Commit `refactor(support): move media components into feature`.

---

## Task 6: Move `useTicketStream` into the feature (INTACT)

**Files:** create `src/features/support/hooks/useTicketStream.ts` (from `src/hooks/useTicketStream.ts`); delete original.

- [ ] **Step 1:** Move verbatim. Only change import paths: `resolveApiBaseUrl` from `@/lib/api/resolveBaseUrl`; types from `../types` if it references any. Do NOT touch the reconnect/watchdog/`pollingInterval:0`/dependency-array logic. Keep `resolveApiBaseUrl()` called fresh at connect time (not hoisted/memoized).
- [ ] **Step 2:** Delete original; fix the one importer path when `[id].tsx` migrates (Task 8). Lint 0; typecheck ≤ 84. Commit `refactor(support): move useTicketStream into feature (intact)`.

---

## Task 7: Migrate the list + create screens

**Files:** create `src/features/support/screens/TicketListScreen.tsx` (from `app/support/index.tsx`) and `CreateTicketScreen.tsx` (from `app/support/create.tsx`); thin the two route files (via barrel — see Task 9).

- [ ] **Step 1:** Move `app/support/index.tsx` body → `TicketListScreen` (default export). Replace its inline `useInfiniteQuery`/`handleAPICall` list fetch with `useTicketList(cardno)` from `../api`; type `renderItem`'s item as `TicketListItem`; import `getStatusColor` from `../status`, `useRefetchOnFocus` from `@/hooks/useRefetchOnFocus`. Preserve the client-side `createdAt` sort, infinite-scroll, and navigation (`/support/${id}`, `/support/create`) exactly.
- [ ] **Step 2:** Move `app/support/create.tsx` body → `CreateTicketScreen`. Replace inline `POST /tickets` (`handleAPICall`) with `useCreateTicket(cardno)`; use `useTicketAttachments` from `../hooks/useTicketAttachments`, `AttachmentPreviewStrip` from `../components`, `collectDiagnostics` from `../diagnostics`, departments from `TICKET_DEPARTMENTS` in `../types` (replace the local `SERVICE_LIST` with it — same values/order). Preserve: description-optional-iff-attachment, os/app_version/metadata assembly, upload-before-submit ordering, navigation-back on success.
- [ ] **Step 3:** Lint 0; typecheck ≤ 84. Commit `refactor(support): migrate list + create screens to feature hooks`.

---

## Task 8: Migrate the `[id]` SSE chat screen (god file) — highest risk

**Files:** create `src/features/support/screens/TicketDetailScreen.tsx` (from `app/support/[id].tsx`); extract presentational sections into `src/features/support/components/`.

**Move-intact contract:** the optimistic `sendMessageMutation` (`onMutate` temp-message insert with `id:'temp-'+Date.now()`, `_key`, `isTemp`, `_localMedia`; `onError` rollback; `onSuccess` clears staged attachments; `onSettled` invalidate) and the `useTicketStream` usage move VERBATIM. The mutation's `mutationFn` calls `sendTicketMessage(id, cardno, {...})` from `../api`; everything else in the mutation stays identical. `resolveTicketMutation` calls `resolveTicket(...)`.

- [ ] **Step 1:** Move `app/support/[id].tsx` → `TicketDetailScreen.tsx` (default export). Swap data access: `useTicketDetail(id, cardno)` from `../api` (replaces the inline `useQuery`+`handleAPICall`); keep the two mutations in the screen but point their `mutationFn` at `sendTicketMessage`/`resolveTicket`; keep `useTicketStream` (`../hooks/useTicketStream`), `useTicketAttachments` (`../hooks/useTicketAttachments`), `useRefetchOnFocus` (`@/hooks/useRefetchOnFocus`). Type `ticket` as `TicketDetail`. Keep `LocalMediaStrip`, `renderItem`, scroll effect, `existingVideoCount` memo, all handlers UNCHANGED in behavior.
- [ ] **Step 2 (safe presentational extraction only):** extract these into `../components/` as pure presentational components receiving props (no data/SSE logic): `TicketStatusHeader` (id + copy button + status pill + close button), `TicketResolvedBanner`, `TicketComposer` (attach button + TextInput + send button + `AttachmentPreviewStrip` + closed-state fallback). The message-list `renderItem`/`LocalMediaStrip` and ALL data/SSE/mutation/optimistic logic STAY in `TicketDetailScreen`. Do not extract anything that touches the mutation, stream, or optimistic state.
- [ ] **Step 3:** Delete `src/hooks/useTicketStream.ts` importer staleness — confirm `[id]` now imports from `../hooks/useTicketStream`.
- [ ] **Step 4:** Lint 0; typecheck ≤ 84; **bundle gate** (`expo export` exit 0). Commit `refactor(support): migrate SSE chat screen; extract presentational sections`.

---

## Task 9: Barrel + thin routes + cleanup + final gates

**Files:** create `src/features/support/index.ts`; thin `app/support/{index,create,[id]}.tsx`.

- [ ] **Step 1:** Create `src/features/support/index.ts` with explicit named re-exports:
```ts
export { default as TicketListScreen } from './screens/TicketListScreen';
export { default as CreateTicketScreen } from './screens/CreateTicketScreen';
export { default as TicketDetailScreen } from './screens/TicketDetailScreen';
```
- [ ] **Step 2:** Thin each route file (keep `_layout.tsx` as-is):
  - `app/support/index.tsx`: `import { TicketListScreen } from '@/features/support'; export default TicketListScreen;`
  - `app/support/create.tsx`: `import { CreateTicketScreen } from '@/features/support'; export default CreateTicketScreen;`
  - `app/support/[id].tsx`: `import { TicketDetailScreen } from '@/features/support'; export default TicketDetailScreen;`
- [ ] **Step 3:** Verify no stale imports: `grep -rn "utils/ticketAttachments\|utils/ticketStatus\|utils/collectDiagnostics\|hooks/useTicketStream\|hooks/useTicketAttachments\|@/components/MediaViewer\|@/components/AttachmentPreviewStrip\|@/components/TicketMessageAttachments" src` → 0. Support screens/hooks contain no `handleAPICall` (`grep -rn "HandleApiCall\|handleAPICall" src/features/support` → 0).
- [ ] **Step 4:** Final gates: lint 0; typecheck ≤ 84; `expo export --platform android` exit 0 (delete output).
- [ ] **Step 5:** Commit `refactor(support): barrel + thin route re-exports; feature self-contained`.

---

## Out of scope (flag, do not do here)
- **Legacy `src/app/(home)/support.tsx`** (old single-form, hits the removed `POST /support`) — dead/broken, but deleting a route touches navigation; leave it and flag for a separate cleanup decision.
- Promoting `MediaViewer`/`AttachmentPreviewStrip` to `components/ui/` (needs type decoupling; only support consumes them — YAGNI now).
- `updateManager.tsx` still reading `BASE_URL` directly (unrelated legacy).

## Phase 3-support Completion Gate
- [ ] `npm run lint` 0 problems; typecheck ≤ 84 (ideally lower — tickets now typed); `expo export` exit 0.
- [ ] `app/support/{index,create,[id]}.tsx` are one-line re-exports via `@/features/support`; `_layout.tsx` unchanged.
- [ ] No support code imports `handleAPICall`/`axios`; SSE + S3-PUT preserved.
- [ ] Simulator smoke-test: open list, open a ticket (live messages arrive via SSE), send a message with an image (optimistic preview then reconciles, no flicker/dupe), create a ticket, resolve a ticket. Behavior unchanged.

## Self-Review (author checklist — completed)
- **Spec coverage:** feature-folder (screens/components/hooks/api/types) ✓; thin routes via barrel ✓; RQ hooks over apiClient ✓; backend-accurate types replacing `any` ✓; god-file breakup = safe presentational extraction with SSE/optimistic logic intact ✓; shared infra (resolveBaseUrl→lib, useRefetchOnFocus stays shared) ✓.
- **Risk containment:** move-intact rule for SSE + optimistic reconciliation; risky `[id]` last; bundle gate on screen tasks.
- **Type consistency:** `ticketKeys`/hook names (`useTicketList`, `useTicketDetail`, `useCreateTicket`, `sendTicketMessage`, `resolveTicket`) consistent across api.ts (Task 4) and screens (Tasks 7–8); attachment types single-sourced in `types.ts` (Task 2) and consumed by attachments.ts/components/hooks.
- **Placeholder scan:** api.ts + types.ts are complete; moves reference exact current files to read; no TBDs.
