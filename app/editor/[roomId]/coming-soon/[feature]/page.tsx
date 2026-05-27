import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Construction, Sparkles } from "lucide-react";
import { AccessDenied } from "@/components/editor/access-denied";
import {
  getCurrentProjectIdentity,
  getProjectWithAccess,
} from "@/lib/project-access";

interface ComingSoonPageProps {
  params: Promise<{ roomId: string; feature: string }>;
}

const FEATURE_COPY: Record<string, { title: string; description: string }> = {
  text: {
    title: "Text tools",
    description:
      "Rich canvas text blocks are queued for a later implementation pass.",
  },
  frames: {
    title: "Frames",
    description:
      "Frame-based organization will land after the core architecture canvas tools are stable.",
  },
  comments: {
    title: "Comments",
    description:
      "Threaded review notes will plug into the collaboration model in a future unit.",
  },
  "more-tools": {
    title: "More tools",
    description:
      "Additional canvas modes will collect here as the workspace grows.",
  },
};

export default async function ComingSoonPage({ params }: ComingSoonPageProps) {
  const identity = await getCurrentProjectIdentity();

  if (!identity.userId) {
    redirect("/sign-in");
  }

  const { roomId, feature } = await params;
  const project = await getProjectWithAccess(roomId, identity);

  if (!project) {
    return <AccessDenied />;
  }

  const copy = FEATURE_COPY[feature] ?? {
    title: "Canvas tool",
    description: "This tool is planned but not implemented yet.",
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <section className="w-full max-w-lg rounded-3xl border border-border-default bg-bg-elevated/90 p-6 shadow-2xl backdrop-blur-md">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-border-default bg-bg-subtle text-accent-primary">
            <Construction className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-accent-ai-text">
              <Sparkles className="h-3.5 w-3.5" />
              Coming soon
            </p>
            <h1 className="text-xl font-semibold text-text-primary">
              {copy.title}
            </h1>
            <p className="mt-2 text-sm leading-6 text-text-muted">
              {copy.description}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3 border-t border-border-default pt-4">
          <p className="truncate text-xs text-text-faint">{project.name}</p>
          <Link
            href={`/editor/${roomId}`}
            className="inline-flex h-9 shrink-0 items-center gap-2 rounded-xl bg-primary px-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to canvas
          </Link>
        </div>
      </section>
    </main>
  );
}
