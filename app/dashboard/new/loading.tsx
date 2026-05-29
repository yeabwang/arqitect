import { Logo } from "@/components/brand/logo";

// Instant full-screen shell while the /dashboard/new route segment loads, so the
// transition from the dashboard feels immediate.
export default function NewDesignLoading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg-base" aria-hidden>
      <header className="flex items-center justify-between border-b border-border-default px-6 py-4">
        <Logo href="/dashboard" />
      </header>
      <div className="mx-auto grid w-full max-w-5xl flex-1 animate-pulse gap-10 px-6 py-12 lg:grid-cols-[1fr_240px]">
        <div className="flex flex-col gap-6">
          <div className="h-7 w-64 rounded bg-bg-elevated" />
          <div className="h-40 rounded-2xl border border-border-default bg-bg-surface" />
        </div>
        <div className="hidden h-48 rounded-xl bg-bg-surface lg:block" />
      </div>
    </div>
  );
}
