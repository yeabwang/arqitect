import { Construction } from "lucide-react";

interface ComingSoonProps {
  title: string;
  description: string;
}

export function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border-default bg-bg-elevated">
        <Construction className="h-5 w-5 text-text-muted" />
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <p className="font-mono text-[10px] tracking-[0.18em] text-text-muted uppercase">
          Coming soon
        </p>
        <h1 className="text-2xl font-semibold text-text-primary">{title}</h1>
        <p className="max-w-md text-sm text-text-secondary">{description}</p>
      </div>
    </div>
  );
}
