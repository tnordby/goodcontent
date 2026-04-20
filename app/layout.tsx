import { ThemeProvider } from "@/components/theme-provider";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import ConvexClientProvider from "@/components/providers/convex-client-provider";
import { shadcn } from "@clerk/themes";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

function getMetadataBase(): URL | undefined {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    try {
      return new URL(explicit);
    } catch {
      // fall through
    }
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    try {
      return new URL(`https://${vercelUrl}`);
    } catch {
      return undefined;
    }
  }

  return undefined;
}

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: {
    default: "GoodContent",
    template: "%s · GoodContent",
  },
  description:
    "GoodContent runs async expert interviews and turns transcripts into publish-ready drafts for HubSpot.",
  applicationName: "GoodContent",
  openGraph: {
    title: "GoodContent",
    description:
      "AI interviews your experts. You get publish-ready drafts in HubSpot.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GoodContent",
    description:
      "AI interviews your experts. You get publish-ready drafts in HubSpot.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const enableVercelAnalytics = process.env.VERCEL === "1";

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClerkProvider appearance={{ theme: shadcn }}>
          <ConvexClientProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              {children}
              <Toaster />
              {enableVercelAnalytics ? <Analytics /> : null}
            </ThemeProvider>
          </ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
