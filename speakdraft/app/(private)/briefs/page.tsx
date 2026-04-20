import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function BriefsPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Briefs</h1>
        <p className="mt-2 text-muted-foreground">
          Create and manage content briefs with language, tone, outline, and
          SME interview context.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Phase 2 target</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Brief CRUD and phase progression will be implemented here next.
        </CardContent>
      </Card>
    </div>
  );
}

