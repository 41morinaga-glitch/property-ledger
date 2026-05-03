"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatYen, formatYenShort } from "@/lib/format";

export interface CumulativePoint {
  ym: string;
  cum: number;
  monthBalance: number;
}

interface Props {
  points: CumulativePoint[];
  height?: number;
}

export function CumulativeChart({ points, height = 220 }: Props) {
  const [override, setOverride] = useState<number | null>(null);
  const fallbackIdx = useMemo(() => {
    for (let i = points.length - 1; i >= 0; i--) {
      if (points[i].monthBalance !== 0) return i;
    }
    return Math.max(0, points.length - 1);
  }, [points]);
  const selectedIdx = override ?? fallbackIdx;
  const [animateIn, setAnimateIn] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setAnimateIn(true), 50);
    return () => clearTimeout(t);
  }, []);

  if (points.length === 0) return null;

  const cums = points.map((p) => p.cum);
  const maxC = Math.max(0, ...cums);
  const minC = Math.min(0, ...cums);
  const range = Math.max(1, maxC - minC);
  const padding = { top: 16, bottom: 26, left: 0, right: 0 };
  const chartH = height - padding.top - padding.bottom;
  const W = 100;

  const pointAt = (i: number) => {
    const x = (i / (points.length - 1 || 1)) * W;
    const yRatio = (maxC - points[i].cum) / range;
    const y = padding.top + yRatio * chartH;
    return { x, y };
  };

  const linePoints = points.map((_, i) => {
    const { x, y } = pointAt(i);
    return `${x},${y}`;
  });

  const zeroY = padding.top + (maxC / range) * chartH;

  const areaPath = (() => {
    if (points.length === 0) return "";
    const cmd: string[] = [`M 0 ${zeroY}`];
    points.forEach((_, i) => {
      const { x, y } = pointAt(i);
      cmd.push(`L ${x.toFixed(3)} ${y.toFixed(3)}`);
    });
    cmd.push(`L ${W} ${zeroY}`);
    cmd.push("Z");
    return cmd.join(" ");
  })();

  const sel = points[selectedIdx];
  const selPt = pointAt(selectedIdx);

  const handlePointer = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const idx = Math.round(ratio * (points.length - 1));
    setOverride(idx);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 pb-3" ref={wrapRef}>
      <div className="px-1 pb-3 flex items-end justify-between">
        <div>
          <div className="text-[10px] tracking-[1.5px] text-[#9B9588] font-semibold">
            {Number(sel.ym.slice(5))}月の累計
          </div>
          <div
            className="text-[24px] font-bold num leading-none mt-1.5"
            style={{ color: sel.cum >= 0 ? "#3D8B4E" : "#B85450" }}
          >
            {formatYen(sel.cum, { sign: sel.cum > 0 })}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-[#9B9588]">
            この月の収支{" "}
            <span
              className="num font-semibold"
              style={{ color: sel.monthBalance >= 0 ? "#3D8B4E" : "#B85450" }}
            >
              {formatYen(sel.monthBalance, { sign: sel.monthBalance > 0 })}
            </span>
          </div>
          <div className="text-[10px] text-[#9B9588] mt-1 num">
            最高 <span className="font-semibold text-[#1F1F1F]">{formatYenShort(maxC, { sign: maxC > 0 })}</span>
          </div>
        </div>
      </div>

      <div className="relative" style={{ height }}>
        <svg
          viewBox={`0 0 ${W} ${height}`}
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full overflow-visible touch-none"
          onPointerDown={handlePointer}
          onPointerMove={(e) => {
            if (e.buttons === 1) handlePointer(e);
          }}
        >
          <defs>
            <linearGradient id="cum-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#86C998" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#86C998" stopOpacity="0" />
            </linearGradient>
          </defs>

          <line
            x1="0"
            x2={W}
            y1={zeroY}
            y2={zeroY}
            stroke="#E0DBCF"
            strokeWidth="0.4"
            strokeDasharray="0.8 1.2"
            vectorEffect="non-scaling-stroke"
          />

          <path d={areaPath} fill="url(#cum-area)" opacity={animateIn ? 1 : 0} style={{ transition: "opacity 800ms ease-out" }} />

          <polyline
            fill="none"
            stroke="#3D8B4E"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            points={linePoints.join(" ")}
            style={{
              strokeDasharray: 600,
              strokeDashoffset: animateIn ? 0 : 600,
              transition: "stroke-dashoffset 1000ms cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          />

          {points.map((p, i) => {
            const { x, y } = pointAt(i);
            const isSelected = i === selectedIdx;
            return (
              <circle
                key={p.ym}
                cx={x}
                cy={y}
                r={isSelected ? 1.6 : 0.7}
                fill={isSelected ? "#1F1F1F" : "#3D8B4E"}
                vectorEffect="non-scaling-stroke"
                style={{
                  transition: "r 200ms ease-out",
                  opacity: animateIn ? 1 : 0,
                }}
              />
            );
          })}

          <line
            x1={selPt.x}
            x2={selPt.x}
            y1={padding.top}
            y2={height - padding.bottom + 4}
            stroke="#1F1F1F"
            strokeWidth="0.5"
            strokeDasharray="0.8 1.2"
            vectorEffect="non-scaling-stroke"
            opacity="0.4"
          />
        </svg>

        <div className="absolute inset-x-0 bottom-0 flex justify-between text-[9px] text-[#9B9588] num pointer-events-none">
          <span>1月</span>
          <span>4月</span>
          <span>7月</span>
          <span>10月</span>
          <span>12月</span>
        </div>
      </div>
      <div className="mt-2 text-center text-[10px] text-[#9B9588]">
        グラフをタップ・ドラッグで月を選択
      </div>
    </div>
  );
}
