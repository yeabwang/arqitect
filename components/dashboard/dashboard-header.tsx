"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { UserButton } from "@clerk/nextjs";

interface CrumbInfo {
  label: string;
  mono?: boolean;
}

function pathToCrumbs(pathname: string): CrumbInfo[] {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0 || segments[0] !== "dashboard") {
    return [{ label: "Dashboard" }];
  }

  if (segments.length === 1) return [{ label: "Home" }];

  const map: Record<string, string> = {
    designs: "Designs",
    templates: "Templates",
    agents: "Agents",
    team: "Team",
    usage: "Usage",
    "audit-logs": "Audit logs",
    storage: "Storage",
    settings: "Settings",
  };

  const top = segments[1];
  return [{ label: map[top] ?? top }];
}

export function DashboardHeader({
  workspaceName,
}: {
  workspaceName: string;
}) {
  const pathname = usePathname();
  const crumbs = pathToCrumbs(pathname);

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border-default bg-bg-base/80 px-6 backdrop-blur-md">
      <nav
        aria-label="Breadcrumb"
        className="flex min-w-0 items-center gap-2 text-[13px]"
      >
        <Link
          href="/dashboard"
          className="font-mono text-[12px] tracking-[0.04em] text-text-secondary hover:text-text-primary"
        >
          {workspaceName}
        </Link>
        {crumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-2 min-w-0">
            <ChevronRight className="h-3.5 w-3.5 text-text-faint shrink-0" />
            <span className="truncate text-text-primary">{crumb.label}</span>
          </span>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        <Link
          href="https://docs.trigger.dev"
          target="_blank"
          rel="noreferrer"
          className="hidden font-mono text-[11px] tracking-[0.12em] text-text-muted uppercase hover:text-text-secondary sm:inline"
        >
          Docs
        </Link>
        <UserButton
          appearance={{
            elements: { avatarBox: "h-8 w-8" },
          }}
        />
      </div>
    </header>
  );
}
