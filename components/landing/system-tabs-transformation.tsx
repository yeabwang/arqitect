"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface ChaosCard {
  id: string;
  tool: string;
  file: string;
  title: string;
  detail: string;
  className: string;
  kind: "sketch" | "figma" | "doc" | "photo" | "chat" | "terminal" | "ticket";
}

const chaosCards: ChaosCard[] = [
  {
    id: "slack",
    tool: "Slack",
    file: "#architecture",
    title: "which diagram is current?",
    detail: "decision buried in a thread",
    className:
      "left-[3%] bottom-[22%] z-[1] hidden w-[24vw] max-w-[310px] rotate-[5deg] opacity-80 md:block xl:left-[4%]",
    kind: "chat",
  },
  {
    id: "excalidraw",
    tool: "Excalidraw",
    file: "checkout-sketch",
    title: "browser? / api / orders",
    detail: "hand-drawn, already stale",
    className:
      "left-[2%] top-[45%] z-[2] w-[76vw] max-w-[400px] -rotate-[8deg] sm:left-[7%] sm:top-[43%] sm:w-[42vw] lg:left-[9%] lg:w-[31vw] xl:left-[10%]",
    kind: "sketch",
  },
  {
    id: "terminal",
    tool: "Terminal",
    file: "drift-check.log",
    title: "schema drift detected",
    detail: "no one updated the spec",
    className:
      "left-1/2 top-[55%] z-[1] hidden w-[28vw] max-w-[340px] -translate-x-1/2 rotate-[1deg] opacity-85 md:block",
    kind: "terminal",
  },
  {
    id: "figma",
    tool: "Figma",
    file: "checkout.v3.fig",
    title: "web → api? → stripe",
    detail: "demo layer, not the source",
    className:
      "right-[-9%] top-[51%] z-[2] w-[76vw] max-w-[410px] rotate-[5deg] sm:right-[7%] sm:top-[44%] sm:w-[42vw] lg:right-[9%] lg:w-[31vw] xl:right-[10%]",
    kind: "figma",
  },
  {
    id: "notion",
    tool: "Notion",
    file: "rfc-3-final-FINAL.md",
    title: "Checkout — RFC v3 (?)",
    detail: "last edited 2 mo ago",
    className:
      "left-[6%] bottom-[5%] z-[3] w-[68vw] max-w-[360px] rotate-[-3deg] sm:left-[16%] sm:bottom-[8%] sm:w-[36vw] lg:left-[18%] lg:w-[28vw]",
    kind: "doc",
  },
  {
    id: "whiteboard",
    tool: "whiteboard photo",
    file: "IMG_2384.jpg",
    title: "A → B? → C",
    detail: "photo from the review room",
    className:
      "right-[10%] bottom-[7%] z-[3] hidden w-[36vw] max-w-[370px] rotate-[7deg] sm:block lg:right-[18%] lg:w-[28vw]",
    kind: "photo",
  },
  {
    id: "linear",
    tool: "Linear",
    file: "incident-review",
    title: "owner: unresolved",
    detail: "ticket says the opposite",
    className:
      "right-[3%] bottom-[23%] z-[1] hidden w-[24vw] max-w-[315px] -rotate-[5deg] opacity-80 md:block xl:right-[4%]",
    kind: "ticket",
  },
];

const fragments = [
  { id: "f1", label: "Excalidraw", className: "left-[12%] top-[36%] h-20 w-36 -rotate-[10deg]" },
  { id: "f2", label: "api?", className: "left-[31%] top-[42%] h-16 w-28 rotate-[6deg]" },
  { id: "f3", label: "Notion", className: "left-[18%] top-[66%] h-14 w-44 rotate-[-4deg]" },
  { id: "f4", label: "Figma", className: "right-[30%] top-[37%] h-20 w-40 rotate-[4deg]" },
  { id: "f5", label: "Stripe", className: "right-[13%] top-[47%] h-14 w-32 rotate-[9deg]" },
  { id: "f6", label: "whiteboard", className: "right-[17%] bottom-[22%] hidden h-16 w-36 rotate-[-7deg] sm:block" },
  { id: "f7", label: "FINAL.md", className: "left-[35%] bottom-[20%] hidden h-12 w-40 rotate-[5deg] sm:block" },
  { id: "f8", label: "outdated", className: "right-[39%] bottom-[32%] hidden h-14 w-28 rotate-[-11deg] md:block" },
  { id: "f9", label: "Slack", className: "left-[8%] bottom-[30%] hidden h-12 w-32 rotate-[8deg] md:block" },
  { id: "f10", label: "drift.log", className: "left-[47%] top-[57%] hidden h-14 w-36 -rotate-[2deg] md:block" },
  { id: "f11", label: "Linear", className: "right-[8%] bottom-[29%] hidden h-12 w-32 -rotate-[8deg] md:block" },
];

