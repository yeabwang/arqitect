import Link from "next/link";
import type { SVGProps } from "react";

function LogoMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <rect x="0" y="5" width="8" height="4" fill="currentColor" />
      <rect x="4" y="10" width="8" height="4" fill="currentColor" />
      <rect x="8" y="15" width="8" height="4" fill="currentColor" />
    </svg>
  );
}

function ArrowRightIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function PlayIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M6 4l14 8-14 8V4z" />
    </svg>
  );
}

function CheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M5 12l4 4 10-10" />
    </svg>
  );
}

function SparkIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M12 3l1.5 5L18 9.5 13.5 11 12 16l-1.5-5L6 9.5 10.5 8 12 3z" />
      <path d="M19 16l.7 1.8 1.8.7-1.8.7L19 21l-.7-1.8-1.8-.7 1.8-.7L19 16z" />
    </svg>
  );
}

const SECTION_PADDING = "border-t border-border-faint px-6 py-24 sm:py-28";

function SectionHead({
  eyebrow,
  title,
  sub,
}: {
  eyebrow: string;
  title: React.ReactNode;
  sub?: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-[760px] text-center">
      <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
        {eyebrow}
      </p>
      <h2 className="mt-4 font-sans text-[clamp(32px,4.2vw,52px)] font-semibold leading-[1.04] tracking-[-0.032em] text-text-primary text-balance">
        {title}
      </h2>
      {sub ? (
        <p className="mx-auto mt-5 max-w-[560px] text-[15.5px] leading-[1.65] text-text-secondary text-pretty">
          {sub}
        </p>
      ) : null}
    </div>
  );
}

function GlyphLogo() {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="Arqitect home">
      <LogoMark className="h-5 w-5 text-text-primary" />
      <span className="font-sans text-[13px] font-semibold tracking-[0.14em] text-text-primary">
        ARQITECT<span className="text-text-muted">.</span>
      </span>
    </Link>
  );
}

function TopNav() {
  const links = [
    { href: "#product", label: "Product" },
    { href: "#how", label: "How it works" },
    { href: "#use-cases", label: "Use cases" },
    { href: "#pricing", label: "Pricing" },
  ];
  return (
    <header className="sticky top-0 z-50 border-b border-border-faint bg-bg-base/72 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between gap-6 px-6">
        <GlyphLogo />
        <nav className="hidden items-center md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="px-3.5 py-2 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-text-muted transition-colors hover:text-text-primary"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-1.5">
          <Link
            href="/sign-in"
            className="hidden px-3 py-2 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-text-muted transition-colors hover:text-text-primary sm:inline-flex"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="inline-flex h-9 items-center gap-2 rounded-md bg-text-primary px-3.5 text-[13px] font-medium text-text-on-white text-bg-base transition-colors hover:bg-[#E8E8E8]"
          >
            Get started
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function Eyebrow() {
  return (
    <span className="inline-flex items-center gap-2.5 rounded-full border border-border-default bg-bg-surface px-3 py-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-text-muted">
      <span className="h-1.5 w-1.5 rounded-full bg-state-success" />
      <span>Prompt → canvas → spec</span>
    </span>
  );
}

function Hero() {
  return (
    <section className="relative px-6 pt-20 pb-16 sm:pt-24 sm:pb-20" data-reveal>
      <div className="mx-auto max-w-[1280px]">
        <div className="mx-auto max-w-[880px] text-center">
          <Eyebrow />
          <h1 className="mt-7 font-sans text-[clamp(48px,7vw,92px)] font-semibold leading-[0.96] tracking-[-0.04em] text-text-primary text-balance">
            Design systems
            <br />
            <span className="text-text-secondary">an AI can read.</span>
          </h1>
          <p className="mx-auto mt-7 max-w-[560px] text-[17px] leading-[1.55] text-text-secondary text-pretty">
            Describe a system. Arqitect draws it on a shared canvas, an AI co-architect
            refines it with you, and the spec writes itself.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
            <Link
              href="/sign-up"
              className="inline-flex h-11 items-center gap-2.5 rounded-md bg-text-primary px-4.5 text-[13px] font-medium text-bg-base transition-colors hover:bg-[#E8E8E8]"
            >
              Get started
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
            <a
              href="#how"
              className="inline-flex h-11 items-center gap-2.5 rounded-md border border-border-subtle bg-transparent px-4.5 text-[13px] font-medium text-text-primary transition-colors hover:border-[#3A3A3A] hover:bg-bg-surface"
            >
              <PlayIcon className="h-3.5 w-3.5" />
              See it in action
            </a>
          </div>
        </div>

        <ProductStage />

        <div className="mx-auto mt-7 flex max-w-[920px] flex-col items-center justify-center gap-3 border-y border-border-faint py-3.5 font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted md:flex-row md:gap-10">
          <span>Draft together</span>
          <span className="hidden h-1 w-1 rounded-full bg-text-faint md:block" />
          <span>Catch issues early</span>
          <span className="hidden h-1 w-1 rounded-full bg-text-faint md:block" />
          <span>Export the spec</span>
        </div>
      </div>
    </section>
  );
}

function ToolRailIcon({ kind, className }: { kind: string; className?: string }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true,
  };
  switch (kind) {
    case "select":
      return (
        <svg {...common}>
          <path d="M4 4l16 16M4 4v8M4 4h8" />
        </svg>
      );
    case "hand":
      return (
        <svg {...common}>
          <path d="M8 13V5a1.5 1.5 0 0 1 3 0v6" />
          <path d="M11 11V4a1.5 1.5 0 0 1 3 0v7" />
          <path d="M14 11V6a1.5 1.5 0 0 1 3 0v9" />
          <path d="M17 11a1.5 1.5 0 0 1 3 0v5a5 5 0 0 1-5 5h-2c-2 0-3-1-4-2l-4-4a1.5 1.5 0 0 1 2-2l1 1V11" />
        </svg>
      );
    case "shapes":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="8" height="8" rx="1" />
          <circle cx="17" cy="7" r="4" />
          <path d="M8 17l4 4 4-4-4-4z" />
        </svg>
      );
    case "connector":
      return (
        <svg {...common}>
          <circle cx="6" cy="6" r="2" />
          <circle cx="18" cy="18" r="2" />
          <path d="M7.5 7.5l9 9" />
        </svg>
      );
    case "text":
      return (
        <svg {...common}>
          <path d="M5 5h14M12 5v14M9 19h6" />
        </svg>
      );
    case "comment":
      return (
        <svg {...common}>
          <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-7l-4 4v-4H6a2 2 0 0 1-2-2V6z" />
        </svg>
      );
    case "ai":
      return (
        <svg {...common}>
          <path d="M12 3l1.5 5L18 9.5 13.5 11 12 16l-1.5-5L6 9.5 10.5 8 12 3z" />
          <path d="M19 16l.7 1.8 1.8.7-1.8.7L19 21l-.7-1.8-1.8-.7 1.8-.7L19 16z" />
        </svg>
      );
    default:
      return null;
  }
}

function NodeIcon({ kind, color }: { kind: string; color?: string }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color ?? "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (kind) {
    case "web":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="14" rx="1.5" />
          <path d="M3 9h18" />
          <path d="M9 21h6M12 18v3" />
        </svg>
      );
    case "cdn":
      return (
        <svg {...common}>
          <path d="M7 18a5 5 0 0 1-1-9.9A6 6 0 0 1 17.5 9 4 4 0 0 1 17 18H7z" />
        </svg>
      );
    case "gateway":
      return (
        <svg {...common}>
          <path d="M5 21h14" />
          <path d="M5 21V8l7-5 7 5v13" />
          <path d="M10 21v-7h4v7" />
        </svg>
      );
    case "service":
      return (
        <svg {...common}>
          <rect x="5" y="5" width="14" height="14" rx="1.5" />
          <circle cx="5" cy="12" r="1.5" />
          <circle cx="19" cy="12" r="1.5" />
          <circle cx="12" cy="5" r="1.5" />
          <circle cx="12" cy="19" r="1.5" />
        </svg>
      );
    case "database":
      return (
        <svg {...common}>
          <ellipse cx="12" cy="5" rx="8" ry="3" />
          <path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
          <path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
        </svg>
      );
    case "cache":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M13 6l-3 7h4l-3 8" />
        </svg>
      );
    case "queue":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="3" height="14" rx="0.5" />
          <rect x="10.5" y="5" width="3" height="14" rx="0.5" />
          <rect x="18" y="5" width="3" height="14" rx="0.5" />
        </svg>
      );
    case "payment":
      return (
        <svg {...common}>
          <rect x="2" y="6" width="20" height="13" rx="1.5" />
          <path d="M2 11h20" />
          <path d="M6 15h3M12 15h3" />
        </svg>
      );
    case "auth":
      return (
        <svg {...common}>
          <path d="M12 3l8 3v6c0 4-3.5 8-8 9-4.5-1-8-5-8-9V6l8-3z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );
    default:
      return null;
  }
}

