import { mutation } from "../_generated/server";

export const noop = mutation({
  args: {},
  handler: async () => null,
});

