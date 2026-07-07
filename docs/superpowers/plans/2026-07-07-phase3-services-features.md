# Phase 3 (Domain 2) — Services Features (contact, menu, maintenance) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development / executing-plans. Steps use `- [ ]`.

**Goal:** Migrate the three "services" home screens into self-contained features — `src/features/contact/`, `src/features/menu/`, `src/features/maintenance/` — following the WiFi/support template (feature = screens + api.ts RQ hooks over `apiClient` + types.ts + barrel; route files become thin re-exports). Give them real types (heavy `any` in maintenance today). ZERO user-visible behavior change.

**Architecture:** Three independent features (they share no code). `contact` is fully static (no `api.ts`). `menu` is one read-only query. `maintenance` is a god-file split into a list screen + an extracted create component, with an `api.ts` (infinite list query + create mutation). Route files under `src/app/(home)/` become one-line re-exports through each feature's barrel; `_layout.tsx` unchanged.

**Tech Stack:** RN 0.79 / Expo SDK 56, Expo Router 6, TS, NativeWind, TanStack React Query v5, `apiClient`.

## Global Constraints
- No user-visible behavior change.
- **Lint gate:** `npm run lint` at 0 problems (0 errors AND 0 warnings) each task (`npx eslint "src/**/*.{js,jsx,ts,tsx}"` prints nothing; `npm run format` new files if needed).
- **Typecheck gate:** `npx tsc --noEmit --pretty false 2>&1 | grep -c "error TS"` MUST stay ≤ 84 (`--pretty false`). Prefer to reduce; never increase.
- **Bundle gate (maintenance task + final):** `npx expo export --platform android --output-dir /tmp/p3s-export` exits 0; then delete.
- Screens call `features/<x>/api.ts` hooks or `apiClient` — never `axios`/`handleAPICall`.
- Route files import screens via the `@/features/<x>` BARREL, never deep `@/features/*/*` (ESLint rule).
- No `export *` barrels.
- Commit after each task.

## Verified backend contract (`/api/v1`, behind `validateCard`)
| Call | Method+endpoint | Request | Response |
|---|---|---|---|
| maint list | `GET /maintenance` | query `{ cardno, page, status }` (status ∈ `All\|Open\|Closed`, server lowercases; no `page_size` sent → server default 10) | `{ message, data: MaintenanceRequest[] }` (createdAt DESC) |
| maint create | `POST /maintenance/request` | body `{ cardno, department, work_detail, area_of_work }` (cardno from auth; body cardno harmless) | `201 { message }` (no data) |
| menu | `GET /food/menu` | query `{ cardno }` (ignored server-side) | `{ data: MenuData \| null }` |
| contact | — | none (fully static frontend data) | — |

- `MaintenanceRequest` fields: `bookingid` (string PK), `requested_by`, `department`, `work_detail`, `area_of_work`, `comments`, `status: 'open' | 'closed' | 'inprogress'`, `finished_at`, `createdAt`. (No `updatedAt`/`updatedBy` in the client response.)
- `MenuData = { [date: string]: { meal: string; name: string; time: string }[] }`; backend returns `null` (not `{}`) when empty.
- Maintenance department list stays the **hardcoded** frontend `DEPARTMENT_LIST` (`Electrical`, `housekeeping`→"House Keeping", `Maintenance`) — do NOT switch to the backend `/maintenance/departments` endpoint (behavior change, out of scope). Move the const into the feature as-is.
- Filter chips come from `types.MAINTENANCE_TYPE_ALL/OPEN/CLOSED` (`'All'/'Open'/'Closed'`) in `@/constants`.

---

## Task 1: `contact` feature (static)

**Files:** create `src/features/contact/screens/ContactScreen.tsx`, `src/features/contact/data.ts`, `src/features/contact/index.ts`; modify `src/app/(home)/contactInfo.tsx` → thin re-export.

**Interfaces:** barrel exports `ContactScreen` (default of ContactScreen.tsx).

- [ ] **Step 1:** Read `src/app/(home)/contactInfo.tsx`. Move its body → `ContactScreen.tsx` (default export `ContactScreen`). Move the `ContactPerson`/`DepartmentContact` interfaces + the `departments` const array into `src/features/contact/data.ts` (export them); `ContactScreen` imports from `../data`. No rendering/logic change (tap-to-call, long-press-copy, StyleSheet all identical). Fix any `@/...` imports.
- [ ] **Step 2:** `src/features/contact/index.ts`: `export { default as ContactScreen } from './screens/ContactScreen';`
- [ ] **Step 3:** `src/app/(home)/contactInfo.tsx` → `import { ContactScreen } from '@/features/contact'; export default ContactScreen;`
- [ ] **Step 4:** Verify lint 0; typecheck ≤ 84. NOTE: `/contactInfo` is navigated to from 4 places (tabs index, utsav/[id], adhyayan/[id], paymentFailed) — the path is unchanged, so those keep working; do not touch them.
- [ ] **Step 5:** Commit `refactor(contact): migrate static contact screen into feature`.