interface DemoNode {
  x: number;
  y: number;
  w?: number;
  h?: number;
  icon: string;
  title: string;
  meta: string;
  status?: "healthy" | "spof" | "live" | "suggested" | "cached" | "connected";
  statusLabel?: string;
  detail?: string;
  streaming?: boolean;
  selected?: boolean;
}

function statusColor(status?: DemoNode["status"]) {
  switch (status) {
    case "spof":
      return "#E07474";
    case "live":
      return "#20D7E8";
    case "suggested":
      return "#A1A1A1";
    case "cached":
    case "healthy":
    case "connected":
      return "#6FC079";
    default:
      return "#6E6E6E";
  }
}

function CanvasNodeBlock({ node }: { node: DemoNode }) {
  const w = node.w ?? 130;
  const h = node.h ?? 80;
  const stroke = node.streaming
    ? "#20D7E8"
    : node.status === "spof"
      ? "#E07474"
      : node.status === "suggested"
        ? "#2A2A2A"
        : "#1F1F1F";
  const dashed = node.status === "suggested";
  return (
    <g transform={`translate(${node.x} ${node.y})`}>
      <rect
        width={w}
        height={h}
        rx={6}
        fill="#0A0A0A"
        stroke={stroke}
        strokeDasharray={dashed ? "3 3" : undefined}
      />
      <g transform="translate(10 10)" color={node.streaming ? "#20D7E8" : "#FFFFFF"}>
        <NodeIcon kind={node.icon} />
      </g>
      <text
        x={34}
        y={20}
        fontFamily="Inter"
        fontSize="11"
        fontWeight="600"
        fill={node.status === "suggested" ? "#A1A1A1" : "#FFFFFF"}
      >
        {node.title}
      </text>
      <text x={34} y={33} fontFamily="JetBrains Mono" fontSize="9" fill={node.streaming ? "#20D7E8" : "#6E6E6E"}>
        {node.meta}
      </text>
      {h >= 60 ? (
        <>
          <line x1={10} y1={48} x2={w - 10} y2={48} stroke="#141414" />
          <text
            x={10}
            y={62}
            fontFamily="JetBrains Mono"
            fontSize="9"
            fill={statusColor(node.status)}
          >
            <tspan>● </tspan>
            <tspan fill={statusColor(node.status)}>{node.statusLabel ?? node.status}</tspan>
          </text>
          {node.detail ? (
            <text x={10} y={74} fontFamily="JetBrains Mono" fontSize="9" fill="#6E6E6E">
              {node.detail}
            </text>
          ) : null}
        </>
      ) : null}
      {node.selected ? (
        <g>
          <rect width={w} height={h} rx={6} fill="none" stroke="#FFFFFF" strokeWidth={1} strokeDasharray="2 3" />
          <circle cx={0} cy={0} r={2.5} fill="#FFFFFF" />
          <circle cx={w} cy={0} r={2.5} fill="#FFFFFF" />
          <circle cx={0} cy={h} r={2.5} fill="#FFFFFF" />
          <circle cx={w} cy={h} r={2.5} fill="#FFFFFF" />
        </g>
      ) : null}
    </g>
  );
}

