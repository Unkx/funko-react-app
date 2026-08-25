# Data-fetch UX layer: Foundation + Collection/Wishlist/ItemList Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a shared caching/skeleton/optimistic-mutation/tooltip layer and migrate `ItemList`, `CollectionPage`, and `WishlistPage` onto it.

**Architecture:** `@tanstack/react-query` provides the cache (`useQuery`) and optimistic-mutation primitive (`useMutation` + manual cache writes). A thin `authFetch` helper centralizes the `Authorization` header + non-OK-throws boilerplate every component currently repeats. `Skeleton`/`Tooltip` are small presentational primitives with no data dependency.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS v4, Vitest + Testing Library, `@tanstack/react-query` (new), `@radix-ui/react-tooltip` (new).

**Spec:** `docs/superpowers/specs/2026-08-25-data-fetch-ux-layer-design.md`

## Global Constraints

- No backend changes — client-side only.
- Skeletons match existing layout dimensions; tooltips use existing Tailwind color tokens (this plan uses the same slate/amber/green tokens already used across `ItemList`/`CollectionPage`/`WishlistPage`).
- `Maps/ResponsiveWorldMap.tsx` (`react-tooltip`) and `AnalysticsDashboard.tsx` (`recharts` `<Tooltip>`) are out of scope — do not touch.
- `FunkoDetails.tsx` is out of scope for this plan (its axios interceptor, price-scraping, and AI-description flows need their own plan) — do not touch it here.
- Every fetch site converts from `useState`+`useEffect`+`fetch` to `useQuery`/`useMutation` — no component keeps hand-rolled `loading`/`error` state after migration.
- Auto-logout-on-inactivity `useEffect` blocks in each page are untouched.

---

### Task 1: Install dependencies, add query client, wire into app root

**Files:**
- Modify: `package.json` (add `@tanstack/react-query`, `@radix-ui/react-tooltip`)
- Create: `src/ui/queryClient.ts`
- Modify: `src/main.jsx`

**Interfaces:**
- Produces: `queryClient` (named export, a `QueryClient` instance) from `src/ui/queryClient.ts`, imported by `main.jsx` and by any component's tests that need `QueryClientProvider`.

- [ ] **Step 1: Install packages**

Run: `npm install @tanstack/react-query@^5 @radix-ui/react-tooltip@^1`

- [ ] **Step 2: Create the query client**

Create `src/ui/queryClient.ts`:

```ts
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

- [ ] **Step 3: Wire `QueryClientProvider` into `main.jsx`**

Modify `src/main.jsx` to:

```jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { NetworkProvider } from "./NetworkContext";
import { LanguageProvider } from "./LanguageContext";
import { ThemeProvider } from "./ThemeContext";
import { queryClient } from "./ui/queryClient";
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <NetworkProvider>
        <LanguageProvider>
          <ThemeProvider>
            <App />
          </ThemeProvider>
        </LanguageProvider>
      </NetworkProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
```

- [ ] **Step 4: Verify the app still boots**

Run: `npm run dev` (start it, confirm no console errors, then stop it — this step has no automated test since `main.jsx` has no test file today)

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/ui/queryClient.ts src/main.jsx
git commit -m "feat: add react-query client and wire into app root"
```

---

### Task 2: Skeleton primitives

**Files:**
- Create: `src/ui/Skeleton.tsx`
- Test: `src/__tests__/Skeleton.test.tsx`

**Interfaces:**
- Produces: `Skeleton` (default export, props `{ className?: string }`), `ListRowSkeleton` (named export, props `{ count?: number; isDarkMode?: boolean }`), `CardSkeleton` (named export, props `{ count?: number; isDarkMode?: boolean }`), `StatSkeleton` (named export, props `{ count?: number; isDarkMode?: boolean }`) — all from `src/ui/Skeleton.tsx`.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/Skeleton.test.tsx`:

```tsx
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Skeleton, { ListRowSkeleton, CardSkeleton, StatSkeleton } from "../ui/Skeleton";

