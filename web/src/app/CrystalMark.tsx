import { cn } from "@/lib/utils";

/**
 * Wireframe rendering of the Pretty Crystal hexagon mark (same geometry as
 * public/favicon.svg). `animated` traces the outlines in a draw/undraw loop
 * for loading states; the static form anchors the empty state.
 */
export function CrystalMark({
  animated = false,
  className,
  ...props
}: React.SVGProps<SVGSVGElement> & { animated?: boolean }) {
  return (
    <svg
      viewBox="0 0 1170 1346"
      fill="none"
      aria-hidden="true"
      className={cn(animated ? "crystal-mark-draw" : null, className)}
      {...props}
    >
      <g transform="rotate(30 585 673)">
        <polygon
          points="299,176 871,176 1158,673 871,1170 299,1170 12,673"
          stroke="#a4a7c8"
          strokeWidth={44}
          strokeLinejoin="round"
          pathLength={100}
        />
        <polygon
          points="585,341 871,508 871,839 585,1005 299,839 299,508"
          stroke="#a5dcd8"
          strokeWidth={44}
          strokeLinejoin="round"
          pathLength={100}
        />
      </g>
    </svg>
  );
}
