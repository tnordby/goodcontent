import { action } from "../_generated/server";

export const noop = action({
  args: {},
  handler: async () => null,
});

