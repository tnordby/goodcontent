import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DraftsPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Drafts</h1>
        <p className="mt-2 text-muted-foreground">
          Review generated drafts, apply edits, and prepare approved content for
          HubSpot push.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Phase 2 and 3 target</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Draft generation lifecycle, quality gate, and push readiness controls
          will be added here.
        </CardContent>
      </Card>
    </div>
  );
}