---

## Task 2: `menu` feature (read-only query)

**Files:** create `src/features/menu/types.ts`, `src/features/menu/api.ts`, `src/features/menu/screens/MenuScreen.tsx`, `src/features/menu/index.ts`; modify `src/app/(home)/menu.tsx` → thin re-export.

**Interfaces:** `api.ts` exports `menuKeys`, `useMenu(cardno)`; barrel exports `MenuScreen`.

- [ ] **Step 1:** Create `src/features/menu/types.ts` — move the `Meal` and `MenuData` interfaces from the current `menu.tsx` VERBATIM:
```ts
export interface Meal { meal: string; name: string; time: string; }
export type MenuData = Record<string, Meal[]>;
```
(Confirm field names against the current file; match exactly.)

- [ ] **Step 2:** Create `src/features/menu/api.ts`:
```ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { MenuData } from './types';

export const menuKeys = { all: (cardno: string) => ['menu', cardno] };

export function useMenu(cardno: string) {
  return useQuery<MenuData | null>({
    queryKey: menuKeys.all(cardno),
    queryFn: async () => {
      const res = await apiClient.get<{ data: MenuData | null }>('/food/menu', {
        params: { cardno },
      });
      return res.data ?? null;
    },
    enabled: !!cardno,
    staleTime: 1000 * 60 * 60 * 24 * 3, // 3 days (matches original)
    retry: false,
  });
}
```
(Confirm the original `staleTime`/`retry`/`enabled` values and match them exactly.)

- [ ] **Step 3:** Move `menu.tsx` body → `MenuScreen.tsx` (default export `MenuScreen`). Replace inline `useQuery`+`handleAPICall` with `useMenu(cardno)`. Type the two helper functions' params (`formatDate(dateString: string)`, `getMealAccent(mealType: string)`). Keep the loading-shimmer / error+retry / empty (`!menuData || Object.keys(menuData).length === 0`) / render-by-date logic identical.
- [ ] **Step 4:** `src/features/menu/index.ts`: `export { default as MenuScreen } from './screens/MenuScreen';`
- [ ] **Step 5:** `src/app/(home)/menu.tsx` → `import { MenuScreen } from '@/features/menu'; export default MenuScreen;`
- [ ] **Step 6:** Verify `grep -rn "handleAPICall\|HandleApiCall" src/features/menu` → 0; lint 0; typecheck ≤ 84. Commit `refactor(menu): migrate food menu screen into feature (typed query)`.

---

## Task 3: `maintenance` types + api.ts

**Files:** create `src/features/maintenance/types.ts`, `src/features/maintenance/api.ts`.

**Interfaces:** `api.ts` exports `maintenanceKeys`, `useMaintenanceList(cardno, status)`, `useCreateMaintenanceRequest(cardno)`.

- [ ] **Step 1:** Create `src/features/maintenance/types.ts`:
```ts
export type MaintenanceStatus = 'open' | 'closed' | 'inprogress';

export interface MaintenanceRequest {
  bookingid: string;
  requested_by?: string;
  department: string;
  work_detail: string;
  area_of_work?: string;
  comments?: string | null;
  status: MaintenanceStatus;
  finished_at?: string | null;
  createdAt: string;
}

export interface MaintenanceForm {
  department: string;
  work_detail: string;
  area_of_work: string;
}

// Hardcoded department list moved verbatim from the original screen (do NOT
// switch to the backend /maintenance/departments endpoint — behavior change).
export const DEPARTMENT_LIST = [
  { label: 'Electrical', value: 'Electrical' },
  { label: 'House Keeping', value: 'housekeeping' },
  { label: 'Maintenance', value: 'Maintenance' },
];
```
IMPORTANT: read the current `maintenanceRequestList.tsx` and copy the EXACT `DEPARTMENT_LIST` shape/values (label/value mapping) — the draft above must match the real one; if it differs, use the real one.