function CardDiagram({ kind }: { kind: ChaosCard["kind"] }) {
  if (kind === "chat") {
    return (
      <div className="space-y-3 p-5">
        <div className="flex items-start gap-2">
          <div className="mt-1 h-5 w-5 rounded bg-border-default" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-2 w-28 rounded-full bg-text-secondary/50" />
            <div className="h-1.5 w-44 rounded-full bg-border-subtle" />
            <div className="h-1.5 w-32 rounded-full bg-border-default" />
          </div>
        </div>
        <div className="ml-7 rounded-lg border border-border-faint bg-bg-base/60 p-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-state-error">
            wait, which one?
          </div>
          <div className="mt-2 h-1.5 w-40 rounded-full bg-border-default" />
        </div>
        <div className="ml-2 flex items-center gap-2 text-[11px] text-text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-state-warning" />
          19 replies
        </div>
      </div>
    );
  }

  if (kind === "terminal") {
    return (
      <div className="space-y-3 p-5 font-mono text-[11px] leading-relaxed text-text-muted">
        <p className="text-text-secondary">$ diff canvas spec.md</p>
        <p>
          <span className="text-state-error">-</span> orders_db → stripe
        </p>
        <p>
          <span className="text-state-success">+</span> orders → queue
        </p>
        <div className="rounded-lg border border-border-faint bg-bg-base/70 p-3">
          <div className="mb-2 h-1.5 w-32 rounded-full bg-border-subtle" />
          <div className="h-1.5 w-44 rounded-full bg-border-default" />
        </div>
      </div>
    );
  }

  if (kind === "ticket") {
    return (
      <div className="grid h-full grid-cols-3 gap-2 p-4">
        {["todo", "doing", "blocked"].map((column, index) => (
          <div key={column} className="rounded-lg border border-border-faint bg-bg-base/50 p-2">
            <div className="mb-3 font-mono text-[8px] uppercase tracking-[0.14em] text-text-faint">
              {column}
            </div>
            <div
              className={`rounded-md border p-2 ${
                index === 2
                  ? "border-state-error/50 bg-state-error/10"
                  : "border-border-default bg-bg-surface"
              }`}
            >
              <div className="h-1.5 w-12 rounded-full bg-text-secondary/50" />
              <div className="mt-2 h-1.5 w-16 rounded-full bg-border-default" />
              <div className="mt-2 h-1.5 w-10 rounded-full bg-border-faint" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (kind === "doc") {
    return (
      <div className="space-y-3 p-5">
        <div className="h-4 w-48 rounded-sm bg-text-primary/90" />
        <div className="space-y-2">
          <div className="h-1.5 w-56 rounded-full bg-border-subtle" />
          <div className="h-1.5 w-44 rounded-full bg-border-subtle" />
          <div className="h-1.5 w-52 rounded-full bg-border-subtle" />
        </div>
        <div className="pt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-state-error">
          open questions
        </div>
        <div className="space-y-2">
          <div className="h-1.5 w-40 rounded-full bg-border-default" />
          <div className="h-1.5 w-48 rounded-full bg-border-default" />
          <div className="h-1.5 w-32 rounded-full bg-border-default" />
        </div>
      </div>
    );
  }

  if (kind === "photo") {
    return (
      <div className="relative h-full p-5 text-text-muted">
        <div className="absolute left-[18%] top-[25%] h-10 w-10 rounded-full border border-text-muted/60" />
        <div className="absolute left-[44%] top-[20%] h-10 w-10 rounded-full border border-text-muted/60" />
        <div className="absolute right-[16%] top-[33%] h-10 w-10 rounded-full border border-text-muted/60" />
        <div className="absolute left-[35%] bottom-[18%] h-10 w-10 rounded-full border border-text-muted/60" />
        <div className="absolute right-[23%] bottom-[15%] h-10 w-10 rounded-full border border-text-muted/60" />
        <svg className="absolute inset-0 h-full w-full text-text-faint" aria-hidden>
          <path d="M95 70L175 62L260 84M112 82L152 146M190 75L150 146M270 101L260 146M170 156L252 156M80 75L250 155" fill="none" stroke="currentColor" strokeDasharray="4 4" />
        </svg>
      </div>
    );
  }

  return (
    <div className="relative h-full p-5 text-text-muted">
      <svg className="h-full w-full" viewBox="0 0 260 140" aria-hidden>
        <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
          <rect x="16" y="22" width="68" height="34" rx="4" />
          <rect x="118" y="18" width="74" height="36" rx="4" />
          <rect x="42" y="88" width="88" height="34" rx="4" />
          <path d="M85 38C105 42 108 30 118 32" />
          <path d="M152 54C138 76 98 80 70 88" />
          {kind === "figma" ? (
            <>
              <rect x="188" y="88" width="44" height="34" rx="4" strokeDasharray="4 4" />
              <path d="M190 86L234 126M234 86L190 126" className="text-state-error" />
            </>
          ) : (
            <rect x="170" y="88" width="58" height="34" rx="4" />
          )}
        </g>
      </svg>
    </div>
  );
}

function ChaosCardView({ card }: { card: ChaosCard }) {
  return (
    <article
      className={`chaos-card absolute ${card.className}`}
      data-card={card.id}
    >
      <div className="overflow-hidden rounded-xl border border-border-default bg-bg-surface/95 shadow-[0_32px_90px_var(--shadow-overlay-72)] backdrop-blur">
        <div className="flex items-center gap-2 border-b border-border-faint px-3 py-2 font-mono text-[9px] uppercase tracking-[0.16em] text-text-faint">
          <span className="flex gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-text-faint" />
            <span className="h-1.5 w-1.5 rounded-full bg-border-subtle" />
            <span className="h-1.5 w-1.5 rounded-full bg-border-default" />
          </span>
          <span className="ml-1.5">{card.tool}</span>
          <span>/</span>
          <span className="truncate">{card.file}</span>
        </div>
        <div className="aspect-[13/7]">
          <CardDiagram kind={card.kind} />
        </div>
      </div>
      <div className="mt-2 rounded-lg border border-border-default bg-bg-elevated/90 px-3 py-2 shadow-[0_14px_40px_var(--shadow-overlay-58)]">
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-state-error">
          {card.title}
        </p>
        <p className="mt-1 text-[12px] italic leading-[1.35] text-text-secondary">
          {card.detail}
        </p>
      </div>
    </article>
  );
}

function ShatterFragments() {
  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {fragments.map((fragment) => (
        <div
          key={fragment.id}
          className={`shatter-fragment absolute rounded-lg border border-border-default bg-bg-elevated/95 p-3 font-mono text-[10px] uppercase tracking-[0.18em] text-text-secondary shadow-[0_24px_70px_var(--shadow-overlay-70)] ${fragment.className}`}
        >
          <span className="block h-1 w-10 rounded-full bg-state-error/70" />
          <span className="mt-4 block">{fragment.label}</span>
        </div>
      ))}
    </div>
  );
}

function ArchitectureCanvas() {
  return (
    <div className="architecture-canvas overflow-hidden rounded-xl border border-border-default bg-bg-canvas shadow-[0_44px_120px_var(--shadow-overlay-82)]">
      <div className="flex items-center gap-2 border-b border-border-faint bg-bg-surface/70 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
        <span className="flex gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-text-faint" />
          <span className="h-1.5 w-1.5 rounded-full bg-border-subtle" />
          <span className="h-1.5 w-1.5 rounded-full bg-border-default" />
        </span>
        <span className="ml-1.5">arqitect.dev</span>
        <span>/</span>
        <span className="text-text-secondary">checkout-v2 · canvas</span>
      </div>
      <div className="relative aspect-[1.35] w-[min(86vw,760px)] max-w-full">
        <div
          className="absolute inset-0 opacity-90"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, var(--canvas-dot-strong) 1px, transparent 0)",
            backgroundSize: "18px 18px",
          }}
          aria-hidden
        />
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 560 410" role="img" aria-label="Clean Arqitect architecture canvas">
          <defs>
            <marker id="system-tabs-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 z" fill="var(--border-subtle)" />
            </marker>
          </defs>
          <g className="architecture-edges" fill="none" stroke="var(--border-subtle)" strokeWidth="1.5" markerEnd="url(#system-tabs-arrow)">
            <path className="architecture-edge" d="M145 106H224" />
            <path className="architecture-edge" d="M336 106H420" />
            <path className="architecture-edge" d="M280 130V208" />
            <path className="architecture-edge" d="M280 256V314" />
            <path className="architecture-edge" d="M458 130V208" />
          </g>
          <g className="architecture-labels font-mono text-[10px] fill-text-muted">
            <text x="160" y="97">REST</text>
            <text x="350" y="97">webhook</text>
            <text x="292" y="177">sql</text>
            <text x="292" y="294">event</text>
          </g>
          {[
            ["Web", 74, 80, 72, 52],
            ["API", 224, 78, 112, 56],
            ["Stripe", 420, 80, 94, 52],
            ["Orders", 224, 208, 112, 56],
            ["DB", 420, 208, 94, 56],
            ["queue", 224, 314, 112, 44],
          ].map(([label, x, y, w, h]) => (
            <g key={String(label)} className="architecture-node">
              <rect
                x={Number(x)}
                y={Number(y)}
                width={Number(w)}
                height={Number(h)}
                rx={String(label) === "queue" ? 22 : 7}
                fill="var(--bg-surface)"
                stroke={String(label) === "API" ? "var(--text-primary)" : "var(--border-default)"}
                strokeDasharray={String(label) === "queue" ? "4 4" : undefined}
              />
              <text
                x={Number(x) + Number(w) / 2}
                y={Number(y) + Number(h) / 2 + 5}
                textAnchor="middle"
                className="fill-text-primary font-sans text-[17px] font-semibold"
              >
                {String(label)}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <div className="status-bar grid grid-cols-2 gap-px border-t border-border-faint bg-border-faint font-mono text-[11px]">
        <div className="flex items-center gap-2 bg-bg-surface px-4 py-3 text-text-secondary">
          <span className="h-1.5 w-1.5 rounded-full bg-state-success" />
          spec.md · in sync
        </div>
        <div className="flex items-center gap-2 bg-bg-surface px-4 py-3 text-text-secondary">
          <span className="text-text-primary">✦</span>
          AI · 0 issues
        </div>
      </div>
    </div>
  );
}

export function SystemTabsTransformation() {
  const sectionRef = useRef<HTMLElement | null>(null);

  useGSAP(
    () => {
      const root = sectionRef.current;
      if (!root) {
        return;
      }

      const cards = gsap.utils.toArray<HTMLElement>(".chaos-card");
      const fragmentEls = gsap.utils.toArray<HTMLElement>(".shatter-fragment");
      const edges = gsap.utils.toArray<SVGPathElement>(".architecture-edge");
      const nodes = gsap.utils.toArray<SVGGElement>(".architecture-node");
      const labels = gsap.utils.toArray<SVGTextElement>(".architecture-labels text");

      gsap.set(
        [...cards, ...fragmentEls, ".without-arqitect-scene", ".with-arqitect-scene", ".headline-break", ".status-bar"],
        {
          willChange: "transform, opacity",
        }
      );
      gsap.set(fragmentEls, { autoAlpha: 0, scale: 0.72, z: -80 });
      gsap.set(".with-arqitect-scene", { autoAlpha: 0, yPercent: 30, scale: 0.96 });
      gsap.set(".with-tag", { autoAlpha: 0, y: 12 });
      gsap.set(".status-bar", { autoAlpha: 0, y: 16 });
      gsap.set(nodes, { autoAlpha: 0, y: 16, scale: 0.96, transformOrigin: "50% 50%" });
      gsap.set(labels, { autoAlpha: 0 });
      edges.forEach((edge) => {
        const length = edge.getTotalLength();
        gsap.set(edge, { strokeDasharray: length, strokeDashoffset: length });
      });

      const mm = gsap.matchMedia(root);

      mm.add(
        {
          isDesktop: "(min-width: 768px)",
          isMobile: "(max-width: 767px)",
          reduceMotion: "(prefers-reduced-motion: reduce)",
        },
        (context) => {
          const { isMobile, reduceMotion } = context.conditions ?? {};
          const scrollTrigger = {
            trigger: root,
            start: "top top",
            end: "+=900",
            scrub: true,
            pin: true,
          };

          if (reduceMotion) {
            return gsap
              .timeline({ scrollTrigger })
              .to(".without-arqitect-scene", { autoAlpha: 0, yPercent: -6, duration: 0.55, ease: "none" }, 0.08)
              .to(".headline-break", { autoAlpha: 0, y: -18, duration: 0.5, ease: "none" }, 0.08)
              .to(".with-arqitect-scene", { autoAlpha: 1, yPercent: 0, scale: 1, duration: 0.75, ease: "none" }, 0.24)
              .to(".with-tag", { autoAlpha: 1, y: 0, duration: 0.35, ease: "none" }, 0.46)
              .to(nodes, { autoAlpha: 1, y: 0, scale: 1, stagger: 0.05, duration: 0.45, ease: "none" }, 0.54)
              .to(edges, { strokeDashoffset: 0, stagger: 0.05, duration: 0.45, ease: "none" }, 0.66)
              .to(labels, { autoAlpha: 1, stagger: 0.03, duration: 0.25, ease: "none" }, 0.78)
              .to(".status-bar", { autoAlpha: 1, y: 0, duration: 0.28, ease: "none" }, 0.84)
              .to({}, { duration: 0.22 });
          }

          const fragmentTravel = isMobile ? 420 : 780;

          return gsap
            .timeline({ scrollTrigger })
            .addLabel("break", 0)
            .to(".headline-break", { y: -8, duration: 0.18, ease: "none" }, "break")
            .to(
              cards,
              {
                x: () => gsap.utils.random(-6, 6),
                y: () => gsap.utils.random(-5, 5),
                rotation: "+=1.4",
                duration: 0.12,
                repeat: 2,
                yoyo: true,
                ease: "rough({ strength: 1, points: 8, template: none.out })",
              },
              "break+=0.06"
            )
            .to(fragmentEls, { autoAlpha: 1, scale: 1, z: 0, duration: 0.06 }, "break+=0.24")
            .to(".without-arqitect-scene", { scale: 0.985, y: -10, duration: 0.34, ease: "power2.inOut" }, "break+=0.24")
            .to(cards, { autoAlpha: 0, scale: 0.96, duration: 0.14, ease: "power1.in" }, "break+=0.28")
            .to(
              fragmentEls,
              {
                x: (index) => (index % 2 === 0 ? -1 : 1) * gsap.utils.random(fragmentTravel * 0.3, fragmentTravel),
                y: (index) => (index % 3 - 1) * gsap.utils.random(120, isMobile ? 280 : 420),
                z: () => gsap.utils.random(-260, 260),
                rotation: () => gsap.utils.random(-80, 80),
                rotationX: () => gsap.utils.random(-35, 35),
                filter: "blur(8px)",
                autoAlpha: 0,
                duration: 0.56,
                stagger: { amount: 0.1, from: "center" },
                ease: "power3.in",
              },
              "break+=0.32"
            )
            .to(".without-tag", { autoAlpha: 0, y: -14, duration: 0.22, ease: "power1.in" }, "break+=0.38")
            .to(".headline-break", { autoAlpha: 0, y: -34, scale: 0.97, duration: 0.46, ease: "power2.in" }, "break+=0.4")
            .addLabel("build", "break+=0.56")
            .to(".with-arqitect-scene", { autoAlpha: 1, yPercent: 0, scale: 1, duration: 0.82, ease: "expo.out" }, "build-=0.04")
            .to(".with-tag", { autoAlpha: 1, y: 0, duration: 0.32, ease: "power2.out" }, "build+=0.14")
            .to(nodes, { autoAlpha: 1, y: 0, scale: 1, stagger: 0.04, duration: 0.42, ease: "power2.out" }, "build+=0.22")
            .to(edges, { strokeDashoffset: 0, stagger: 0.04, duration: 0.46, ease: "power1.out" }, "build+=0.34")
            .to(labels, { autoAlpha: 1, stagger: 0.025, duration: 0.22, ease: "power1.out" }, "build+=0.5")
            .to(".status-bar", { autoAlpha: 1, y: 0, duration: 0.32, ease: "power2.out" }, "build+=0.56")
            .to({}, { duration: 0.24 });
        }
      );

      return () => mm.revert();
    },
    { scope: sectionRef }
  );

  return (
    <section
      id="use-cases"
      ref={sectionRef}
      className="system-tabs-transformation relative h-screen min-h-[720px] overflow-hidden border-t border-border-faint bg-bg-base"
      aria-label="Arqitect transforms scattered system tabs into a synchronized architecture canvas"
    >
      <div className="transformation-viewport relative h-screen min-h-[720px] overflow-hidden [perspective:1200px]">
        <div
          className="pointer-events-none absolute inset-0 opacity-80"
          style={{
            backgroundImage:
              "linear-gradient(to right, var(--grid-line) 1px, transparent 1px), linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[43vh] bg-gradient-to-b from-bg-base via-bg-base/95 to-transparent" aria-hidden />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-bg-base to-transparent" aria-hidden />

        <div className="headline-break absolute inset-x-6 top-[7vh] z-30 mx-auto max-w-[790px] text-center">
          <p className="mx-auto inline-flex items-center gap-2.5 rounded-full border border-border-default bg-bg-surface px-3 py-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-state-error" />
            Are you still doing this?
          </p>
          <h2 className="mt-5 font-sans text-[clamp(42px,6vw,76px)] font-semibold leading-[0.98] tracking-[-0.038em] text-text-primary text-balance">
            Your system lives
            <br />
            <span className="text-text-secondary line-through decoration-state-error/60 decoration-[3px]">
              in five different tabs.
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-[610px] text-[15.5px] leading-[1.65] text-text-secondary">
            Excalidraw for the sketch. Figma for the demo. Notion for the spec. A
            whiteboard photo for the rest. None of them agree.
          </p>
        </div>

        <div className="without-arqitect-scene absolute inset-0 z-10">
          <div className="without-tag pointer-events-none absolute left-5 top-[40vh] z-40 -rotate-[9deg] sm:left-[8vw] sm:top-[36vh] lg:left-[8vw]">
            <span className="inline-block border border-state-error/60 bg-bg-base/70 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-state-error">
              WITHOUT ARQITECT
            </span>
          </div>
          {chaosCards.map((card) => (
            <ChaosCardView key={card.id} card={card} />
          ))}
        </div>

        <ShatterFragments />

        <div className="with-arqitect-scene absolute inset-0 z-20 flex items-center justify-center px-4 pt-[8vh] sm:px-8">
          <div className="relative">
            <div className="with-tag pointer-events-none absolute -right-1 -top-5 z-10 rotate-[6deg] sm:-right-8">
              <span className="inline-flex items-center gap-1.5 border border-state-success/60 bg-bg-base/80 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-state-success">
                <span className="h-1.5 w-1.5 rounded-full bg-state-success" />
                WITH ARQITECT
              </span>
            </div>
            <ArchitectureCanvas />
          </div>
        </div>
      </div>
    </section>
  );
}