function ProductStage() {
  const tools: Array<{ kind: string; label: string; active?: boolean; accent?: boolean }> = [
    { kind: "select", label: "Select", active: true },
    { kind: "hand", label: "Pan" },
    { kind: "shapes", label: "Shapes" },
    { kind: "connector", label: "Connector" },
    { kind: "text", label: "Text" },
    { kind: "comment", label: "Comment" },
    { kind: "ai", label: "Architect", accent: true },
  ];

  const nodes: DemoNode[] = [
    { x: 70, y: 28, w: 110, h: 40, icon: "web", title: "Browser", meta: "next.js · ssr" },
    {
      x: 70,
      y: 96,
      w: 110,
      h: 80,
      icon: "cdn",
      title: "CDN",
      meta: "cloudflare",
      status: "cached",
      statusLabel: "cached",
      detail: "edge · 12 pop",
    },
    {
      x: 70,
      y: 208,
      w: 150,
      h: 84,
      icon: "gateway",
      title: "API gateway",
      meta: "REST · 8 routes",
      status: "healthy",
      statusLabel: "healthy · p99 8ms",
      detail: "jwt · rate-limited",
    },
    {
      x: 290,
      y: 110,
      w: 130,
      h: 80,
      icon: "auth",
      title: "Auth",
      meta: "go · jwt+pkce",
      status: "healthy",
      detail: "3 replicas",
    },
    {
      x: 290,
      y: 208,
      w: 130,
      h: 84,
      icon: "service",
      title: "Checkout",
      meta: "drafting…",
      status: "live",
      statusLabel: "drafting",
      detail: "idempotency-key",
      streaming: true,
      selected: true,
    },
    {
      x: 290,
      y: 308,
      w: 130,
      h: 80,
      icon: "service",
      title: "Orders",
      meta: "go · stateful",
      status: "healthy",
      detail: "2 replicas",
    },
    {
      x: 510,
      y: 110,
      w: 150,
      h: 80,
      icon: "payment",
      title: "Stripe",
      meta: "external · webhook",
      status: "connected",
      detail: "api 2024-08-22",
    },
    {
      x: 510,
      y: 208,
      w: 150,
      h: 84,
      icon: "database",
      title: "Orders DB",
      meta: "postgres 16",
      status: "healthy",
      statusLabel: "24 tables",
      detail: "multi-az",
    },
    {
      x: 510,
      y: 308,
      w: 150,
      h: 80,
      icon: "cache",
      title: "Sessions",
      meta: "redis 7 · ttl 24h",
      status: "spof",
      statusLabel: "SPOF · no replica",
      detail: "high severity",
    },
    {
      x: 550,
      y: 402,
      w: 150,
      h: 50,
      icon: "queue",
      title: "Order events",
      meta: "suggested · sqs",
      status: "suggested",
    },
    {
      x: 720,
      y: 130,
      w: 130,
      h: 80,
      icon: "database",
      title: "Read replica",
      meta: "postgres · ro",
      status: "healthy",
      statusLabel: "lag 40ms",
    },
    {
      x: 720,
      y: 232,
      w: 130,
      h: 60,
      icon: "auth",
      title: "Tokens",
      meta: "vault · kv",
      detail: "2h ttl",
    },
  ];

  return (
    <div className="relative mt-14 overflow-hidden rounded-xl border border-border-default bg-bg-canvas shadow-[0_24px_80px_rgba(0,0,0,0.6)]">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)",
          backgroundSize: "22px 22px",
        }}
        aria-hidden
      />

      <div className="relative flex h-10 items-center justify-between border-b border-border-faint bg-gradient-to-b from-black/65 to-transparent px-4 font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">
        <div className="flex items-center gap-4 min-w-0">
          <span className="truncate text-text-secondary">
            acme<span className="mx-2 text-text-faint">/</span>checkout-v2
            <span className="mx-2 text-text-faint">/</span>
            <span className="text-text-primary">canvas</span>
          </span>
          <span className="hidden sm:inline">21 nodes</span>
          <span className="hidden sm:inline text-text-faint">·</span>
          <span className="hidden sm:inline">28 edges</span>
        </div>
        <div className="flex items-center gap-2 text-accent-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-primary shadow-[0_0_0_3px_rgba(32,215,232,0.18)]" />
          <span>Architect · streaming</span>
        </div>
      </div>

      <aside className="absolute left-3.5 top-14 z-10 hidden flex-col gap-0.5 rounded-md border border-border-default bg-bg-surface/85 p-1.5 backdrop-blur md:flex">
        {tools.map((t, i) => (
          <span key={t.kind} className="contents">
            {(i === 2 || i === 5) ? (
              <span className="my-1 h-px bg-border-faint" aria-hidden />
            ) : null}
            <button
              type="button"
              title={t.label}
              tabIndex={-1}
              className={
                "flex h-8 w-8 items-center justify-center rounded-sm transition-colors " +
                (t.active
                  ? "border border-border-default bg-bg-elevated text-text-primary"
                  : t.accent
                    ? "text-text-primary hover:bg-bg-elevated"
                    : "text-text-muted hover:bg-bg-elevated hover:text-text-primary")
              }
            >
              <ToolRailIcon kind={t.kind} className="h-4 w-4" />
            </button>
          </span>
        ))}
      </aside>

      <div className="relative h-[520px] w-full md:h-[600px]">
        <svg
          className="absolute inset-x-0 top-0 h-full w-full"
          viewBox="0 0 880 480"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Live architecture canvas drafting a checkout flow with services, databases, queues, and an AI architect review"
        >
          <defs>
            <marker id="ls-ar" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 z" fill="#3A3A3A" />
            </marker>
            <marker id="ls-ar-cy" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 z" fill="#20D7E8" />
            </marker>
          </defs>

          <g>
            <rect x="270" y="100" width="400" height="300" rx="8" fill="none" stroke="#161616" strokeDasharray="4 4" />
            <text x="282" y="118" fontFamily="JetBrains Mono" fontSize="9" fill="#4A4A4A" letterSpacing="2">
              SERVICES · GO 1.22
            </text>
          </g>

          <g fill="none" stroke="#2A2A2A" strokeWidth="1.25">
            <path d="M125 68 V 96" markerEnd="url(#ls-ar)" />
            <path d="M125 176 V 208" markerEnd="url(#ls-ar)" />
            <path d="M220 250 H 290 V 150" markerEnd="url(#ls-ar)" />
            <path d="M220 250 H 290 V 250" markerEnd="url(#ls-ar)" />
            <path d="M220 250 H 290 V 350" markerEnd="url(#ls-ar)" />
            <path d="M420 150 H 510" markerEnd="url(#ls-ar)" />
            <path d="M420 250 H 510" markerEnd="url(#ls-ar)" />
            <path d="M420 350 H 510 V 350" markerEnd="url(#ls-ar)" />
            <path d="M660 250 H 720 V 170" markerEnd="url(#ls-ar)" />
            <path d="M660 250 H 720 V 262" markerEnd="url(#ls-ar)" />
          </g>

          <path
            d="M420 250 C 460 250, 480 425, 550 425"
            fill="none"
            stroke="#20D7E8"
            strokeWidth="1.25"
            strokeDasharray="4 4"
            markerEnd="url(#ls-ar-cy)"
          >
            <animate attributeName="stroke-dashoffset" from="0" to="-16" dur="1s" repeatCount="indefinite" />
          </path>

          <g fontFamily="JetBrains Mono" fontSize="9" fill="#6E6E6E">
            <g transform="translate(228 240)">
              <rect width="42" height="14" rx="3" fill="#050505" stroke="#1F1F1F" />
              <text x="6" y="10">REST</text>
            </g>
            <g transform="translate(440 240)">
              <rect width="36" height="14" rx="3" fill="#050505" stroke="#1F1F1F" />
              <text x="6" y="10">sql</text>
            </g>
            <g transform="translate(450 340)">
              <rect width="54" height="14" rx="3" fill="#050505" stroke="#20D7E8" />
              <text x="6" y="10" fill="#20D7E8">event</text>
            </g>
          </g>

          {nodes.map((n) => (
            <CanvasNodeBlock key={`${n.title}-${n.x}-${n.y}`} node={n} />
          ))}

          <g transform="translate(688 388)">
            <path
              d="M0 0L4 14L7 9L12 8L0 0Z"
              fill="#FFFFFF"
              stroke="#0A0A0A"
              strokeWidth="0.5"
            />
            <g transform="translate(12 12)">
              <rect width="58" height="16" rx="3" fill="#FFFFFF" />
              <text x="6" y="11" fontFamily="JetBrains Mono" fontSize="9" fontWeight="600" fill="#000">
                Arqitect
              </text>
            </g>
          </g>
        </svg>

        <aside className="absolute right-3.5 top-14 z-10 hidden w-[280px] flex-col overflow-hidden rounded-md border border-border-default bg-bg-surface/92 backdrop-blur md:flex">
          <div className="flex items-center gap-2 border-b border-border-faint px-3 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-text-secondary">
            <SparkIcon className="h-3.5 w-3.5 text-text-primary" />
            <span>Arqitect</span>
            <span className="ml-auto flex items-center gap-1.5 text-accent-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-primary" />
              Streaming
            </span>
          </div>
          <div className="space-y-1.5 px-3.5 py-3 font-mono text-[11.5px] leading-[1.65] text-text-secondary">
            <p className="text-text-muted">
              &gt; draft <span className="text-text-primary">checkout flow</span>
            </p>
            <p>
              added <span className="text-text-primary">Checkout</span> service
            </p>
            <p>
              linked → <span className="text-text-primary">Stripe</span> via webhook
            </p>
            <p>
              <span className="text-state-success">✓</span> contract{" "}
              <span className="text-text-primary">POST /checkout</span>
            </p>
            <p>
              <span className="text-state-warning">⚠</span> assumed idempotency-key header
            </p>
            <p>
              <span className="text-state-error">●</span>{" "}
              <span className="text-text-primary">Sessions</span> is a SPOF
            </p>
            <p>
              suggested <span className="text-text-primary">Order events</span> queue
            </p>
            <p className="text-text-muted">
              awaiting input
              <span className="ml-1 inline-block h-3 w-1.5 translate-y-0.5 animate-pulse bg-accent-primary align-middle" />
            </p>
          </div>
          <div className="flex items-center gap-2 border-t border-border-faint px-3 py-2.5 font-mono text-[11px] text-text-muted">
            <span>&gt;</span>
            <span className="flex-1 truncate text-text-secondary">ask the architect…</span>
            <span>⌘↵</span>
          </div>
        </aside>

        <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">
          <span>last save · just now</span>
          <div className="flex items-center gap-4">
            <span>canvas v0.4.2</span>
            <span className="hidden text-state-success md:inline">✓ spec in sync</span>
            <span>100%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepPromptDrawing() {
  return (
    <svg viewBox="0 0 280 140" className="w-full" role="img" aria-label="A prompt being typed into the architect input">
      <rect x="8" y="20" width="264" height="100" rx="8" fill="#0A0A0A" stroke="#1F1F1F" />
      <text x="22" y="42" fontFamily="JetBrains Mono" fontSize="9" fill="#6E6E6E" letterSpacing="2">
        ASK THE ARCHITECT
      </text>
      <line x1="22" y1="52" x2="258" y2="52" stroke="#141414" />
      <text x="22" y="72" fontFamily="JetBrains Mono" fontSize="11" fill="#FFFFFF">
        Build a checkout flow with
      </text>
      <text x="22" y="88" fontFamily="JetBrains Mono" fontSize="11" fill="#FFFFFF">
        Stripe, idempotent orders,
      </text>
      <text x="22" y="104" fontFamily="JetBrains Mono" fontSize="11" fill="#FFFFFF">
        and an audit log.
        <tspan dx="2" fill="#20D7E8">▍</tspan>
      </text>
    </svg>
  );
}