- [ ] **Step 2:** Create `src/features/maintenance/api.ts`. Read the original screen's `useInfiniteQuery` config first and reproduce `getNextPageParam` EXACTLY (do not change its page-advance/stop semantics). Preserve the query-key shape (list key includes the chip; create invalidates the cardno-prefix key):
```ts
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { MaintenanceForm, MaintenanceRequest } from './types';

export const maintenanceKeys = {
  base: (cardno: string) => ['maintenance', cardno],
  list: (cardno: string, status: string) => ['maintenance', cardno, status],
};

export function useMaintenanceList(cardno: string, status: string) {
  return useInfiniteQuery({
    queryKey: maintenanceKeys.list(cardno, status),
    queryFn: async ({ pageParam = 1 }) => {
      const res = await apiClient.get<{ message?: string; data: MaintenanceRequest[] }>(
        '/maintenance',
        { params: { cardno, page: pageParam, status } }
      );
      return Array.isArray(res.data) ? res.data : [];
    },
    initialPageParam: 1,
    // REPLACE with the original screen's exact getNextPageParam logic:
    getNextPageParam: (lastPage, pages) =>
      !lastPage || lastPage.length === 0 ? undefined : pages.length + 1,
    enabled: !!cardno,
    staleTime: 1000 * 60 * 30,
  });
}

export function useCreateMaintenanceRequest(cardno: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (form: MaintenanceForm) =>
      apiClient.post('/maintenance/request', { cardno, ...form }),
    // Original invalidates the cardno-prefix key (prefix-matches all chip variants).
    onSuccess: () => qc.invalidateQueries({ queryKey: maintenanceKeys.base(cardno) }),
  });
}
```
(If the original `getNextPageParam` or `staleTime` differs from the above, use the original's values — match behavior exactly.)

- [ ] **Step 3:** Verify lint 0; typecheck ≤ 84. Commit `feat(maintenance): types + react-query api (list/create)`.

---

## Task 4: `maintenance` screens (split god file) + barrel + route + gates

**Files:** create `src/features/maintenance/screens/MaintenanceListScreen.tsx`, `src/features/maintenance/components/CreateMaintenanceModal.tsx`, `src/features/maintenance/index.ts`; modify `src/app/(home)/maintenanceRequestList.tsx` → thin re-export.

- [ ] **Step 1:** Read the current `maintenanceRequestList.tsx` fully. Create `MaintenanceListScreen.tsx` (default export) containing the LIST responsibility: chip filter (`selectedChip`), `useMaintenanceList(cardno, selectedChip)` from `../api`, refresh, `renderItem`/`renderHeader`/`renderFooter`, empty/loading states, and the "new request" trigger that opens the modal. Type `renderItem`'s item as `MaintenanceRequest`. Keep `CustomChipGroup`, `CustomTag`, `PageHeader`, etc. from `@/components/*`.
- [ ] **Step 2:** Extract the create-request modal into `components/CreateMaintenanceModal.tsx` — a component receiving `{ visible: boolean; onClose: () => void }` (and nothing else it can derive itself). It owns the `form` state (`MaintenanceForm`), the field validation (`CustomAlert.alert` on empty), and calls `useCreateMaintenanceRequest(cardno)`; on success it closes + the list auto-refreshes via invalidation. Preserve the exact fields (department select via `CustomSelectBottomSheet` using `DEPARTMENT_LIST`, `work_detail`, `area_of_work`), validation messages, and submit behavior. `MaintenanceListScreen` renders `<CreateMaintenanceModal visible={isModalVisible} onClose={...} />`.
- [ ] **Step 3:** `src/features/maintenance/index.ts`: `export { default as MaintenanceListScreen } from './screens/MaintenanceListScreen';`
- [ ] **Step 4:** `src/app/(home)/maintenanceRequestList.tsx` → `import { MaintenanceListScreen } from '@/features/maintenance'; export default MaintenanceListScreen;`
- [ ] **Step 5:** Verify: `grep -rn "handleAPICall\|HandleApiCall" src/features/maintenance` → 0; lint 0; typecheck ≤ 84; **bundle gate** exits 0.
- [ ] **Step 6:** Commit `refactor(maintenance): split list/create into feature; thin route`.

---

## Completion Gate
- [ ] lint 0; typecheck ≤ 84; `expo export` exit 0.
- [ ] `contactInfo.tsx`, `menu.tsx`, `maintenanceRequestList.tsx` are one-line re-exports via their feature barrels; `(home)/_layout.tsx` unchanged.
- [ ] No `handleAPICall`/`axios` in the 3 features.
- [ ] Smoke-test: contact (tap-to-call from tabs + utsav/adhyayan/paymentFailed paths), menu (loads/empty), maintenance (list, filter chips, create a request → appears).

## Out of scope (flag)
- Switching maintenance's hardcoded `DEPARTMENT_LIST` to the backend `/maintenance/departments` endpoint (behavior change; a future `useDepartments()` hook).

## Self-Review (author checklist — completed)
- **Spec coverage:** 3 features per template; thin barrel routes; RQ hooks over apiClient; backend-accurate types replacing `any`; maintenance god-file split (list screen + create modal). ✓
- **Type consistency:** `maintenanceKeys`/`useMaintenanceList`/`useCreateMaintenanceRequest`/`useMenu`/`menuKeys` names consistent between api.ts (Tasks 2,3) and screens (Tasks 2,4); `MaintenanceRequest`/`MaintenanceForm`/`MenuData` single-sourced in types.ts.
- **Parity risks:** maintenance `getNextPageParam` + query-key/invalidation prefix behavior preserved exactly (learned from the support useTicketList regression); menu staleTime/retry preserved; contact path unchanged for its 4 callers.
- **Placeholders:** api.ts/types complete; screen moves reference exact current files; DEPARTMENT_LIST + getNextPageParam explicitly instructed to match the original.
