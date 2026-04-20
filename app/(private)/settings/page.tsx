import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-2 text-muted-foreground">
          Workspace preferences, member roles, and HubSpot portal connections.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Phase 3 target</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          HubSpot OAuth management and workspace membership controls will be
          implemented in this area.
        </CardContent>
      </Card>
    </div>
  );
}