describe("Skeleton", () => {
  it("renders a single pulse block with the given className", () => {
    render(<Skeleton className="h-4 w-32" data-testid="base-skeleton" />);
    const el = screen.getByTestId("base-skeleton");
    expect(el).toHaveClass("animate-pulse");
    expect(el).toHaveClass("h-4");
    expect(el).toHaveClass("w-32");
  });

  it("ListRowSkeleton renders the requested number of rows", () => {
    render(<ListRowSkeleton count={3} />);
    expect(screen.getAllByTestId("list-row-skeleton")).toHaveLength(3);
  });

  it("CardSkeleton renders the requested number of cards", () => {
    render(<CardSkeleton count={2} />);
    expect(screen.getAllByTestId("card-skeleton")).toHaveLength(2);
  });

  it("StatSkeleton renders the requested number of stat tiles", () => {
    render(<StatSkeleton count={4} />);
    expect(screen.getAllByTestId("stat-skeleton")).toHaveLength(4);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/Skeleton.test.tsx`
Expected: FAIL — `Cannot find module '../ui/Skeleton'`

- [ ] **Step 3: Write the implementation**

Create `src/ui/Skeleton.tsx`:

```tsx
import React from "react";

interface SkeletonProps {
  className?: string;
  "data-testid"?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ className = "", "data-testid": testId }) => (
  <div
    data-testid={testId}
    className={`animate-pulse rounded bg-slate-300 dark:bg-slate-700 ${className}`}
  />
);

export default Skeleton;

interface RepeatSkeletonProps {
  count?: number;
  isDarkMode?: boolean;
}

export const ListRowSkeleton: React.FC<RepeatSkeletonProps> = ({ count = 8, isDarkMode }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        data-testid="list-row-skeleton"
        className={`flex items-center gap-4 px-2 py-2 ${isDarkMode ? "bg-slate-800" : "bg-white"}`}
      >
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-32" />
      </div>
    ))}
  </>
);

export const CardSkeleton: React.FC<RepeatSkeletonProps> = ({ count = 6, isDarkMode }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        data-testid="card-skeleton"
        className={`rounded-lg shadow-lg overflow-hidden ${isDarkMode ? "bg-slate-800" : "bg-white"}`}
      >
        <Skeleton className="h-48 w-full rounded-none" />
        <div className="p-4 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      </div>
    ))}
  </>
);

export const StatSkeleton: React.FC<RepeatSkeletonProps> = ({ count = 4 }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} data-testid="stat-skeleton" className="text-center">
        <Skeleton className="h-8 w-16 mx-auto mb-1" />
        <Skeleton className="h-4 w-20 mx-auto" />
      </div>
    ))}
  </>
);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/Skeleton.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/ui/Skeleton.tsx src/__tests__/Skeleton.test.tsx
git commit -m "feat: add Skeleton loading primitives"
```

---

### Task 3: Tooltip primitive

**Files:**
- Create: `src/ui/Tooltip.tsx`
- Test: `src/__tests__/Tooltip.test.tsx`

**Interfaces:**
- Produces: `Tooltip` (default export, props `{ label: string; children: React.ReactElement; side?: "top" | "right" | "bottom" | "left" }`) from `src/ui/Tooltip.tsx`.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/Tooltip.test.tsx`:

```tsx
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Tooltip from "../ui/Tooltip";

describe("Tooltip", () => {
  it("renders the trigger children", () => {
    render(
      <Tooltip label="Full title text">
        <button>Trigger</button>
      </Tooltip>
    );
    expect(screen.getByRole("button", { name: "Trigger" })).toBeInTheDocument();
  });

  it("shows the label content on focus", async () => {
    render(
      <Tooltip label="Full title text">
        <button>Trigger</button>
      </Tooltip>
    );
    fireEvent.focus(screen.getByRole("button", { name: "Trigger" }));
    await waitFor(() =>
      expect(screen.getAllByText("Full title text").length).toBeGreaterThan(0)
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/Tooltip.test.tsx`
Expected: FAIL — `Cannot find module '../ui/Tooltip'`

- [ ] **Step 3: Write the implementation**

Create `src/ui/Tooltip.tsx`:

