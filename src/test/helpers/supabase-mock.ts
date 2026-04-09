import { vi } from 'vitest';

type Row = Record<string, unknown>;

/**
 * In-memory store that simulates Supabase PostgREST queries.
 * Supports: select, insert, update, delete, eq, contains, order, single.
 */
class InMemoryTable {
  rows: Row[] = [];

  clear() {
    this.rows = [];
  }
}

const tables: Record<string, InMemoryTable> = {};

function getTable(name: string): InMemoryTable {
  if (!tables[name]) tables[name] = new InMemoryTable();
  return tables[name];
}

export function clearAllTables() {
  for (const table of Object.values(tables)) {
    table.clear();
  }
}

/** Build a chainable query builder that resolves to { data, error } */
function createQueryBuilder(tableName: string) {
  const table = getTable(tableName);
  let operation: 'select' | 'insert' | 'update' | 'delete' = 'select';
  let selectColumns: string | null = null;
  let insertData: Row | Row[] | null = null;
  let updateData: Row | null = null;
  const filters: Array<{ column: string; op: string; value: unknown }> = [];
  let orderColumn: string | null = null;
  let orderAscending = true;
  let isSingle = false;
  let isMaybeSingle = false;
  let chainedSelect: string | null = null;

  const resolve = () => {
    let result: Row[] = [...table.rows];

    // Apply filters
    for (const f of filters) {
      if (f.op === 'eq') {
        result = result.filter(r => r[f.column] === f.value);
      } else if (f.op === 'contains') {
        result = result.filter(r => {
          const arr = r[f.column] as unknown[];
          const vals = f.value as unknown[];
          return vals.every(v => arr?.includes(v));
        });
      }
    }

    if (operation === 'select') {
      if (selectColumns && selectColumns !== '*') {
        const cols = selectColumns.split(',').map(c => c.trim());
        result = result.map(r => {
          const picked: Row = {};
          for (const c of cols) picked[c] = r[c];
          return picked;
        });
      }
      if (orderColumn) {
        result.sort((a, b) => {
          const av = a[orderColumn!] as string;
          const bv = b[orderColumn!] as string;
          return orderAscending ? av.localeCompare(bv) : bv.localeCompare(av);
        });
      }
      if (isMaybeSingle) {
        return { data: result[0] ?? null, error: null };
      }
      if (isSingle) {
        return { data: result[0] ?? null, error: result.length === 0 ? { code: 'PGRST116', message: 'not found' } : null };
      }
      return { data: result, error: null };
    }

    if (operation === 'insert') {
      const rows = Array.isArray(insertData) ? insertData : [insertData!];
      for (const row of rows) {
        if (!row.id) row.id = `mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        if (!row.created_at) row.created_at = new Date().toISOString();
        if (!row.updated_at) row.updated_at = new Date().toISOString();
        table.rows.push({ ...row });
      }
      if (chainedSelect) {
        const cols = chainedSelect.split(',').map(c => c.trim());
        const inserted = rows.map(r => {
          const picked: Row = {};
          for (const c of cols) picked[c] = r[c];
          return picked;
        });
        if (isSingle) return { data: inserted[0], error: null };
        return { data: inserted, error: null };
      }
      return { data: null, error: null };
    }

    if (operation === 'update') {
      for (const row of result) {
        Object.assign(row, updateData, { updated_at: new Date().toISOString() });
      }
      return { data: null, error: null };
    }

    if (operation === 'delete') {
      const idsToDelete = new Set(result.map(r => r.id));
      table.rows = table.rows.filter(r => !idsToDelete.has(r.id));
      return { data: null, error: null };
    }

    return { data: null, error: null };
  };

  const builder: Record<string, unknown> = {};

  builder.select = (cols: string = '*') => {
    if (operation === 'insert') {
      chainedSelect = cols;
    } else {
      operation = 'select';
      selectColumns = cols;
    }
    return builder;
  };
  builder.insert = (data: Row | Row[]) => { operation = 'insert'; insertData = data; return builder; };
  builder.update = (data: Row) => { operation = 'update'; updateData = data; return builder; };
  builder.delete = () => { operation = 'delete'; return builder; };
  builder.eq = (col: string, val: unknown) => { filters.push({ column: col, op: 'eq', value: val }); return builder; };
  builder.contains = (col: string, val: unknown) => { filters.push({ column: col, op: 'contains', value: val }); return builder; };
  builder.order = (col: string, opts?: { ascending?: boolean }) => { orderColumn = col; orderAscending = opts?.ascending ?? true; return builder; };
  builder.single = () => { isSingle = true; return builder; };
  builder.maybeSingle = () => { isMaybeSingle = true; return builder; };

  // Make the builder thenable (resolves like a promise)
  builder.then = (onFulfilled: (v: unknown) => unknown, onRejected?: (e: unknown) => unknown) => {
    return Promise.resolve(resolve()).then(onFulfilled, onRejected);
  };

  return builder;
}

export function createMockSupabaseClient() {
  return {
    from: (tableName: string) => createQueryBuilder(tableName),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signInWithOtp: vi.fn().mockResolvedValue({ error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: { user: { id: 'mock-user' }, session: {} }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  };
}

// Mock the createClient module
vi.mock('@/lib/supabase', () => ({
  createClient: () => createMockSupabaseClient(),
}));
