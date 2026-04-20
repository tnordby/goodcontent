import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import type { WebhookEvent } from "@clerk/backend";
import { Webhook } from "svix";

const http = httpRouter();

const corsJsonHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json; charset=utf-8",
} as const;

http.route({
  path: "/guest/interview/complete",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, { status: 204, headers: corsJsonHeaders });
  }),
});

http.route({
  path: "/guest/interview/complete",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = (await request.json()) as {
        token?: string;
        transcript?: string;
        guestName?: string;
        guestEmail?: string;
      };

      const token = body.token?.trim() ?? "";
      const transcript = body.transcript ?? "";
      if (!token) {
        return new Response(JSON.stringify({ error: "Missing token" }), {
          status: 400,
          headers: corsJsonHeaders,
        });
      }

      await ctx.runMutation(internal.drafts.completeGuestInterviewFromHttp, {
        token,
        transcript,
        guestName: body.guestName,
        guestEmail: body.guestEmail,
      });

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: corsJsonHeaders,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Request failed";
      return new Response(JSON.stringify({ error: message }), {
        status: 400,
        headers: corsJsonHeaders,
      });
    }
  }),
});

http.route({
  path: "/webhook/clerk",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const event = await validateRequest(request);
    if (!event) {
      return new Response("Error occured", { status: 400 });
    }
    switch (event.type) {
      case "user.created": // intentional fallthrough
      case "user.updated":
        await ctx.runMutation(internal.users.upsertFromClerk, {
          data: event.data,
        });
        break;

      case "user.deleted": {
        const clerkUserId = event.data.id!;
        await ctx.runMutation(internal.users.deleteFromClerk, { clerkUserId });
        break;
      }
      default:
        break;
    }

    return new Response(null, { status: 200 });
  }),
});

async function validateRequest(req: Request): Promise<WebhookEvent | null> {
  const payloadString = await req.text();
  const svixHeaders = {
    "svix-id": req.headers.get("svix-id")!,
    "svix-timestamp": req.headers.get("svix-timestamp")!,
    "svix-signature": req.headers.get("svix-signature")!,
  };
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
  try {
    return wh.verify(payloadString, svixHeaders) as unknown as WebhookEvent;
  } catch (error) {
    console.error("Error verifying webhook event", error);
    return null;
  }
}

export default http;