```tsx
import React from "react";
import * as RadixTooltip from "@radix-ui/react-tooltip";

interface TooltipProps {
  label: string;
  children: React.ReactElement;
  side?: "top" | "right" | "bottom" | "left";
}

const Tooltip: React.FC<TooltipProps> = ({ label, children, side = "top" }) => (
  <RadixTooltip.Provider delayDuration={200}>
    <RadixTooltip.Root>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          side={side}
          sideOffset={6}
          className="z-50 max-w-xs rounded bg-slate-900 px-2 py-1 text-xs text-white shadow-lg dark:bg-slate-100 dark:text-slate-900"
        >
          {label}
          <RadixTooltip.Arrow className="fill-slate-900 dark:fill-slate-100" />
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  </RadixTooltip.Provider>
);

export default Tooltip;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/Tooltip.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/ui/Tooltip.tsx src/__tests__/Tooltip.test.tsx
git commit -m "feat: add Tooltip primitive on radix-ui"
```

---

### Task 4: `authFetch` helper

**Files:**
- Create: `src/api/http.ts`
- Test: `src/__tests__/http.test.ts`

**Interfaces:**
- Produces: `authFetch<T>(path: string, options?: RequestInit): Promise<T>` (named export) and `ApiError` (named export class, has `.status: number`) from `src/api/http.ts`. `path` is joined to `baseURL` if it starts with `/api`, otherwise used as-is (matches the existing `${baseURL}/api/...` pattern already used in every component).

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/http.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { authFetch, ApiError } from "../api/http";

describe("authFetch", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("attaches the Authorization header from localStorage and returns parsed JSON", async () => {
    localStorage.setItem("token", "abc123");
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ hello: "world" }),
    });
    (global as any).fetch = mockFetch;

    const result = await authFetch("/api/wishlist");

    expect(result).toEqual({ hello: "world" });
    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers.Authorization).toBe("Bearer abc123");
  });

  it("throws ApiError with the status on a non-OK response", async () => {
    localStorage.setItem("token", "abc123");
    (global as any).fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ message: "Not found" }),
    });

    await expect(authFetch("/api/wishlist/1")).rejects.toMatchObject({
      status: 404,
    });
  });

  it("passes through method/body/extra headers for mutations", async () => {
    localStorage.setItem("token", "abc123");
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ id: "1" }),
    });
    (global as any).fetch = mockFetch;

    await authFetch("/api/wishlist/1", {
      method: "PUT",
      body: JSON.stringify({ notes: "x" }),
    });

    const [, options] = mockFetch.mock.calls[0];
    expect(options.method).toBe("PUT");
    expect(options.headers["Content-Type"]).toBe("application/json");
    expect(options.headers.Authorization).toBe("Bearer abc123");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/http.test.ts`
Expected: FAIL — `Cannot find module '../api/http'`

- [ ] **Step 3: Write the implementation**

Create `src/api/http.ts`:

```ts
const baseURL = import.meta.env.VITE_API_BASE_URL || "https://funko-backend.onrender.com";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function authFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("token");
  const url = path.startsWith("http") ? path : `${baseURL}${path}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(response.status, body.message || `HTTP error ${response.status}`);
  }

  return response.json();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/http.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/api/http.ts src/__tests__/http.test.ts
git commit -m "feat: add authFetch helper for query/mutation call sites"
```

---

### Task 5: Migrate `ItemList` to `useQuery` + skeleton + tooltip

**Files:**
- Modify: `src/ItemList.tsx`

**Interfaces:**
- Consumes: `authFetch` from `src/api/http.ts` (Task 4), `ListRowSkeleton` from `src/ui/Skeleton.tsx` (Task 2), `Tooltip` from `src/ui/Tooltip.tsx` (Task 3), `useQuery` from `@tanstack/react-query`.

- [ ] **Step 1: Replace the fetch/state block with `useQuery`**

In `src/ItemList.tsx`, replace lines 1-8 imports and the `items`/`itemsLoading`/`itemsError`/`fetchItems`/first `useEffect` block (current lines 36-78) with:

```tsx
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FixedSizeList } from "react-window";
import { useNavigate } from "react-router-dom";
import useBreakpoints from "./useBreakpoints";
import { authFetch } from "./api/http";
import { ListRowSkeleton } from "./ui/Skeleton";
import Tooltip from "./ui/Tooltip";
import LeftArrow from "/src/assets/left-arrow.svg?react";
import RightArrow from "/src/assets/right-arrow.svg?react";
```

(drop the `baseURL` constant — `authFetch` owns it now)

