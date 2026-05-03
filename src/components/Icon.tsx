import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement> & { size?: number };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export function HomeIcon({ size = 22, ...rest }: Props) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M3 12L12 4l9 8" />
      <path d="M5 10v10h14V10" />
    </svg>
  );
}
export function GridIcon({ size = 22, ...rest }: Props) {
  return (
    <svg {...base(size)} {...rest}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
export function ChartIcon({ size = 22, ...rest }: Props) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M3 3v18h18" />
      <path d="M7 14l4-4 4 4 5-5" />
    </svg>
  );
}
export function PlusIcon({ size = 22, ...rest }: Props) {
  return (
    <svg {...base(size)} strokeWidth={2.5} {...rest}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
export function ChevronLeft({ size = 18, ...rest }: Props) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}
export function ChevronRight({ size = 12, ...rest }: Props) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}
export function CalIcon({ size = 14, ...rest }: Props) {
  return (
    <svg {...base(size)} {...rest}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}
export function BuildingIcon({ size = 14, ...rest }: Props) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M3 21h18" />
      <path d="M5 21V7l7-4 7 4v14" />
      <path d="M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01" />
    </svg>
  );
}
export function DeleteKeyIcon({ size = 22, ...rest }: Props) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M21 4H8l-7 8 7 8h13a2 2 0 002-2V6a2 2 0 00-2-2zM18 9l-6 6M12 9l6 6" />
    </svg>
  );
}
export function StarIcon({ size = 12, ...rest }: Props) {
  return (
    <svg {...base(size)} fill="currentColor" {...rest}>
      <path d="M12 2L15 8.5L22 9.3L17 14.5L18.2 21.5L12 18.2L5.8 21.5L7 14.5L2 9.3L9 8.5L12 2Z" />
    </svg>
  );
}
export function DownloadIcon({ size = 16, ...rest }: Props) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <path d="M7 10l5 5 5-5" />
      <path d="M12 15V3" />
    </svg>
  );
}
export function CompareIcon({ size = 14, ...rest }: Props) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M8 3L4 7l4 4" />
      <path d="M4 7h16" />
      <path d="M16 21l4-4-4-4" />
      <path d="M20 17H4" />
    </svg>
  );
}
export function TrashIcon({ size = 16, ...rest }: Props) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M3 6h18" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  );
}
export function CameraIcon({ size = 18, ...rest }: Props) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}
export function MapPinIcon({ size = 14, ...rest }: Props) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
export function MoreIcon({ size = 20, ...rest }: Props) {
  return (
    <svg {...base(size)} {...rest}>
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  );
}
