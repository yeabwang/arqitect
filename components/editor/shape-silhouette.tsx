import type { CanvasNodeColor, CanvasNodeShape } from "@/types/canvas";

interface ShapeSilhouetteProps {
  shape: CanvasNodeShape;
  color: CanvasNodeColor;
  selected?: boolean;
}

// Shared shape rendering used by both the canvas node renderer and the shape
// panel drag preview so a dropped node looks identical to its ghost.
//
// CSS-bordered shapes (rectangle/circle/pill) vs inline-SVG shapes
// (diamond/hexagon/cylinder) per ui-context. Each fills its parent box so the
// node keeps its footprint and the SVG scales with node size via the
// non-uniform viewBox. Borders stay subtle at rest and brighten when selected.
export function ShapeSilhouette({
  shape,
  color,
  selected = false,
}: ShapeSilhouetteProps) {
  if (shape === "diamond" || shape === "hexagon" || shape === "cylinder") {
    const strokeOpacity = selected ? 1 : 0.45;
    const strokeWidth = selected ? 2 : 1.5;

    return (
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {shape === "diamond" ? (
          <polygon
            points="50,1 99,50 50,99 1,50"
            fill={color.fill}
            stroke={color.text}
            strokeOpacity={strokeOpacity}
            strokeWidth={strokeWidth}
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {shape === "hexagon" ? (
          <polygon
            points="25,2 75,2 99,50 75,98 25,98 1,50"
            fill={color.fill}
            stroke={color.text}
            strokeOpacity={strokeOpacity}
            strokeWidth={strokeWidth}
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {shape === "cylinder" ? (
          <>
            <path
              d="M1,14 L1,86 A49,13 0 0 0 99,86 L99,14"
              fill={color.fill}
              stroke={color.text}
              strokeOpacity={strokeOpacity}
              strokeWidth={strokeWidth}
              vectorEffect="non-scaling-stroke"
            />
            <ellipse
              cx={50}
              cy={14}
              rx={49}
              ry={13}
              fill={color.fill}
              stroke={color.text}
              strokeOpacity={strokeOpacity}
              strokeWidth={strokeWidth}
              vectorEffect="non-scaling-stroke"
            />
          </>
        ) : null}
      </svg>
    );
  }

  const radiusClass =
    shape === "circle" || shape === "pill" ? "rounded-full" : "rounded-xl";
  // Append an alpha byte to the vivid text color for the subtle rest border.
  const borderColor = selected ? color.text : `${color.text}66`;

  return (
    <div
      className={`absolute inset-0 ${radiusClass}`}
      style={{
        backgroundColor: color.fill,
        borderColor,
        borderWidth: selected ? 2 : 1,
        borderStyle: "solid",
      }}
    />
  );
}