function StepCanvasDrawing() {
  return (
    <svg viewBox="0 0 280 140" className="w-full" role="img" aria-label="A small canvas with services connecting to a database and queue">
      <defs>
        <marker id="step-ar" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 z" fill="#3A3A3A" />
        </marker>
      </defs>
      <pattern id="step-dot" width="14" height="14" patternUnits="userSpaceOnUse">
        <circle cx="1" cy="1" r="0.8" fill="rgba(255,255,255,0.06)" />
      </pattern>
      <rect x="8" y="8" width="264" height="124" rx="8" fill="url(#step-dot)" stroke="#1F1F1F" />
      <g fill="none" stroke="#2A2A2A" strokeWidth="1.1">
        <path d="M70 40 H 130" markerEnd="url(#step-ar)" />
        <path d="M170 40 H 220" markerEnd="url(#step-ar)" />
        <path d="M150 56 V 88" markerEnd="url(#step-ar)" />
        <path d="M70 100 H 130" markerEnd="url(#step-ar)" />
      </g>
      <g fontFamily="Inter" fontSize="9" fontWeight="600" fill="#FFFFFF">
        <g transform="translate(28 26)">
          <rect width="44" height="28" rx="4" fill="#0A0A0A" stroke="#1F1F1F" />
          <text x="22" y="17" textAnchor="middle">Web</text>
        </g>
        <g transform="translate(128 26)">
          <rect width="44" height="28" rx="4" fill="#0A0A0A" stroke="#FFFFFF" strokeDasharray="2 3" />
          <text x="22" y="17" textAnchor="middle">API</text>
        </g>
        <g transform="translate(218 26)">
          <rect width="44" height="28" rx="4" fill="#0A0A0A" stroke="#1F1F1F" />
          <text x="22" y="17" textAnchor="middle">Pay</text>
        </g>
        <g transform="translate(128 86)">
          <rect width="44" height="28" rx="4" fill="#0A0A0A" stroke="#1F1F1F" />
          <text x="22" y="17" textAnchor="middle">DB</text>
        </g>
        <g transform="translate(28 86)">
          <rect width="44" height="28" rx="4" fill="#0A0A0A" stroke="#2A2A2A" strokeDasharray="2 2" />
          <text x="22" y="17" textAnchor="middle" fill="#A1A1A1">Queue</text>
        </g>
      </g>
    </svg>
  );
}

