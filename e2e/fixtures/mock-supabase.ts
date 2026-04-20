import type { BrowserContext, Page, Route } from '@playwright/test';
import { TEST_SESSION, type SeedData } from './seed-data';

export type MockSupabaseHandle = {
  seed: SeedData;
  seedResponse: (pathRegex: string | RegExp, body: unknown) => void;
  functionsResponse: (functionName: string, body: unknown, status?: number) => void;
};

/**
 * Plant a Supabase session in localStorage for the configured supabase URL
 * so the AuthProvider picks it up immediately without hitting the network.
 * Must be called BEFORE page.goto().
 */
/** Project ref for the mock Supabase URL injected by playwright.config.ts webServer env */
export const MOCK_SUPABASE_PROJECT_REF = 'e2e-mock';
export const SUPABASE_STORAGE_KEY = `sb-${MOCK_SUPABASE_PROJECT_REF}-auth-token`;

export async function seedAuthSession(context: BrowserContext, baseURL: string): Promise<void> {
  await context.addInitScript(
    ({ session, storageKey }) => {
      const payload = {
        ...session,
        provider_token: null,
        provider_refresh_token: null,
      };
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(payload));
      } catch {
        // localStorage may not be available in some contexts — ignore
      }
    },
    { session: TEST_SESSION, storageKey: SUPABASE_STORAGE_KEY }
  );
  void baseURL;
}

/**
 * Install route handlers that mock every Supabase REST/Auth/Functions/Storage
 * endpoint against an in-memory seed. Any request matching /rest/v1/<table>/...
 * is resolved from seed.<table>. POST/PATCH/DELETE are applied to the seed.
 */
export async function mockSupabase(
  page: Page,
  initialSeed: SeedData
): Promise<MockSupabaseHandle> {
  const seed: SeedData = JSON.parse(JSON.stringify(initialSeed));
  const customResponses = new Map<string, unknown>();
  const functionResponses = new Map<string, { body: unknown; status: number }>();

  await page.route(/\/auth\/v1\//, async (route: Route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/user')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(TEST_SESSION.user),
      });
    }
    if (url.pathname.endsWith('/token')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(TEST_SESSION),
      });
    }
    if (url.pathname.endsWith('/logout')) {
      return route.fulfill({ status: 204, body: '' });
    }
    if (url.pathname.endsWith('/otp')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });

  await page.route(/\/rest\/v1\//, async (route: Route) => {
    const req = route.request();
    const url = new URL(req.url());
    const segments = url.pathname.split('/rest/v1/')[1]?.split('/') ?? [];
    const tableName = segments[0]?.split('?')[0] ?? '';

    // Custom overrides take priority
    for (const [pattern, body] of customResponses) {
      if (url.pathname.includes(pattern)) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(body),
        });
      }
    }

    if (!(tableName in seed)) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '[]',
      });
    }

    const table = seed[tableName as keyof SeedData];
    const method = req.method();

    if (method === 'GET') {
      const rows = applyPostgrestFilters(table, url);
      const accept = req.headers()['accept'] ?? '';
      // PostgREST returns a single object when Accept is vnd.pgrst.object+json
      // (what the supabase-js `.single()` and `.maybeSingle()` emit)
      const wantsSingleObject = accept.includes('vnd.pgrst.object+json');
      if (wantsSingleObject) {
        if (rows.length === 0) {
          return route.fulfill({
            status: 406,
            contentType: 'application/json',
            body: JSON.stringify({
              code: 'PGRST116',
              message: 'JSON object requested, multiple (or no) rows returned',
            }),
          });
        }
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(rows[0]),
        });
      }
      const prefer = req.headers()['prefer'] ?? '';
      if (prefer.includes('count=')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: { 'content-range': `0-${rows.length - 1}/${rows.length}` },
          body: JSON.stringify(rows),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(rows),
      });
    }

    if (method === 'POST') {
      const payload = req.postDataJSON();
      const rows: Record<string, unknown>[] = Array.isArray(payload) ? payload : [payload];
      const inserted = rows.map((r) => {
        const row = { ...r };
        if (!row.id) row.id = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        if (!row.created_at) row.created_at = new Date().toISOString();
        if (!row.updated_at) row.updated_at = new Date().toISOString();
        return row;
      });
      table.push(...inserted);
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(inserted),
      });
    }

    if (method === 'PATCH') {
      const update = req.postDataJSON();
      const matching = applyPostgrestFilters(table, url);
      for (const row of matching) {
        Object.assign(row, update, { updated_at: new Date().toISOString() });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(matching),
      });
    }

    if (method === 'DELETE') {
      const matching = applyPostgrestFilters(table, url);
      const ids = new Set(matching.map((r) => r.id));
      const idx = table.findIndex((r) => ids.has(r.id));
      while (idx !== -1 && ids.has(table[idx].id)) {
        table.splice(idx, 1);
        const next = table.findIndex((r) => ids.has(r.id));
        if (next === -1) break;
      }
      // Simpler: filter in place
      seed[tableName as keyof SeedData] = table.filter((r) => !ids.has(r.id));
      return route.fulfill({ status: 204, body: '' });
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '[]',
    });
  });

  await page.route(/\/functions\/v1\//, async (route: Route) => {
    const url = new URL(route.request().url());
    const functionName = url.pathname.split('/functions/v1/')[1]?.split(/[/?]/)[0] ?? '';
    const canned = functionResponses.get(functionName);
    if (canned) {
      return route.fulfill({
        status: canned.status,
        contentType: 'application/json',
        body: JSON.stringify(canned.body),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true }),
    });
  });

  await page.route(/\/storage\/v1\//, async (route: Route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ publicUrl: 'https://mock.storage/placeholder.png' }),
    });
  });

  await page.route(/\/rpc\//, async (route: Route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: 'null',
    });
  });

  return {
    seed,
    seedResponse(pattern, body) {
      customResponses.set(String(pattern), body);
    },
    functionsResponse(functionName, body, status = 200) {
      functionResponses.set(functionName, { body, status });
    },
  };
}

function applyPostgrestFilters(
  rows: Array<Record<string, unknown>>,
  url: URL
): Array<Record<string, unknown>> {
  let result = [...rows];
  for (const [key, value] of url.searchParams) {
    if (key === 'select' || key === 'order' || key === 'limit' || key === 'offset') continue;
    // Postgrest filter syntax: column=eq.value or column=in.(a,b,c)
    const match = /^([a-z_]+)\.(.+)$/i.exec(value);
    if (!match) continue;
    const [, op, operand] = match;
    if (op === 'eq') {
      result = result.filter((r) => String(r[key]) === operand);
    } else if (op === 'in') {
      const values = operand.replace(/^\(|\)$/g, '').split(',');
      result = result.filter((r) => values.includes(String(r[key])));
    } else if (op === 'cs') {
      const needle = operand.replace(/^\[|\]$/g, '').split(',').map((s) => s.trim());
      result = result.filter((r) => {
        const arr = r[key] as unknown[];
        if (!Array.isArray(arr)) return false;
        return needle.every((n) => arr.includes(n));
      });
    }
  }
  const order = url.searchParams.get('order');
  if (order) {
    const [col, direction] = order.split('.');
    const ascending = direction !== 'desc';
    result.sort((a, b) => {
      const av = String(a[col] ?? '');
      const bv = String(b[col] ?? '');
      return ascending ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }
  return result;
}
