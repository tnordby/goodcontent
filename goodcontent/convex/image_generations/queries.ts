import { query } from "../_generated/server";

export const noop = query({
  args: {},
  handler: async () => null,
});