```tsx
const ItemList: React.FC<ItemListProps> = ({ token, currentUserRole, isDarkMode, t }) => {
  const navigate = useNavigate();
  const { isMobile, isTablet, isDesktop } = useBreakpoints();
  const [currentPage, setCurrentPage] = useState(1);

  const {
    data,
    isLoading: itemsLoading,
    error: itemsErrorObj,
  } = useQuery({
    queryKey: ["admin-items", currentPage],
    queryFn: () =>
      authFetch<{ items?: Item[]; totalItems?: number; totalPages?: number } | Item[]>(
        `/api/admin/items?page=${currentPage}&limit=${ITEMS_PER_PAGE}`
      ),
    enabled: !!token && currentUserRole === "admin",
  });

  const items: Item[] = Array.isArray(data) ? data : data?.items ?? [];
  const totalItemsCount = Array.isArray(data) ? data.length : data?.totalItems ?? 0;
  const totalPages = Array.isArray(data) ? 1 : data?.totalPages ?? 1;
  const itemsError = itemsErrorObj instanceof Error ? itemsErrorObj.message : null;
```

- [ ] **Step 2: Replace the loading/error early-returns and add tooltips to truncated cells**

Replace:

```tsx
  if (itemsLoading) return <div className="flex justify-center items-center h-64"><p className="text-lg">{t.loading || "Loading..."}</p></div>;
  if (itemsError) return <div className="flex justify-center items-center h-64"><p className="text-red-500 text-lg">{itemsError}</p></div>;
  if (items.length === 0) return <div className="flex justify-center items-center h-64"><p className="text-slate-500 text-lg">{t.notFound || "No Funko Pops found"}</p></div>;
```

with:

```tsx
  if (itemsLoading) return <ListRowSkeleton count={10} isDarkMode={isDarkMode} />;
  if (itemsError) return <div className="flex justify-center items-center h-64"><p className="text-red-500 text-lg">{itemsError}</p></div>;
  if (items.length === 0) return <div className="flex justify-center items-center h-64"><p className="text-slate-500 text-lg">{t.notFound || "No Funko Pops found"}</p></div>;
```

Inside `Row`, replace the three `title="..."` attributes with `Tooltip`:

```tsx
        <Tooltip label={item.title}>
          <div className="w-64 px-2 py-2 truncate">{item.title}</div>
        </Tooltip>
        <div className="w-16 px-2 py-2 text-center font-mono">{displayId}</div>
        <div className="w-16 px-2 py-2 text-center">{item.number}</div>
        <div className="w-32 px-2 py-2 truncate">{item.category}</div>
        <Tooltip label={String(item.series)}>
          <div className="w-32 px-2 py-2 truncate">
            {Array.isArray(item.series) ? item.series.join(", ") : item.series}
          </div>
        </Tooltip>
        <div className="w-24 px-2 py-2 text-center">
          {(item.exclusive?.toString().toLowerCase() === "true" || item.exclusive?.toString().toLowerCase() === "yes") ? (
            <span className="text-green-500 font-semibold text-xs">Yes</span>
          ) : (
            <span className="text-slate-500 text-xs">No</span>
          )}
        </div>
        <Tooltip label={item.imageName || "-"}>
          <div className="w-24 px-2 py-2 text-center text-xs truncate">{item.imageName || "-"}</div>
        </Tooltip>
```

(the second `useEffect` — auto-logout — and everything from `generateFunkoId` through the end of the file stay unchanged)

- [ ] **Step 3: Manual check**

Run: `npm run dev`, sign in as an admin user, open the item list page. Confirm: skeleton rows show briefly on first load, hovering a truncated title/series/image cell shows a tooltip with the full text, paging still works.

- [ ] **Step 4: Commit**

```bash
git add src/ItemList.tsx
git commit -m "feat: migrate ItemList to react-query, add skeleton and tooltips"
```

---

### Task 6: Migrate `CollectionPage` to `useQuery` + `useMutation` + skeleton

**Files:**
- Modify: `src/CollectionPage.tsx`

**Interfaces:**
- Consumes: `authFetch`, `ApiError` from `src/api/http.ts`, `CardSkeleton` from `src/ui/Skeleton.tsx`, `useQuery`, `useMutation`, `useQueryClient` from `@tanstack/react-query`.

- [ ] **Step 1: Replace fetch/state with `useQuery`**

In `src/CollectionPage.tsx`, add to the imports:

```tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authFetch } from "./api/http";
import { CardSkeleton } from "./ui/Skeleton";
```

