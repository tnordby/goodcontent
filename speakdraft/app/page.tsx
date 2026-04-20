import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-20">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Speak Draft
        </p>
        <h1 className="text-5xl font-semibold tracking-tight">
          AI interviews your experts. You get publish-ready drafts in HubSpot.
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Capture SME and customer expertise through async voice interviews, then
          generate structured, high-quality content your team can review and push
          straight into HubSpot.
        </p>
        <div className="flex items-center gap-3">
          <Button asChild>
            <Link href="/dashboard">Open app</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/sign-in">Sign in</Link>
          </Button>
        </div>
      </section>
      <section className="mx-auto max-w-4xl px-6 pb-16">
        <div className="rounded-lg border p-6">
          <p className="text-sm text-muted-foreground">
            Phase 1 shell is ready. Next implementation step is wiring brief,
            interview, draft, and HubSpot flows on this foundation.
          </p>
        </div>
      </section>
    </main>
  );
}
