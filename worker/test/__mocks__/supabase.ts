export function createClient() {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          data: [],
          error: null,
        }),
      }),
      insert: () => ({
        data: [],
        error: null,
      }),
      update: () => ({
        data: [],
        error: null,
      }),
      delete: () => ({
        data: [],
        error: null,
      }),
    }),
  };
}