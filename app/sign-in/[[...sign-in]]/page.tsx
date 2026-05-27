"use client";

import { SignIn } from "@clerk/nextjs";
import { Sparkles, Users, FileText } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-stretch bg-bg-base">
      {/* Left panel — hidden on small screens, 50% on large */}
      <div className="hidden flex-1 flex-col justify-between bg-bg-surface px-14 py-10 lg:flex">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent-primary">
            <span className="text-[11px] font-bold text-bg-base">A</span>
          </div>
          <span className="text-sm font-medium text-text-primary">Arqitect</span>
        </div>

        <div className="max-w-md">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-text-primary">
            Design systems at the
            <br />
            speed of thought.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-text-secondary">
            Describe your architecture in plain English. Arqitect maps it to a
            shared canvas your whole team can refine in real time.
          </p>

          <ul className="mt-10 space-y-6">
            <li className="flex gap-3">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-text-secondary" />
              <div>
                <div className="text-sm font-medium text-text-primary">
                  AI Architecture Generation
                </div>
                <p className="mt-1 text-xs leading-relaxed text-text-muted">
                  Describe your system. AI maps it to nodes and edges on a live canvas.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <Users className="mt-0.5 h-4 w-4 shrink-0 text-text-secondary" />
              <div>
                <div className="text-sm font-medium text-text-primary">
                  Real-time Collaboration
                </div>
                <p className="mt-1 text-xs leading-relaxed text-text-muted">
                  Live cursors, presence indicators, and shared node editing across your team.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-text-secondary" />
              <div>
                <div className="text-sm font-medium text-text-primary">
                  Instant Spec Generation
                </div>
                <p className="mt-1 text-xs leading-relaxed text-text-muted">
                  Export a complete Markdown technical spec directly from the canvas graph.
                </p>
              </div>
            </li>
          </ul>
        </div>

        <p className="text-xs text-text-faint">
          © {new Date().getFullYear()} Arqitect. All rights reserved.
        </p>
      </div>

      {/* Right panel — Clerk form, 50% on large, black bg */}
      <div className="flex flex-1 items-center justify-center bg-bg-base p-4 lg:border-l lg:border-border-default">
        <SignIn
          appearance={{
            elements: {
              rootBox: "w-full! max-w-[440px]!",
              cardBox:
                "w-full! shadow-2xl! shadow-black/40! transition-shadow! duration-300! hover:shadow-[0_0_40px_-8px_var(--accent-primary-dim)]!",
              card: "bg-bg-surface/80! border! border-border-default! rounded-2xl! p-8! backdrop-blur-sm! transition-colors! duration-300! hover:border-border-subtle!",
              formFieldInput:
                "h-16! px-5! py-5! text-sm! rounded-xl! bg-bg-surface! border! border-border-default! focus:border-accent-primary!",
              formFieldLabel: "text-sm! font-medium! text-text-secondary! mb-2!",
              formButtonPrimary:
                "h-10! text-sm! font-semibold! rounded-lg! tracking-wide!",
              socialButtonsBlockButton:
                "h-11! text-sm! font-medium! rounded-lg! border-border-default!",
            },
          }}
        />
      </div>
    </div>
  );
}
