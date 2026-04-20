import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function InterviewsPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Interviews</h1>
        <p className="mt-2 text-muted-foreground">
          Track guest interview links, interview states, transcripts, and
          follow-up activity.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Phase 2 target</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Tokenized guest interview orchestration and transcript pipeline will be
          implemented in this section.
        </CardContent>
      </Card>
    </div>
  );
}

