import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AccessDenied() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        <div className="flex size-12 items-center justify-center rounded-2xl border border-border bg-card text-muted-foreground">
          <LockKeyhole className="h-5 w-5" />
        </div>
        <div className="space-y-1.5">
          <h1 className="text-lg font-medium text-foreground">Access denied</h1>
          <p className="text-sm text-muted-foreground">
            This workspace does not exist or you do not have access to it.
          </p>
        </div>
        <Link href="/editor" className={cn(buttonVariants())}>
          Back to editor
        </Link>
      </div>
    </main>
  );
}
