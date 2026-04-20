import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Welcome to Speak Draft</h1>
        <p className="text-muted-foreground mt-2">
          Phase 1 foundation is in place. Continue with the core content
          workflow setup.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Briefs</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/briefs">Open briefs</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Interviews</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/interviews">Open interviews</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Drafts</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/drafts">Open drafts</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/settings">Open settings</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
