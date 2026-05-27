"use client";

import Link from "next/link";
import { useRef, type DragEvent, type ReactNode } from "react";
import {
  ArrowUpRight,
  Circle,
  Cylinder,
  Diamond,
  Frame,
  Hexagon,
  LayoutTemplate,
  MessageCircle,
  MousePointer2,
  Pill,
  Plus,
  RectangleHorizontal,
  Shapes,
  Sparkles,
  Type,
  type LucideIcon,
} from "lucide-react";
import { ShapeSilhouette } from "@/components/editor/shape-silhouette";
import { cn } from "@/lib/utils";
import {
  DEFAULT_NODE_COLOR,
  DEFAULT_NODE_SIZES,
  SHAPE_DRAG_MIME,
  type CanvasNodeShape,
  type ShapeDragPayload,
} from "@/types/canvas";

interface CanvasToolRailProps {
  projectId: string;
  isAiOpen: boolean;
  onToggleAi: () => void;
  onOpenTemplates: () => void;
}

interface RailButtonProps {
  label: string;
  icon: ReactNode;
  active?: boolean;
  onClick?: () => void;
  href?: string;
  className?: string;
}

interface ShapeButton {
  shape: CanvasNodeShape;
  label: string;
  Icon: LucideIcon;
}

const SHAPE_BUTTONS: ShapeButton[] = [
  { shape: "rectangle", label: "Rectangle", Icon: RectangleHorizontal },
  { shape: "diamond", label: "Diamond", Icon: Diamond },
  { shape: "circle", label: "Circle", Icon: Circle },
  { shape: "pill", label: "Pill", Icon: Pill },
  { shape: "cylinder", label: "Cylinder", Icon: Cylinder },
  { shape: "hexagon", label: "Hexagon", Icon: Hexagon },
];

function comingSoonHref(projectId: string, feature: string): string {
  return `/editor/${projectId}/coming-soon/${feature}`;
}

function railButtonClass(active?: boolean, className?: string) {
  return cn(
    "relative flex h-10 w-10 items-center justify-center rounded-xl text-text-secondary transition-colors",
    "hover:bg-bg-subtle hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/50",
    active && "bg-accent-primary-dim text-accent-primary",
    className,
  );
}

function RailButton({
  label,
  icon,
  active,
  onClick,
  href,
  className,
}: RailButtonProps) {
  if (href) {
    return (
      <Link
        href={href}
        aria-label={label}
        title={label}
        className={railButtonClass(active, className)}
      >
        {icon}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={railButtonClass(active, className)}
    >
      {icon}
    </button>
  );
}

export function CanvasToolRail({
  projectId,
  isAiOpen,
  onToggleAi,
  onOpenTemplates,
}: CanvasToolRailProps) {
  const previewRefs = useRef<
    Partial<Record<CanvasNodeShape, HTMLDivElement | null>>
  >({});

  function handleDragStart(
    event: DragEvent<HTMLButtonElement>,
    shape: CanvasNodeShape,
  ) {
    const size = DEFAULT_NODE_SIZES[shape];
    const payload: ShapeDragPayload = { shape, size };
    event.dataTransfer.setData(SHAPE_DRAG_MIME, JSON.stringify(payload));
    event.dataTransfer.effectAllowed = "move";

    const preview = previewRefs.current[shape];
    if (preview) {
      event.dataTransfer.setDragImage(preview, size.width / 2, size.height / 2);
    }
  }

  return (
    <div className="pointer-events-none absolute left-4 top-1/2 z-20 -translate-y-1/2">
      <nav
        aria-label="Canvas tools"
        className="pointer-events-auto flex flex-col items-center gap-1 rounded-2xl border border-border-default bg-bg-elevated/90 p-1.5 shadow-2xl backdrop-blur-md"
      >
        <RailButton
          label={isAiOpen ? "Close Arqitect" : "Open Arqitect"}
          active={isAiOpen}
          onClick={onToggleAi}
          icon={
            <>
              <Sparkles className="h-5 w-5" />
              <ArrowUpRight className="absolute right-1.5 top-1.5 h-2.5 w-2.5" />
            </>
          }
          className="text-accent-ai-text"
        />

        <div className="my-1 h-px w-7 bg-border-default" />

        <RailButton
          label="Select"
          active
          icon={<MousePointer2 className="h-5 w-5" />}
        />
        <RailButton
          label="Templates"
          onClick={onOpenTemplates}
          icon={<LayoutTemplate className="h-5 w-5" />}
        />

        <div className="group relative">
          <RailButton label="Shapes" icon={<Shapes className="h-5 w-5" />} />
          <div className="invisible absolute left-full top-1/2 ml-2 -translate-y-1/2 opacity-0 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
            <div className="flex items-center gap-1 rounded-2xl border border-border-default bg-bg-elevated/95 p-1.5 shadow-2xl backdrop-blur-md">
              {SHAPE_BUTTONS.map(({ shape, label, Icon }) => (
                <button
                  key={shape}
                  type="button"
                  draggable
                  onDragStart={(event) => handleDragStart(event, shape)}
                  aria-label={`Drag ${label} onto the canvas`}
                  title={label}
                  className="flex h-10 w-10 cursor-grab items-center justify-center rounded-xl text-text-secondary transition-colors hover:bg-bg-subtle hover:text-text-primary active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/50"
                >
                  <Icon className="h-5 w-5" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <RailButton
          label="Text coming soon"
          href={comingSoonHref(projectId, "text")}
          icon={<Type className="h-5 w-5" />}
        />
        <RailButton
          label="Frames coming soon"
          href={comingSoonHref(projectId, "frames")}
          icon={<Frame className="h-5 w-5" />}
        />
        <RailButton
          label="Comments coming soon"
          href={comingSoonHref(projectId, "comments")}
          icon={<MessageCircle className="h-5 w-5" />}
        />

        <div className="my-1 h-px w-7 bg-border-default" />

        <RailButton
          label="More tools coming soon"
          href={comingSoonHref(projectId, "more-tools")}
          icon={<Plus className="h-5 w-5" />}
          className="bg-bg-subtle text-text-primary"
        />
      </nav>

      <div
        aria-hidden="true"
        className="pointer-events-none fixed left-[-9999px] top-0"
      >
        {SHAPE_BUTTONS.map(({ shape }) => {
          const size = DEFAULT_NODE_SIZES[shape];
          return (
            <div
              key={shape}
              ref={(el) => {
                previewRefs.current[shape] = el;
              }}
              className="relative opacity-80"
              style={{ width: size.width, height: size.height }}
            >
              <ShapeSilhouette shape={shape} color={DEFAULT_NODE_COLOR} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
