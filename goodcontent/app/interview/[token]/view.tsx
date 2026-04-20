"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api as rawApi } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const api = rawApi as any;

export function GuestInterviewClient({ token }: { token: string }) {
  const [isStarting, setIsStarting] = useState(false);
  const session = useQuery(api.interviews.getGuestSessionByToken, { token });
  const startInterview = useMutation(api.interviews.startByToken);

  const onStart = async () => {
    if (!token || isStarting) return;
    setIsStarting(true);
    try {
      await startInterview({ token });
      toast.success("Interview started");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to start interview");
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Guest Interview</h1>

      {session === undefined ? (
        <div className="rounded-lg border p-5 text-sm text-muted-foreground">
          Loading interview session...
        </div>
      ) : session.state === "invalid" ? (
        <div className="rounded-lg border p-5 text-sm text-red-600">
          This interview link is invalid.
        </div>
      ) : session.state === "expired" ? (
        <div className="rounded-lg border p-5 text-sm text-amber-700">
          This interview link has expired.
        </div>
      ) : session.state === "used" ? (
        <div className="rounded-lg border p-5 text-sm text-muted-foreground">
          This interview has already been completed or is no longer available.
        </div>
      ) : (
        <div className="space-y-3 rounded-lg border p-5 text-sm text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Brief:</span> {session.briefTitle}
          </p>
          <p>
            <span className="font-medium text-foreground">Interview language:</span>{" "}
            {session.interviewerLanguage}
          </p>
          <p>
            <span className="font-medium text-foreground">Output language:</span>{" "}
            {session.outputLanguage}
          </p>
          <p>
            <span className="font-medium text-foreground">Status:</span> {session.status}
          </p>
          <Button onClick={onStart} disabled={isStarting || session.status !== "pending"}>
            {isStarting ? "Starting..." : "Start interview"}
          </Button>
        </div>
      )}
    </main>
  );
}

