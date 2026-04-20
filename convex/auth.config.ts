import { AuthConfig } from "convex/server";

const clerkIssuerDomain =
  process.env.CLERK_FRONTEND_API_URL?.trim() ||
  process.env.CLERK_JWT_ISSUER_DOMAIN?.trim();

if (!clerkIssuerDomain) {
  throw new Error(
    "Missing Clerk issuer domain for Convex auth. Set CLERK_FRONTEND_API_URL (recommended) or CLERK_JWT_ISSUER_DOMAIN in your Convex deployment environment.",
  );
}

export default {
  providers: [
    {
      // Clerk's Convex integration uses the Clerk Frontend API URL as the JWT issuer domain.
      // See: https://clerk.com/docs/guides/development/integrations/databases/convex
      domain: clerkIssuerDomain,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
