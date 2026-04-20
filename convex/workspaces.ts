import { query } from "./_generated/server";
import { getCurrentUser } from "./users";

export const current = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return null;
    }
    return await ctx.db.get(user.workspaceId);
  },
});

