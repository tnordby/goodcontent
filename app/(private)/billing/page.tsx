import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function BillingPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
        <p className="mt-2 text-muted-foreground">
          Workspace-level billing and Polar customer portal wiring is scheduled
          for Phase 3.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Coming next</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Plan details, credit transactions, invoice history, and subscription
          management will appear here once workspace billing flows are wired.
        </CardContent>
      </Card>
    </div>
  );
}
