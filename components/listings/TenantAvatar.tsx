import type { TenantType } from "@/lib/tenant-types";

type TenantAvatarProps = {
  type: TenantType;
  className?: string;
};

const SKIN = "#F2C29B";

function MaleFigure({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <rect x="-2.5" y="4" width="5" height="7" fill={SKIN} />
      <path d="M-11 22c0-8 5-12 11-12s11 4 11 12z" fill="#2563EB" />
      <circle cx="0" cy="0" r="7" fill={SKIN} />
      <path d="M-7 -1c0-6 3-8 7-8s7 2 7 8c-2-3-4-4-7-4s-5 1-7 4z" fill="#1F2937" />
    </g>
  );
}

function FemaleFigure({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d="M-8 -2c0-7 3-9 8-9s8 2 8 9v9h-16z" fill="#7C2D12" />
      <rect x="-2.5" y="4" width="5" height="7" fill={SKIN} />
      <path d="M-11 22c0-8 5-12 11-12s11 4 11 12z" fill="#DB2777" />
      <circle cx="0" cy="0" r="7" fill={SKIN} />
      <path d="M-7 -1c1-5 3-7 7-7s6 2 7 7c-3-2-5-3-7-5-2 2-4 3-7 5z" fill="#7C2D12" />
    </g>
  );
}

function ChildFigure({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="-2" y="3" width="4" height="4" fill={SKIN} />
      <path d="M-7 14c0-5 3-8 7-8s7 3 7 8z" fill="#F59E0B" />
      <circle cx="0" cy="0" r="5" fill={SKIN} />
      <path d="M-5 -1c0-4 2-5 5-5s5 1 5 5c-2-2-3-2-5-2s-3 0-5 2z" fill="#1F2937" />
    </g>
  );
}

const BACKGROUND: Record<TenantType, string> = {
  male: "#DBEAFE",
  female: "#FCE7F3",
  family: "#DCFCE7",
};

/** Small illustrated avatar for a tenant type (male / female / family). */
export default function TenantAvatar({ type, className = "h-8 w-8" }: TenantAvatarProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <defs>
        <clipPath id={`tenant-avatar-${type}`}>
          <circle cx="24" cy="24" r="24" />
        </clipPath>
      </defs>
      <circle cx="24" cy="24" r="24" fill={BACKGROUND[type]} />
      <g clipPath={`url(#tenant-avatar-${type})`}>
        {type === "male" ? <MaleFigure x={24} y={22} scale={1.35} /> : null}
        {type === "female" ? <FemaleFigure x={24} y={22} scale={1.35} /> : null}
        {type === "family" ? (
          <>
            <MaleFigure x={15} y={21} />
            <FemaleFigure x={33} y={21} />
            <ChildFigure x={24} y={32} />
          </>
        ) : null}
      </g>
    </svg>
  );
}
