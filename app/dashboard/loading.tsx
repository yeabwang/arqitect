// Streamed instantly while the dashboard server component fetches data, so
// navigation feels immediate instead of blocking on the remote database round
// trip. Mirrors the populated DashboardHome layout (header, analytics row,
// designs/activity grid).
export default function DashboardLoading() {
  return (
    <div className="flex animate-pulse flex-col gap-6" aria-hidden>
      <header className="flex flex-col gap-2">
        <div className="h-3 w-24 rounded bg-bg-surface" />
        <div className="h-7 w-64 rounded bg-bg-elevated" />
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-3 rounded-2xl border border-border-default bg-bg-surface p-4"
          >
            <div className="h-3 w-20 rounded bg-bg-elevated" />
            <div className="h-8 w-12 rounded bg-bg-elevated" />
            <div className="h-3 w-28 rounded bg-bg-elevated" />
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="h-64 rounded-2xl border border-border-default bg-bg-surface" />
        <div className="h-64 rounded-2xl border border-border-default bg-bg-surface" />
      </div>
    </div>
  );
}