Remove the `baseURL` constant and the `collection`/`loading` state plus the "Fetch collection data" `useEffect` (current lines 38, 40, and the block at lines 90-118). Replace with:

```tsx
  const queryClient = useQueryClient();
  const token = localStorage.getItem("token");

  const { data: collection = [], isLoading: loading } = useQuery<FunkoItem[]>({
    queryKey: ["collection"],
    queryFn: () => authFetch<FunkoItem[]>("/api/collection"),
    enabled: !!token,
  });
```

Keep the redirect-when-no-token behavior by adding, right after the query declaration:

```tsx
  useEffect(() => {
    if (!token) navigate("/loginregistersite");
  }, [token, navigate]);
```

- [ ] **Step 2: Convert edit/delete to optimistic `useMutation`**

Replace `handleSaveEdit` and `handleDeleteItem` with:

```tsx
  const editMutation = useMutation({
    mutationFn: (payload: Partial<FunkoItem> & { id: string }) =>
      authFetch<FunkoItem>(`/api/collection/${payload.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      }),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ["collection"] });
      const previous = queryClient.getQueryData<FunkoItem[]>(["collection"]);
      queryClient.setQueryData<FunkoItem[]>(["collection"], (old = []) =>
        old.map((item) => (item.id === payload.id ? { ...item, ...payload } : item))
      );
      return { previous };
    },
    onError: (_err, _payload, context) => {
      if (context?.previous) queryClient.setQueryData(["collection"], context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["collection"] }),
  });

  const handleSaveEdit = () => {
    if (!editingItem) return;
    editMutation.mutate({ ...editForm, id: editingItem } as FunkoItem & { id: string });
    setEditingItem(null);
    setEditForm({});
  };

  const deleteMutation = useMutation({
    mutationFn: (itemId: string) =>
      authFetch<void>(`/api/collection/${itemId}`, { method: "DELETE" }),
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: ["collection"] });
      const previous = queryClient.getQueryData<FunkoItem[]>(["collection"]);
      queryClient.setQueryData<FunkoItem[]>(["collection"], (old = []) =>
        old.filter((item) => item.id !== itemId)
      );
      return { previous };
    },
    onError: (_err, _itemId, context) => {
      if (context?.previous) queryClient.setQueryData(["collection"], context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["collection"] }),
  });

  const handleDeleteItem = (itemId: string) => {
    if (!confirm(t.confirmDelete)) return;
    deleteMutation.mutate(itemId);
  };
