import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/logo";

interface AuthShellProps {
  children: ReactNode;
}

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="relative flex min-h-screen flex-col bg-bg-base">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10 sm:py-6">
        <Logo href="/" />
        <Link
          href="/"
          className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-text-muted transition-colors hover:text-text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to home
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 pb-16 pt-4 sm:px-6">
        <div className="w-full max-w-[560px]">{children}</div>
      </main>
    </div>
  );
}