function StepSpecDrawing() {
  return (
    <svg viewBox="0 0 280 140" className="w-full" role="img" aria-label="Generated Markdown specification">
      <rect x="8" y="8" width="264" height="124" rx="8" fill="#050505" stroke="#1F1F1F" />
      <text x="22" y="30" fontFamily="JetBrains Mono" fontSize="11" fontWeight="600" fill="#FFFFFF">
        # Checkout v2
      </text>
      <text x="22" y="50" fontFamily="JetBrains Mono" fontSize="9" fill="#6E6E6E">
        ## Components
      </text>
      <text x="22" y="64" fontFamily="JetBrains Mono" fontSize="9" fill="#A1A1A1">
        - Web → API → Payments
      </text>
      <text x="22" y="78" fontFamily="JetBrains Mono" fontSize="9" fill="#A1A1A1">
        - API → Orders DB (sql)
      </text>
      <text x="22" y="92" fontFamily="JetBrains Mono" fontSize="9" fill="#A1A1A1">
        - API → Queue (suggested)
      </text>
      <text x="22" y="110" fontFamily="JetBrains Mono" fontSize="9" fill="#6E6E6E">
        ## Open questions
      </text>
      <text x="22" y="124" fontFamily="JetBrains Mono" fontSize="9" fill="#A1A1A1">
        - Payment SLA?
      </text>
    </svg>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      num: "01",
      label: "Prompt",
      title: "Describe it in plain words.",
      blurb: "Type what you want to build. No special syntax.",
      drawing: <StepPromptDrawing />,
    },
    {
      num: "02",
      label: "Canvas",
      title: "Edit it together.",
      blurb: "Services, stores, queues — on a shared canvas with the AI.",
      drawing: <StepCanvasDrawing />,
    },
    {
      num: "03",
      label: "Spec",
      title: "Ship the document.",
      blurb: "Markdown spec generated from the canvas. Always in sync.",
      drawing: <StepSpecDrawing />,
    },
  ];
  return (
    <section id="how" className={SECTION_PADDING} data-reveal>
      <div className="mx-auto max-w-[1280px]">
        <SectionHead
          eyebrow="How it works"
          title="Three steps. No setup."
          sub="Describe a system. Edit the canvas with the AI. Ship the spec."
        />
        <div className="mt-14 grid border border-border-default md:grid-cols-3">
          {steps.map((s, i) => (
            <article
              key={s.num}
              className={
                "p-7 " +
                (i < steps.length - 1 ? "border-b border-border-faint md:border-b-0 md:border-r" : "")
              }
            >
              <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">
                <span>
                  {s.num} · {s.label}
                </span>
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </div>
              <h3 className="mt-5 font-sans text-[18px] font-semibold leading-[1.25] tracking-[-0.014em] text-text-primary">
                {s.title}
              </h3>
              <p className="mt-2 text-[13.5px] leading-[1.6] text-text-secondary">{s.blurb}</p>
              <div className="mt-5">{s.drawing}</div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCanvasGlyph() {
  return (
    <svg viewBox="0 0 220 96" className="w-full" role="img" aria-label="Nodes connected on the canvas">
      <defs>
        <marker id="f1-ar" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
          <path d="M0,0 L5,2.5 L0,5 z" fill="#3A3A3A" />
        </marker>
      </defs>
      <g fill="none" stroke="#2A2A2A">
        <path d="M52 26 H 90" markerEnd="url(#f1-ar)" />
        <path d="M122 26 H 160" markerEnd="url(#f1-ar)" />
        <path d="M110 38 V 64" markerEnd="url(#f1-ar)" />
      </g>
      <g>
        <rect x="20" y="14" width="32" height="24" rx="4" fill="#0A0A0A" stroke="#1F1F1F" />
        <rect x="90" y="14" width="32" height="24" rx="4" fill="#0A0A0A" stroke="#FFFFFF" />
        <rect x="160" y="14" width="32" height="24" rx="4" fill="#0A0A0A" stroke="#1F1F1F" />
        <rect x="94" y="64" width="32" height="22" rx="11" fill="#0A0A0A" stroke="#1F1F1F" />
      </g>
    </svg>
  );
}

function FeatureAiGlyph() {
  return (
    <svg viewBox="0 0 220 96" className="w-full" role="img" aria-label="AI suggesting issues">
      <rect x="14" y="14" width="190" height="68" rx="6" fill="#0A0A0A" stroke="#1F1F1F" />
      <g fontFamily="JetBrains Mono" fontSize="9">
        <circle cx="28" cy="32" r="3" fill="#E07474" />
        <text x="40" y="35" fill="#FFFFFF">SPOF · sessions cache</text>
        <circle cx="28" cy="50" r="3" fill="#D4A55B" />
        <text x="40" y="53" fill="#A1A1A1">assumption · sync payment</text>
        <circle cx="28" cy="68" r="3" fill="#6FC079" />
        <text x="40" y="71" fill="#A1A1A1">fix · add retry worker</text>
      </g>
    </svg>
  );
}

function FeatureCollabGlyph() {
  return (
    <svg viewBox="0 0 220 96" className="w-full" role="img" aria-label="Multiple cursors on the canvas">
      <rect x="14" y="14" width="190" height="68" rx="6" fill="#0A0A0A" stroke="#1F1F1F" />
      <rect x="36" y="32" width="48" height="32" rx="4" fill="#050505" stroke="#1F1F1F" />
      <rect x="120" y="32" width="60" height="32" rx="4" fill="#050505" stroke="#1F1F1F" />
      <g>
        <path d="M76 60l3 9 1.5-3.5L84 64 76 60z" fill="#6E9FE6" />
        <rect x="84" y="64" width="26" height="11" rx="2" fill="#6E9FE6" />
        <text x="87" y="73" fontFamily="JetBrains Mono" fontSize="8" fill="#0A0A0A" fontWeight="600">Mia</text>
      </g>
      <g>
        <path d="M150 24l3 9 1.5-3.5L158 28 150 24z" fill="#5BB5A8" />
        <rect x="158" y="28" width="22" height="11" rx="2" fill="#5BB5A8" />
        <text x="161" y="37" fontFamily="JetBrains Mono" fontSize="8" fill="#0A0A0A" fontWeight="600">Sai</text>
      </g>
    </svg>
  );
}

function FeatureSpecGlyph() {
  return (
    <svg viewBox="0 0 220 96" className="w-full" role="img" aria-label="Spec generated alongside the canvas">
      <rect x="14" y="14" width="86" height="68" rx="6" fill="#0A0A0A" stroke="#1F1F1F" />
      <g fontFamily="JetBrains Mono" fontSize="8" fill="#FFFFFF">
        <rect x="26" y="26" width="28" height="14" rx="3" fill="#050505" stroke="#1F1F1F" />
        <rect x="60" y="26" width="28" height="14" rx="3" fill="#050505" stroke="#1F1F1F" />
        <rect x="26" y="50" width="28" height="14" rx="3" fill="#050505" stroke="#1F1F1F" />
        <rect x="60" y="50" width="28" height="14" rx="3" fill="#050505" stroke="#1F1F1F" />
      </g>
      <path d="M104 48 H 122" stroke="#3A3A3A" />
      <rect x="124" y="14" width="80" height="68" rx="6" fill="#050505" stroke="#1F1F1F" />
      <g fontFamily="JetBrains Mono" fontSize="7" fill="#A1A1A1">
        <text x="132" y="28" fontWeight="600" fill="#FFFFFF"># spec</text>
        <text x="132" y="42">## components</text>
        <text x="132" y="54">- web → api</text>
        <text x="132" y="64">- api → db</text>
        <text x="132" y="74">- api → queue</text>
      </g>
    </svg>
  );
}

function FeatureTemplatesGlyph() {
  return (
    <svg viewBox="0 0 220 96" className="w-full" role="img" aria-label="Starter templates picker">
      <g fontFamily="Inter" fontSize="9" fill="#FFFFFF" fontWeight="600">
        <g transform="translate(14 14)">
          <rect width="60" height="68" rx="6" fill="#0A0A0A" stroke="#FFFFFF" />
          <text x="10" y="14" fontFamily="JetBrains Mono" fontSize="8" fill="#6E6E6E">01</text>
          <rect x="10" y="22" width="40" height="6" rx="1" fill="#1F1F1F" />
          <rect x="10" y="32" width="40" height="6" rx="1" fill="#1F1F1F" />
          <rect x="10" y="42" width="40" height="6" rx="1" fill="#1F1F1F" />
          <text x="10" y="62" fontSize="8" fill="#A1A1A1">Monolith</text>
        </g>
        <g transform="translate(80 14)">
          <rect width="60" height="68" rx="6" fill="#0A0A0A" stroke="#1F1F1F" />
          <text x="10" y="14" fontFamily="JetBrains Mono" fontSize="8" fill="#6E6E6E">02</text>
          <circle cx="20" cy="34" r="4" fill="none" stroke="#1F1F1F" />
          <circle cx="32" cy="34" r="4" fill="none" stroke="#1F1F1F" />
          <circle cx="44" cy="34" r="4" fill="none" stroke="#1F1F1F" />
          <text x="10" y="62" fontSize="8" fill="#A1A1A1">μServices</text>
        </g>
        <g transform="translate(146 14)">
          <rect width="60" height="68" rx="6" fill="#0A0A0A" stroke="#1F1F1F" />
          <text x="10" y="14" fontFamily="JetBrains Mono" fontSize="8" fill="#6E6E6E">03</text>
          <rect x="10" y="26" width="40" height="6" rx="1" fill="#1F1F1F" />
          <path d="M10 38 H 50" stroke="#20D7E8" strokeDasharray="2 2" />
          <rect x="10" y="44" width="40" height="6" rx="1" fill="#1F1F1F" />
          <text x="10" y="62" fontSize="8" fill="#A1A1A1">Event-driven</text>
        </g>
      </g>
    </svg>
  );
}

function PlatformSection() {
  const features = [
    {
      num: "01",
      title: "Visual canvas",
      desc: "Drag services, stores, queues. Connect them with labeled edges.",
      glyph: <FeatureCanvasGlyph />,
    },
    {
      num: "02",
      title: "AI co-architect",
      desc: "Drafts the system, flags risks, suggests fixes you can apply.",
      glyph: <FeatureAiGlyph />,
    },
    {
      num: "03",
      title: "Live with your team",
      desc: "Cursors, comments, shared edits — together in real time.",
      glyph: <FeatureCollabGlyph />,
    },
    {
      num: "04",
      title: "Spec, written for you",
      desc: "A clean Markdown spec — generated from what's on the canvas.",
      glyph: <FeatureSpecGlyph />,
    },
    {
      num: "05",
      title: "Starter templates",
      desc: "Monolith, microservices, event-driven. Pick one and edit.",
      glyph: <FeatureTemplatesGlyph />,
    },
    {
      num: "06",
      title: "Runs without watching",
      desc: "AI works in the background — pick up where it left off.",
      glyph: <FeatureAiGlyph />,
    },
  ];
  return (
    <section id="product" className={SECTION_PADDING} data-reveal>
      <div className="mx-auto max-w-[1280px]">
        <SectionHead
          eyebrow="What’s inside"
          title="Everything you need to design a system."
          sub="A canvas, an AI co-architect, and a spec — in one place."
        />
        <div className="mt-14 grid border border-border-default md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => {
            const lastInRow = (i + 1) % 3 === 0;
            const lastRow = i >= features.length - 3;
            return (
              <article
                key={f.num}
                className={
                  "p-7 " +
                  (!lastRow ? "border-b border-border-faint " : "") +
                  (!lastInRow ? "lg:border-r lg:border-border-faint " : "") +
                  ((i % 2 === 0) ? "md:border-r md:border-border-faint lg:border-r " : "") +
                  ((i + 1) % 2 === 0 ? "md:border-r-0 " : "")
                }
              >
                <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">
                  <span>{f.num}</span>
                </div>
                <div className="mt-5">{f.glyph}</div>
                <h3 className="mt-6 font-sans text-[18px] font-semibold tracking-[-0.014em] text-text-primary">
                  {f.title}
                </h3>
                <p className="mt-2 max-w-[340px] text-[13.5px] leading-[1.6] text-text-secondary">
                  {f.desc}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ReviewSection() {
  const findings: Array<{ id: string; severity: "high" | "med" | "low"; issue: string; fix: string }> = [
    { id: "SPOF", severity: "high", issue: "Sessions cache has no replica.", fix: "Add redis replica + automated failover." },
    { id: "Coupling", severity: "med", issue: "Checkout waits on payment latency.", fix: "Move to outbox + async confirmation." },
    { id: "Contract", severity: "med", issue: "Webhook retry policy missing.", fix: "Document idempotency key + 5x retry." },
    { id: "Drift", severity: "low", issue: "Read replica lag not bounded.", fix: "Define max lag SLO + alert." },
  ];
  const sevColor = (s: string) =>
    s === "high" ? "text-state-error" : s === "med" ? "text-state-warning" : "text-text-secondary";

  return (
    <section className={SECTION_PADDING} data-reveal>
      <div className="mx-auto max-w-[1280px]">
        <SectionHead
          eyebrow="Catch issues early"
          title="A second pair of eyes on every design."
          sub="The AI reviews what’s on the canvas and tells you what’ll break — with the fix."
        />
        <div className="mt-14 grid overflow-hidden border border-border-default lg:grid-cols-[0.95fr_1.05fr]">
          <div className="border-b border-border-faint p-7 lg:border-r lg:border-b-0">
            <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">
              <span>Findings · 4</span>
              <span className="flex items-center gap-2 text-state-success">
                <span className="h-1.5 w-1.5 rounded-full bg-state-success" />
                review complete
              </span>
            </div>
            <div className="mt-6 grid grid-cols-[88px_1fr_56px] gap-y-1 border-y border-border-faint py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-text-faint">
              <span>Issue</span>
              <span>Detail · suggested fix</span>
              <span className="text-right">Sev.</span>
            </div>
            <div className="mt-1 divide-y divide-border-faint font-mono text-[12px]">
              {findings.map((f) => (
                <div
                  key={f.id}
                  className="grid grid-cols-[88px_1fr_56px] gap-y-1 py-4 leading-[1.6]"
                >
                  <span className="text-text-primary">{f.id}</span>
                  <div className="text-text-secondary">
                    <p className="text-text-primary">{f.issue}</p>
                    <p className="mt-1 text-text-muted">→ {f.fix}</p>
                  </div>
                  <span className={"text-right uppercase " + sevColor(f.severity)}>
                    {f.severity}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-7">
            <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">
              <span>Generated spec · checkout-v2.md</span>
              <span className="flex items-center gap-1.5 text-text-secondary">
                <CheckIcon className="h-3.5 w-3.5" />
                in sync
              </span>
            </div>
            <div className="mt-6 rounded-md border border-border-faint bg-bg-canvas p-5 font-mono text-[12px] leading-[1.7] text-text-secondary">
              <p className="text-text-primary"># Checkout v2 — architecture</p>
              <p className="mt-3 text-text-muted">## Overview</p>
              <p>Synchronous checkout against Stripe, orders persisted to Postgres,</p>
              <p>events emitted asynchronously to downstream consumers.</p>
              <p className="mt-3 text-text-muted">## Components</p>
              <p>- Browser <span className="text-text-faint">→</span> CDN <span className="text-text-faint">→</span> API gateway</p>
              <p>- Gateway <span className="text-text-faint">→</span> Auth · Checkout · Orders</p>
              <p>- Checkout <span className="text-text-faint">→</span> Stripe (webhook)</p>
              <p>- Checkout <span className="text-text-faint">→</span> Orders DB (sql)</p>
              <p>- Checkout <span className="text-text-faint">→</span> Order events (suggested)</p>
              <p className="mt-3 text-text-muted">## Tradeoffs</p>
              <p>- Sync payment couples latency to Stripe.</p>
              <p>- Sessions cache <span className="text-state-error">is a SPOF</span>.</p>
              <p className="mt-3 text-text-muted">## Open questions</p>
              <p>- SLA on payment confirmation?</p>
              <p>- Retention for order events?</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function WindowChrome({ label, file, dim }: { label: string; file: string; dim?: boolean }) {
  return (
    <div
      className={
        "flex items-center gap-2 border-b border-border-faint px-3 py-2 font-mono text-[9px] uppercase tracking-[0.14em] " +
        (dim ? "text-text-faint" : "text-text-muted")
      }
    >
      <span className="flex gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-[#4A4A4A]" />
        <span className="h-1.5 w-1.5 rounded-full bg-[#3A3A3A]" />
        <span className="h-1.5 w-1.5 rounded-full bg-[#2A2A2A]" />
      </span>
      <span className="ml-1.5">{label}</span>
      <span className="text-text-faint">/</span>
      <span className="truncate">{file}</span>
    </div>
  );
}

function ChaosFigmaWindow() {
  return (
    <svg viewBox="0 0 260 140" className="w-full h-full" role="img" aria-label="A messy diagram in a design tool">
      <rect width="260" height="140" fill="#0A0A0A" />
      <g opacity="0.9">
        <rect x="22" y="20" width="60" height="32" rx="2" fill="none" stroke="#4A4A4A" />
        <rect x="110" y="20" width="60" height="32" rx="2" fill="none" stroke="#4A4A4A" />
        <rect x="198" y="20" width="40" height="32" rx="2" fill="none" stroke="#4A4A4A" strokeDasharray="2 3" />
        <rect x="22" y="76" width="60" height="32" rx="2" fill="none" stroke="#4A4A4A" />
        <rect x="110" y="76" width="60" height="40" rx="2" fill="none" stroke="#4A4A4A" />
        <path d="M82 36 H110 M170 36 H198 M52 52 V76 M140 52 V76 M82 92 H110" stroke="#3A3A3A" strokeDasharray="3 2" />
        <text x="30" y="38" fontFamily="JetBrains Mono" fontSize="7" fill="#6E6E6E">web</text>
        <text x="118" y="38" fontFamily="JetBrains Mono" fontSize="7" fill="#6E6E6E">api?</text>
        <text x="206" y="38" fontFamily="JetBrains Mono" fontSize="7" fill="#6E6E6E">stripe</text>
        <text x="30" y="94" fontFamily="JetBrains Mono" fontSize="7" fill="#6E6E6E">workr</text>
        <text x="118" y="94" fontFamily="JetBrains Mono" fontSize="7" fill="#6E6E6E">db (old?)</text>
      </g>
      <g stroke="#E07474" strokeWidth="1.5" opacity="0.7">
        <path d="M198 76 L 238 116" />
        <path d="M238 76 L 198 116" />
      </g>
      <text x="200" y="124" fontFamily="JetBrains Mono" fontSize="6" fill="#E07474" opacity="0.8">outdated</text>
    </svg>
  );
}

function ChaosExcalidrawWindow() {
  return (
    <svg viewBox="0 0 260 140" className="w-full h-full" role="img" aria-label="A hand-sketched diagram">
      <rect width="260" height="140" fill="#0A0A0A" />
      <g fill="none" stroke="#A1A1A1" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" opacity="0.85">
        <path d="M30 28 q3 -4 8 -3 l50 1 q4 0 4 4 l-1 22 q0 4 -4 4 l-50 -1 q-4 0 -4 -4 z" />
        <path d="M120 22 q3 -4 8 -3 l50 1 q4 0 4 4 l-1 24 q0 4 -4 4 l-50 -1 q-4 0 -4 -4 z" />
        <path d="M40 90 q3 -4 8 -3 l60 1 q4 0 4 4 l-1 24 q0 4 -4 4 l-60 -1 q-4 0 -4 -4 z" />
        <path d="M90 38 q12 2 22 -2" />
        <path d="M150 50 q-5 18 -90 38" />
        <path d="M170 90 q3 -4 8 -3 l50 1 q4 0 4 4 l-1 24 q0 4 -4 4 l-50 -1 q-4 0 -4 -4 z" />
        <path d="M120 102 q26 -2 50 0" />
      </g>
      <g fontFamily="Inter" fontSize="10" fill="#A1A1A1" fontStyle="italic">
        <text x="40" y="46">browser?</text>
        <text x="128" y="42">api</text>
        <text x="50" y="106">orders</text>
        <text x="178" y="106">??</text>
      </g>
      <g stroke="#D4A55B" strokeWidth="1.2" opacity="0.7">
        <path d="M220 28 l 12 -8 M232 20 l -2 8 M232 20 l -8 0" />
      </g>
    </svg>
  );
}

function ChaosNotionWindow() {
  return (
    <svg viewBox="0 0 260 140" className="w-full h-full" role="img" aria-label="A long unread spec document">
      <rect width="260" height="140" fill="#0A0A0A" />
      <g fontFamily="Inter" fill="#A1A1A1">
        <text x="20" y="22" fontSize="11" fontWeight="600" fill="#FFFFFF">Checkout — RFC v3 (?)</text>
        <text x="20" y="38" fontSize="8" fill="#6E6E6E">## Components</text>
        <rect x="20" y="44" width="200" height="2" fill="#1F1F1F" />
        <rect x="20" y="54" width="180" height="2" fill="#1F1F1F" />
        <rect x="20" y="64" width="190" height="2" fill="#1F1F1F" />
        <text x="20" y="82" fontSize="8" fill="#6E6E6E">## Open questions</text>
        <rect x="20" y="88" width="160" height="2" fill="#1F1F1F" />
        <rect x="20" y="98" width="170" height="2" fill="#1F1F1F" />
        <rect x="20" y="108" width="120" height="2" fill="#1F1F1F" />
        <rect x="20" y="118" width="150" height="2" fill="#1F1F1F" />
        <text x="20" y="132" fontSize="7" fill="#4A4A4A" fontStyle="italic">last edited 2 mo ago</text>
      </g>
    </svg>
  );
}

function ChaosWhiteboardWindow() {
  return (
    <svg viewBox="0 0 260 140" className="w-full h-full" role="img" aria-label="A whiteboard photo full of arrows">
      <rect width="260" height="140" fill="#0A0A0A" />
      <g fill="none" stroke="#6E6E6E" strokeWidth="1" opacity="0.7">
        <circle cx="50" cy="40" r="14" />
        <circle cx="130" cy="34" r="14" />
        <circle cx="210" cy="50" r="14" />
        <circle cx="90" cy="100" r="14" />
        <circle cx="190" cy="100" r="14" />
        <path d="M62 44 L 118 38" />
        <path d="M142 38 L 198 48" />
        <path d="M55 54 L 84 88" />
        <path d="M138 46 L 100 88" />
        <path d="M198 60 L 200 88" />
        <path d="M100 100 L 178 100" />
        <path d="M204 92 L 70 50" strokeDasharray="2 2" />
        <path d="M150 110 L 60 58" strokeDasharray="2 2" />
      </g>
      <g fontFamily="Inter" fontSize="8" fill="#A1A1A1" fontStyle="italic">
        <text x="38" y="42">A</text>
        <text x="118" y="36">B?</text>
        <text x="198" y="52">C</text>
        <text x="78" y="102">D</text>
        <text x="178" y="102">??</text>
      </g>
      <text x="20" y="128" fontFamily="Inter" fontSize="7" fill="#6E6E6E" fontStyle="italic">IMG_2384.jpg · 4 wks ago</text>
    </svg>
  );
}

function CalmCanvasWindow() {
  return (
    <svg viewBox="0 0 360 240" className="w-full h-full" role="img" aria-label="A clean Arqitect canvas">
      <defs>
        <pattern id="calm-dots" width="14" height="14" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.8" fill="rgba(255,255,255,0.07)" />
        </pattern>
        <marker id="calm-ar" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 z" fill="#3A3A3A" />
        </marker>
      </defs>
      <rect width="360" height="240" fill="url(#calm-dots)" />
      <g fill="none" stroke="#2A2A2A" strokeWidth="1.1">
        <path d="M70 50 H 116" markerEnd="url(#calm-ar)" />
        <path d="M180 50 H 226" markerEnd="url(#calm-ar)" />
        <path d="M150 66 V 110" markerEnd="url(#calm-ar)" />
        <path d="M150 138 V 178" markerEnd="url(#calm-ar)" />
        <path d="M260 66 V 110" markerEnd="url(#calm-ar)" />
      </g>
      <g fontFamily="Inter" fontSize="10" fontWeight="600" fill="#FFFFFF">
        <g transform="translate(24 36)">
          <rect width="46" height="28" rx="4" fill="#0A0A0A" stroke="#1F1F1F" />
          <text x="23" y="18" textAnchor="middle">Web</text>
        </g>
        <g transform="translate(116 36)">
          <rect width="64" height="28" rx="4" fill="#0A0A0A" stroke="#FFFFFF" />
          <text x="32" y="18" textAnchor="middle">API</text>
        </g>
        <g transform="translate(226 36)">
          <rect width="68" height="28" rx="4" fill="#0A0A0A" stroke="#1F1F1F" />
          <text x="34" y="18" textAnchor="middle">Stripe</text>
        </g>
        <g transform="translate(116 110)">
          <rect width="64" height="28" rx="4" fill="#0A0A0A" stroke="#1F1F1F" />
          <text x="32" y="18" textAnchor="middle">Orders</text>
        </g>
        <g transform="translate(226 110)">
          <rect width="68" height="28" rx="4" fill="#0A0A0A" stroke="#1F1F1F" />
          <text x="34" y="18" textAnchor="middle">DB</text>
        </g>
        <g transform="translate(116 178)">
          <rect width="64" height="26" rx="13" fill="#0A0A0A" stroke="#1F1F1F" strokeDasharray="2 3" />
          <text x="32" y="17" textAnchor="middle" fill="#A1A1A1" fontWeight="500">queue</text>
        </g>
      </g>
      <g fontFamily="JetBrains Mono" fontSize="7" fill="#6E6E6E">
        <text x="74" y="46">REST</text>
        <text x="184" y="46">webhook</text>
        <text x="156" y="92">sql</text>
        <text x="156" y="160">event</text>
      </g>
    </svg>
  );
}

function ChaosTile({
  rotate,
  top,
  left,
  width,
  zIndex,
  tool,
  file,
  pinRole,
  pinQuote,
  children,
}: {
  rotate: number;
  top: string;
  left: string;
  width: string;
  zIndex: number;
  tool: string;
  file: string;
  pinRole: string;
  pinQuote: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="absolute origin-center"
      style={{
        top,
        left,
        width,
        transform: `rotate(${rotate}deg)`,
        zIndex,
      }}
    >
      <div className="overflow-hidden rounded-lg border border-border-default bg-bg-surface shadow-[0_24px_60px_rgba(0,0,0,0.6)]">
        <WindowChrome label={tool} file={file} dim />
        <div className="aspect-[13/7] w-full">{children}</div>
      </div>
      <div className="absolute -bottom-3 left-3 right-3 translate-y-full">
        <div className="rounded-md border border-border-default bg-bg-elevated px-3 py-2.5 shadow-[0_12px_30px_rgba(0,0,0,0.5)]">
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-state-error/80">
            {pinRole}
          </p>
          <p className="mt-1 font-sans text-[12px] italic leading-[1.45] text-text-secondary">
            &ldquo;{pinQuote}&rdquo;
          </p>
        </div>
      </div>
    </div>
  );
}

function SoundFamiliarSection() {
  const personas = [
    {
      role: "Engineering lead",
      verdict: "One canvas. The diagram is the spec.",
    },
    {
      role: "Architect",
      verdict: "Risks called out — before the meeting.",
    },
    {
      role: "Tech founder",
      verdict: "A senior review on every design.",
    },
    {
      role: "Product squad",
      verdict: "Shared system. Shared spec. No translation.",
    },
  ];

  return (
    <section
      id="use-cases"
      className={"relative overflow-hidden " + SECTION_PADDING}
      data-reveal
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--grid-line) 1px, transparent 1px), linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 55% at 50% 30%, #000 30%, transparent 90%)",
          maskImage:
            "radial-gradient(ellipse 70% 55% at 50% 30%, #000 30%, transparent 90%)",
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-[1320px]">
        <div className="mx-auto max-w-[760px] text-center">
          <p className="inline-flex items-center gap-2.5 rounded-full border border-border-default bg-bg-surface px-3 py-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-state-error" />
            Are you still doing this?
          </p>
          <h2 className="mt-5 font-sans text-[clamp(32px,4.2vw,52px)] font-semibold leading-[1.04] tracking-[-0.032em] text-text-primary text-balance">
            Your system lives
            <br />
            <span className="text-text-secondary line-through decoration-state-error/60 decoration-[3px]">
              in five different tabs.
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-[560px] text-[15.5px] leading-[1.65] text-text-secondary">
            Excalidraw for the sketch. Figma for the demo. Notion for the spec. A
            whiteboard photo for the rest. None of them agree.
          </p>
        </div>

        <div className="relative mt-20 grid items-stretch gap-10 lg:mt-24 lg:grid-cols-[1.05fr_56px_0.95fr] lg:gap-0">
          <div className="relative h-[440px] min-h-[440px] md:h-[520px] lg:h-[640px]">
            <ChaosTile
              rotate={-6}
              top="2%"
              left="2%"
              width="58%"
              zIndex={1}
              tool="excalidraw.com"
              file="checkout-sketch"
              pinRole="Engineering lead"
              pinQuote="I redrew this in Figma, then Excalidraw, then Notion. None of them match anymore."
            >
              <ChaosExcalidrawWindow />
            </ChaosTile>

            <ChaosTile
              rotate={4}
              top="6%"
              left="38%"
              width="58%"
              zIndex={3}
              tool="figma.com"
              file="checkout.v3.fig"
              pinRole="Architect"
              pinQuote="Every review meeting starts with — wait, what is this thing?"
            >
              <ChaosFigmaWindow />
            </ChaosTile>

            <ChaosTile
              rotate={-3}
              top="48%"
              left="6%"
              width="54%"
              zIndex={2}
              tool="notion.so"
              file="rfc-3-final-FINAL.md"
              pinRole="Product squad"
              pinQuote="Engineering, product, and design all describe this system differently."
            >
              <ChaosNotionWindow />
            </ChaosTile>

            <ChaosTile
              rotate={7}
              top="54%"
              left="42%"
              width="54%"
              zIndex={4}
              tool="dropbox"
              file="IMG_2384.jpg"
              pinRole="Tech founder"
              pinQuote="I can't tell if this design holds up at 10x. Or 2x."
            >
              <ChaosWhiteboardWindow />
            </ChaosTile>

            <div className="pointer-events-none absolute -left-2 -top-2 z-10 rotate-[-12deg]">
              <span className="inline-block border border-state-error/60 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-state-error">
                Without Arqitect
              </span>
            </div>
          </div>

          <div className="relative flex flex-col items-center justify-center">
            <div className="hidden h-full w-px bg-gradient-to-b from-transparent via-border-default to-transparent lg:block" />
            <div className="absolute inset-0 hidden items-center justify-center lg:flex">
              <span className="rounded-full border border-border-default bg-bg-base px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-text-secondary">
                Arqitect →
              </span>
            </div>
            <div className="flex items-center justify-center lg:hidden">
              <span className="rounded-full border border-border-default bg-bg-base px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-text-secondary">
                ↓ Arqitect ↓
              </span>
            </div>
          </div>

          <div className="relative flex items-center">
            <div className="relative w-full">
              <div className="pointer-events-none absolute -right-2 -top-2 z-10 rotate-[8deg]">
                <span className="inline-flex items-center gap-1.5 border border-state-success/60 bg-bg-base px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-state-success">
                  <span className="h-1.5 w-1.5 rounded-full bg-state-success" />
                  With Arqitect
                </span>
              </div>
              <div className="overflow-hidden rounded-xl border border-border-default bg-bg-canvas shadow-[0_36px_100px_rgba(0,0,0,0.75)]">
                <WindowChrome label="arqitect.dev" file="checkout-v2 · canvas" />
                <CalmCanvasWindow />
                <div className="grid grid-cols-2 gap-px border-t border-border-faint bg-border-faint font-mono text-[11px]">
                  <div className="flex items-center gap-2 bg-bg-surface px-4 py-3 text-text-secondary">
                    <span className="h-1.5 w-1.5 rounded-full bg-state-success" />
                    spec.md · in sync
                  </div>
                  <div className="flex items-center gap-2 bg-bg-surface px-4 py-3 text-text-secondary">
                    <SparkIcon className="h-3.5 w-3.5 text-text-primary" />
                    AI · 0 issues
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-20 grid border border-border-default md:grid-cols-4">
          {personas.map((p, i) => (
            <article
              key={p.role}
              className={
                "p-6 " +
                (i < personas.length - 1
                  ? "border-b border-border-faint md:border-b-0 md:border-r"
                  : "")
              }
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
                If you&rsquo;re a
              </p>
              <p className="mt-2 font-mono text-[12px] uppercase tracking-[0.14em] text-text-secondary">
                {p.role}
              </p>
              <h3 className="mt-7 font-sans text-[18px] font-semibold leading-[1.3] tracking-[-0.014em] text-text-primary">
                {p.verdict}
              </h3>
            </article>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
          <Link
            href="/sign-up"
            className="inline-flex h-11 items-center gap-2.5 rounded-md bg-text-primary px-4.5 text-[13px] font-medium text-bg-base transition-colors hover:bg-[#E8E8E8]"
          >
            Get started
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
          <a
            href="#how"
            className="inline-flex h-11 items-center gap-2.5 rounded-md border border-border-subtle px-4.5 text-[13px] font-medium text-text-primary transition-colors hover:border-[#3A3A3A] hover:bg-bg-surface"
          >
            Show me how
          </a>
        </div>
      </div>
    </section>
  );
}

interface PricingTier {
  name: string;
  price: string;
  priceSuffix?: string;
  blurb: string;
  features: string[];
  cta: { label: string; href: string };
  emphasized?: boolean;
  footnote?: string;
}

function PricingSection() {
  const tiers: PricingTier[] = [
    {
      name: "Starter",
      price: "Free",
      blurb: "For one person trying it out.",
      features: ["1 workspace", "Unlimited drafts", "AI co-architect", "Markdown spec export"],
      cta: { label: "Get started", href: "/sign-up" },
    },
    {
      name: "Team",
      price: "$49",
      priceSuffix: "/ seat / month",
      blurb: "For teams designing together.",
      features: [
        "Everything in Starter",
        "Up to 25 seats",
        "Real-time collaboration",
        "Review history",
      ],
      cta: { label: "Get started", href: "/sign-up" },
      emphasized: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      blurb: "For organizations rolling it out across teams.",
      features: ["Everything in Team", "SSO", "Audit log", "Dedicated support"],
      cta: { label: "Talk to sales", href: "mailto:sales@arqitect.dev" },
    },
  ];

  return (
    <section id="pricing" className={SECTION_PADDING} data-reveal>
      <div className="mx-auto max-w-[1280px]">
        <SectionHead
          eyebrow="Pricing"
          title="Simple, per seat."
          sub="Start free. Upgrade when your team joins."
        />
        <div className="mt-14 grid border border-border-default lg:grid-cols-3">
          {tiers.map((t, i) => (
            <article
              key={t.name}
              className={
                "flex flex-col p-7 " +
                (i < tiers.length - 1 ? "border-b border-border-faint lg:border-b-0 lg:border-r " : "")
              }
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-muted">
                  {t.name}
                </span>
                {t.emphasized ? (
                  <span className="rounded-full border border-border-subtle px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-text-secondary">
                    most teams
                  </span>
                ) : null}
              </div>
              <div className="mt-7 flex items-baseline gap-2">
                <span className="font-sans text-[52px] font-light leading-none tracking-[-0.03em] text-text-primary">
                  {t.price}
                </span>
                {t.priceSuffix ? (
                  <span className="text-[13px] text-text-muted">{t.priceSuffix}</span>
                ) : null}
              </div>
              <p className="mt-4 max-w-[320px] text-[14px] leading-[1.6] text-text-secondary">
                {t.blurb}
              </p>
              <div className="mt-7 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
                <span>Includes</span>
                <span className="h-px flex-1 bg-border-faint" />
              </div>
              <ul className="mt-3 flex flex-col gap-2.5">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[13.5px] leading-[1.5] text-text-primary">
                    <span className="mt-0.5 text-text-muted">+</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-8">
                <Link
                  href={t.cta.href}
                  className={
                    "inline-flex h-11 w-full items-center justify-center gap-2 rounded-md text-[13px] font-medium transition-colors " +
                    (t.emphasized
                      ? "bg-text-primary text-bg-base hover:bg-[#E8E8E8]"
                      : "border border-border-subtle text-text-primary hover:border-[#3A3A3A] hover:bg-bg-surface")
                  }
                >
                  {t.cta.label}
                  <ArrowRightIcon className="h-3.5 w-3.5" />
                </Link>
                {t.footnote ? (
                  <p className="mt-3 font-mono text-[10.5px] uppercase tracking-[0.14em] text-text-muted">
                    {t.footnote}
                  </p>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ClosingCTA() {
  return (
    <section className={SECTION_PADDING + " text-center"} data-reveal>
      <div className="mx-auto max-w-[760px]">
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
          Ready when you are
        </p>
        <h2 className="mt-4 font-sans text-[clamp(32px,4.2vw,52px)] font-semibold leading-[1.04] tracking-[-0.032em] text-text-primary text-balance">
          Start with the canvas.
          <br />
          <span className="text-text-secondary">Stop drawing systems twice.</span>
        </h2>
        <div className="mt-9 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
          <Link
            href="/sign-up"
            className="inline-flex h-11 items-center gap-2.5 rounded-md bg-text-primary px-4.5 text-[13px] font-medium text-bg-base transition-colors hover:bg-[#E8E8E8]"
          >
            Get started
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/sign-in"
            className="inline-flex h-11 items-center gap-2.5 rounded-md border border-border-subtle px-4.5 text-[13px] font-medium text-text-primary transition-colors hover:border-[#3A3A3A] hover:bg-bg-surface"
          >
            Sign in
          </Link>
        </div>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border-faint px-6 py-9">
      <div className="mx-auto flex max-w-[1280px] flex-col items-start justify-between gap-6 font-mono text-[11px] text-text-muted md:flex-row md:items-center">
        <GlyphLogo />
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <a href="#product" className="hover:text-text-primary">
            Product
          </a>
          <a href="#how" className="hover:text-text-primary">
            How it works
          </a>
          <a href="#use-cases" className="hover:text-text-primary">
            Use cases
          </a>
          <a href="#pricing" className="hover:text-text-primary">
            Pricing
          </a>
          <Link href="/sign-in" className="hover:text-text-primary">
            Sign in
          </Link>
        </div>
        <span>© 2026 Arqitect Labs, Inc.</span>
      </div>
    </footer>
  );
}

export function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-bg-base font-sans text-text-primary antialiased">
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--grid-line) 1px, transparent 1px), linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 60% at 50% 18%, #000 50%, transparent 100%)",
          maskImage:
            "radial-gradient(ellipse 80% 60% at 50% 18%, #000 50%, transparent 100%)",
        }}
        aria-hidden
      />
      <div className="relative z-10">
        <TopNav />
        <Hero />
        <HowItWorksSection />
        <PlatformSection />
        <ReviewSection />
        <SoundFamiliarSection />
        <PricingSection />
        <ClosingCTA />
        <SiteFooter />
      </div>
    </main>
  );
}
