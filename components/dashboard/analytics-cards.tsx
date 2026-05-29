import type { LucideIcon } from "lucide-react";
import { Shapes, FileText, Bot, Users } from "lucide-react";

export interface AnalyticsCard {
  label: string;
  value: number;
  hint: string;
  icon: LucideIcon;
}

interface AnalyticsCardsProps {
  totalDesigns: number;
  totalSpecs: number;
  totalAiRuns: number;
  totalCollaborators: number;
}

/**
 * Workspace analytics row shown on the populated dashboard. These four are a
 * first pass — surfaced from data the dashboard already loads, so they add no
 * extra queries — and are expected to be refined as the product matures.
 */
export function AnalyticsCards({
  totalDesigns,
  totalSpecs,
  totalAiRuns,
  totalCollaborators,
}: AnalyticsCardsProps) {
  const cards: AnalyticsCard[] = [
    {
      label: "Designs",
      value: totalDesigns,
      hint: "Systems in your workspace",
      icon: Shapes,
    },
    {
      label: "Specs generated",
      value: totalSpecs,
      hint: "Markdown specs ready to hand off",
      icon: FileText,
    },
    {
      label: "AI design runs",
      value: totalAiRuns,
      hint: "Drafts by the AI co-architect",
      icon: Bot,
    },
    {
      label: "Collaborators",
      value: totalCollaborators,
      hint: "People with access to your designs",
      icon: Users,
    },
  ];

  return (
    <section
      aria-label="Workspace analytics"
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
    >
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="flex flex-col gap-3 rounded-2xl border border-border-default bg-bg-surface p-4"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] tracking-[0.18em] text-text-muted uppercase">
                {card.label}
              </span>
              <Icon className="h-4 w-4 text-text-faint" />
            </div>
            <span className="text-3xl font-semibold tabular-nums tracking-tight text-text-primary">
              {card.value}
            </span>
            <span className="text-xs text-text-muted">{card.hint}</span>
          </div>
        );
      })}
    </section>
  );
}
