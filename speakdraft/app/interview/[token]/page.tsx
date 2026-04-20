interface InterviewGuestPageProps {
  params: Promise<{ token: string }>;
}

export default async function InterviewGuestPage({
  params,
}: InterviewGuestPageProps) {
  const { token } = await params;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Guest Interview</h1>
      <p className="text-muted-foreground">
        Token: <span className="font-mono text-foreground">{token}</span>
      </p>
      <div className="rounded-lg border p-5 text-sm text-muted-foreground">
        Interview room UI, consent step, and live voice flow will be implemented
        in the next phase.
      </div>
    </main>
  );
}

