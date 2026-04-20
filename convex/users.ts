import {
  internalMutation,
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import { UserJSON } from "@clerk/backend";
import { v, Validator } from "convex/values";

export const current = query({
  args: {},
  handler: async (ctx) => {
    return await getCurrentUser(ctx);
  },
});

/**
 * Ensures a `users` row (and default workspace) exists for the signed-in Clerk identity.
 * Clerk webhooks are still recommended, but this removes the hard dependency on Svix delivery
 * for first-time sign-in (otherwise mutations like `briefs.create` would fail).
 */
export async function loadOrCreateUserForAuth(ctx: MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }

  const existing = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .unique();
  if (existing) {
    return existing;
  }

  const now = Date.now();
  const workspaceId = await ctx.db.insert("workspaces", {
    name: "My Workspace",
    plan: "starter",
    creditBalance: 0,
    autoApproveReview: false,
    createdAt: now,
    updatedAt: now,
  });

  const userId = await ctx.db.insert("users", {
    clerkId: identity.subject,
    workspaceId,
    email: identity.email ?? "",
    ...(identity.name?.trim() ? { name: identity.name.trim() } : {}),
    ...(identity.pictureUrl ? { imageUrl: identity.pictureUrl } : {}),
    role: "admin",
    createdAt: now,
    updatedAt: now,
  });

  const created = await ctx.db.get(userId);
  if (!created) {
    throw new Error("Failed to create user");
  }
  return created;
}

export const ensureFromIdentity = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await loadOrCreateUserForAuth(ctx);
    return { userId: user._id };
  },
});

export const upsertFromClerk = internalMutation({
  args: { data: v.any() as Validator<UserJSON> }, // no runtime validation, trust Clerk
  async handler(ctx, { data }) {
    const user = await userByExternalId(ctx, data.id);
    if (user === null) {
      // Create default workspace for first-time user.
      const workspaceId = await ctx.db.insert("workspaces", {
        name: data.organization_memberships?.[0]?.organization?.name ?? "My Workspace",
        plan: "starter",
        creditBalance: 0,
        autoApproveReview: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      await ctx.db.insert("users", {
        clerkId: data.id,
        workspaceId,
        email: data.email_addresses[0]?.email_address || "",
        name: `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim(),
        imageUrl: data.image_url || "",
        role: "admin",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.patch(user._id, {
        email: data.email_addresses[0]?.email_address || user.email,
        name: `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim(),
        imageUrl: data.image_url || user.imageUrl,
        updatedAt: Date.now(),
      });
    }
  },
});

export const deleteFromClerk = internalMutation({
  args: { clerkUserId: v.string() },
  async handler(ctx, { clerkUserId }) {
    const user = await userByExternalId(ctx, clerkUserId);

    if (user !== null) {
      await ctx.db.delete(user._id);
    } else {
      console.warn(
        `Can't delete user, there is none for Clerk user ID: ${clerkUserId}`
      );
    }
  },
});

export async function getCurrentUserOrThrow(ctx: QueryCtx) {
  const userRecord = await getCurrentUser(ctx);
  if (!userRecord) throw new Error("Cannot resolve current user");
  return userRecord;
}

export async function getCurrentUser(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) {
    return null;
  }
  return await userByExternalId(ctx, identity.subject);
}

async function userByExternalId(ctx: QueryCtx, externalId: string) {
  return await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", externalId))
    .unique();
}
