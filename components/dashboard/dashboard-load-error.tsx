import Link from "next/link";

export function DashboardLoadError() {
  return (
    <section className="flex min-h-[60vh] items-center justify-center">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border-default bg-bg-surface font-mono text-sm text-text-muted">
          DB
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-semibold tracking-tight text-text-primary">
            Dashboard data is unavailable.
          </h1>
          <p className="text-sm leading-6 text-text-secondary">
            Arqitect could not reach the project database. Your designs are not
            changed; try loading the dashboard again.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex h-10 items-center justify-center rounded-xl border border-border-default px-4 text-sm font-medium text-text-primary transition-colors hover:border-border-hover hover:bg-bg-elevated"
        >
          Retry dashboard
        </Link>
      </div>
    </section>
  );
}
