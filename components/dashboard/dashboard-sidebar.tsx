"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Shapes,
  LayoutTemplate,
  Bot,
  Users,
  BarChart3,
  ScrollText,
  HardDrive,
  Settings,
  Plus,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useDashboard } from "@/components/dashboard/dashboard-context";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  comingSoon?: boolean;
  badgeCount?: number;
}

export function DashboardSidebar() {
  const pathname = usePathname();
  const { openCreateDesign, invitationCount } = useDashboard();

  const build: NavItem[] = [
    { href: "/dashboard", label: "Home", icon: Home },
    {
      href: "/dashboard/designs",
      label: "Designs",
      icon: Shapes,
      badgeCount: invitationCount > 0 ? invitationCount : undefined,
    },
    {
      href: "/dashboard/templates",
      label: "Templates",
      icon: LayoutTemplate,
      comingSoon: true,
    },
    {
      href: "/dashboard/agents",
      label: "Agents",
      icon: Bot,
      comingSoon: true,
    },
  ];

  const manage: NavItem[] = [
    { href: "/dashboard/team", label: "Team", icon: Users, comingSoon: true },
    {
      href: "/dashboard/usage",
      label: "Usage",
      icon: BarChart3,
      comingSoon: true,
    },
    {
      href: "/dashboard/audit-logs",
      label: "Audit logs",
      icon: ScrollText,
      comingSoon: true,
    },
    {
      href: "/dashboard/storage",
      label: "Storage",
      icon: HardDrive,
      comingSoon: true,
    },
    {
      href: "/dashboard/settings",
      label: "Settings",
      icon: Settings,
      comingSoon: true,
    },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-56 flex-col border-r border-border-default bg-bg-surface">
      <div className="flex h-14 items-center gap-2 px-4 border-b border-border-faint">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-sm font-semibold tracking-tight text-text-primary"
        >
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-bg-elevated font-mono text-[12px] text-text-primary border border-border-default">
            A
          </span>
          <span className="font-mono text-[13px] tracking-[0.04em]">
            Arqitect
          </span>
        </Link>
      </div>

      <div className="px-3 py-3">
        <Button
          onClick={() => openCreateDesign("blank")}
          className="w-full justify-center gap-1.5"
          size="sm"
        >
          <Plus />
          New design
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-4">
        <NavGroup items={build} pathname={pathname} />
        <SectionLabel>Manage</SectionLabel>
        <NavGroup items={manage} pathname={pathname} />
      </nav>

      <div className="border-t border-border-faint p-3">
        <Link
          href="https://github.com/anthropics/claude-code/issues"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-text-muted hover:bg-bg-elevated hover:text-text-secondary"
        >
          <HelpCircle className="h-3.5 w-3.5" />
          Help & feedback
        </Link>
      </div>
    </aside>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-4 mb-1 px-2 font-mono text-[10px] tracking-[0.18em] text-text-faint uppercase">
      {children}
    </p>
  );
}

function NavGroup({
  items,
  pathname,
}: {
  items: NavItem[];
  pathname: string;
}) {
  return (
    <ul className="flex flex-col gap-0.5">
      {items.map((item) => {
        const active =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              className={cn(
                "group flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] transition-colors",
                active
                  ? "bg-bg-elevated text-text-primary"
                  : "text-text-secondary hover:bg-bg-elevated/60 hover:text-text-primary"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  active ? "text-text-primary" : "text-text-muted"
                )}
              />
              <span className="flex-1 truncate">{item.label}</span>
              {item.comingSoon ? (
                <span className="font-mono text-[9px] tracking-[0.12em] text-text-faint uppercase">
                  Soon
                </span>
              ) : null}
              {item.badgeCount ? (
                <span className="rounded-full bg-accent-primary-dim px-1.5 text-[10px] font-medium text-accent-primary">
                  {item.badgeCount}
                </span>
              ) : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