```

- [ ] **Step 3: Swap the loading branch for the skeleton**

Replace:

```tsx
          {loading ? (
            <div className="text-center py-8">Loading your collection...</div>
```

with:

```tsx
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <CardSkeleton count={6} isDarkMode={isDarkMode} />
            </div>
```

(the following `) : filteredCollection.length === 0 ? (` branch and everything after stays unchanged)

- [ ] **Step 4: Manual check**

Run: `npm run dev`, sign in, open the collection page. Confirm: card skeletons show briefly, editing a field and hitting Save updates the card immediately (before the network response), deleting removes the card immediately, and reloading the page reflects the same state (proving the mutation reached the server).

- [ ] **Step 5: Commit**

```bash
git add src/CollectionPage.tsx
git commit -m "feat: migrate CollectionPage to react-query with optimistic edit/delete"
```

---

### Task 7: Migrate `WishlistPage` to `useQuery` + `useMutation` + skeleton

**Files:**
- Modify: `src/WishlistPage.tsx`

**Interfaces:**
- Consumes: `authFetch` from `src/api/http.ts`, `CardSkeleton` from `src/ui/Skeleton.tsx`, `useQuery`, `useMutation`, `useQueryClient` from `@tanstack/react-query`.

- [ ] **Step 1: Replace fetch/state with `useQuery`**

Add to imports:

```tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authFetch } from "./api/http";
import { CardSkeleton } from "./ui/Skeleton";
```

Remove the `baseURL` constant, the `wishlist`/`loading` state, and the "Fetch wishlist data" `useEffect` (current lines 40, 42, 92-120). Replace with:

```tsx
  const queryClient = useQueryClient();
  const token = localStorage.getItem("token");

  const { data: wishlist = [], isLoading: loading } = useQuery<WishlistItem[]>({
    queryKey: ["wishlist"],
    queryFn: () => authFetch<WishlistItem[]>("/api/wishlist"),
    enabled: !!token,
  });

  useEffect(() => {
    if (!token) navigate("/loginregistersite");
  }, [token, navigate]);
```

- [ ] **Step 2: Convert edit/delete/move-to-collection to `useMutation`**

Replace `handleSaveEdit`, `handleDeleteItem`, and `handleMoveToCollection` with:

```tsx
  const editMutation = useMutation({
    mutationFn: (payload: Partial<WishlistItem> & { id: string }) =>
      authFetch<WishlistItem>(`/api/wishlist/${payload.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      }),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ["wishlist"] });
      const previous = queryClient.getQueryData<WishlistItem[]>(["wishlist"]);
      queryClient.setQueryData<WishlistItem[]>(["wishlist"], (old = []) =>
        old.map((item) => (item.id === payload.id ? { ...item, ...payload } : item))
      );
      return { previous };
    },
    onError: (_err, _payload, context) => {
      if (context?.previous) queryClient.setQueryData(["wishlist"], context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["wishlist"] }),
  });

  const handleSaveEdit = () => {
    if (!editingItem) return;
    editMutation.mutate({ ...editForm, id: editingItem } as WishlistItem);
    setEditingItem(null);
    setEditForm({});
  };

  const deleteMutation = useMutation({
    mutationFn: (itemId: string) =>
      authFetch<void>(`/api/wishlist/${itemId}`, { method: "DELETE" }),
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: ["wishlist"] });
      const previous = queryClient.getQueryData<WishlistItem[]>(["wishlist"]);
      queryClient.setQueryData<WishlistItem[]>(["wishlist"], (old = []) =>
        old.filter((item) => item.id !== itemId)
      );
      return { previous };
    },
    onError: (_err, _itemId, context) => {
      if (context?.previous) queryClient.setQueryData(["wishlist"], context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["wishlist"] }),
  });

  const handleDeleteItem = (itemId: string) => {
    if (!confirm("Are you sure you want to remove this item from your wishlist?")) return;
    deleteMutation.mutate(itemId);
  };

  const moveToCollectionMutation = useMutation({
    mutationFn: (item: WishlistItem) =>
      authFetch<void>("/api/collection", {
        method: "POST",
        body: JSON.stringify({
          title: item.title,
          number: item.number,
          image_name: item.image_name,
          series: item.series,
          condition: item.target_condition || "mint",
          purchase_price: item.max_price,
        }),
      }),
    onSuccess: (_data, item) => {
      deleteMutation.mutate(item.id);
      alert("Item moved to your collection!");
    },
  });

  const handleMoveToCollection = (item: WishlistItem) => {
    moveToCollectionMutation.mutate(item);
  };
```

- [ ] **Step 3: Swap the loading branch for the skeleton**

Replace:

```tsx
          {loading ? (
            <div className="text-center py-8">Loading your wishlist...</div>
```

with:

```tsx
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <CardSkeleton count={4} isDarkMode={isDarkMode} />
            </div>
```

(the following `) : filteredWishlist.length === 0 ? (` branch and everything after stays unchanged)

- [ ] **Step 4: Manual check**

Run: `npm run dev`, sign in, open the wishlist page. Confirm: card skeletons show briefly, clicking Remove removes the card immediately, editing and saving updates the card immediately, "Add to Collection" removes it from the wishlist and it now appears on the collection page.

- [ ] **Step 5: Commit**

```bash
git add src/WishlistPage.tsx
git commit -m "feat: migrate WishlistPage to react-query with optimistic mutations"
```

---

## Out of scope for this plan (tracked for follow-up plans)

- `FunkoDetails.tsx` migration (axios interceptor, price scraping, AI description — bigger surface, needs its own plan).
- Loyalty surface (`LoyaltyDashboard`, `LoyaltyWidget`, `LoyaltyLeaderboard`, `LoyaltyBadge`).
- Admin/social (`Admin`, `AdminInvites`, `FriendProfileModal`, `ChatComponent`) — including the icon-only-button tooltip sweep called out in the spec.
- Remaining reads (`DashboardSite`, `AnalysticsDashboard`, `SearchSite`, `MostVisitedSite`).

These are phases 2b-5 from the spec's rollout order and reuse the exact primitives built in Tasks 1-4 here — no new foundation work needed for them.
