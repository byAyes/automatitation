// Mock Prisma client — database is currently unavailable due to IPv6-only
// Supabase hostname on Windows. All queries return empty/safe defaults so the
// automation pipeline (scrape → email) works without a database.
// TODO: Restore real PrismaClient once the Supabase IPv6 connection issue is resolved.

function createModelProxy(): any {
  return new Proxy({} as any, {
    get(_target, prop: string) {
      return async (...args: any[]) => {
        const method = prop;
        if (method === 'findMany') return [];
        if (method === 'findFirst' || method === 'findUnique') return null;
        if (method === 'count') return 0;
        if (method === 'create' || method === 'upsert' || method === 'update') {
          const data = args[0]?.data || args[0]?.create || {};
          return { id: 'mock-id', ...data };
        }
        if (method === 'updateMany' || method === 'deleteMany') return { count: 0 };
        return undefined;
      };
    },
  });
}

const prisma = new Proxy({} as any, {
  get(_target: any, prop: string | symbol) {
    if (prop === '$disconnect' || prop === '$connect' || prop === '$on' || prop === '$use') {
      return async () => {};
    }
    if (prop === '$transaction') {
      return async (fn: any) => fn(prisma);
    }
    if (typeof prop === 'string' && !prop.startsWith('$')) {
      return createModelProxy();
    }
    return undefined;
  },
});

export { prisma };
