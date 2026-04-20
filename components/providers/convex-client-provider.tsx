"use client";

import { ReactNode, useEffect, useMemo } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth } from "@clerk/nextjs";

const PLACEHOLDER_CONVEX_URL = "https://placeholder.convex.cloud";

export default function ConvexClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
  const hasConvexUrl = Boolean(convexUrl);
  const resolvedConvexUrl = hasConvexUrl ? convexUrl! : PLACEHOLDER_CONVEX_URL;
  const convex = useMemo(
    () => new ConvexReactClient(resolvedConvexUrl),
    [resolvedConvexUrl],
  );

  useEffect(() => {
    if (!hasConvexUrl) {
      console.warn(
        "NEXT_PUBLIC_CONVEX_URL is missing. Using a placeholder Convex URL so hooks don't crash during build; set NEXT_PUBLIC_CONVEX_URL in your deployment environment for real data.",
      );
    }
  }, [hasConvexUrl]);

  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}
