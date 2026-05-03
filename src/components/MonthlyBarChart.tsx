"use client";

import { useEffect, useState } from "react";
import { formatYen, formatYenShort } from "@/lib/format";
import type { MonthSummary } from "@/lib/calc";

interface Props {
  data: MonthSummary[];
  height?: number;
  defaultSelectedIndex?: number;
}

export function MonthlyBarChart({ data, height = 200, defaultSelectedIndex }: Props) {
  const [selectedIdx, setSelectedIdx] = useState<number>(
    defaultSelectedIndex ?? data.length - 1,
  );
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimateIn(true), 30);
    return () => clearTimeout(t);
  }, []);

  const maxAbs = Math.max(1, ...data.map((m) => Math.abs(m.balance)));
  const half = (height - 24) / 2;
  const selected = data[selectedIdx];

  const isPositive = selected ? selected.balance >= 0 : true;
  const headerColor = !selected ? "#9B9588" : selected.balance >= 0 ? "#3D8B4E" : "#B85450";

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 pb-3">
      <div className="px-1 pb-3 flex items-end justify-between">
        <div>
          <div className="text-[10px] tracking-[1.5px] text-[#9B9588] font-semibold">
            {selected
              ? `${selected.ym.slice(0, 4)}年 ${Number(selected.ym.slice(5))}月`
              : "—"}
          </div>
          <div className="text-[26px] font-bold num leading-none mt-1.5" style={{ color: headerColor }}>
            {selected ? formatYen(selected.balance, { sign: selected.balance > 0 }) : "—"}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-[#9B9588]">
            収入 <span className="num text-[#3D8B4E] font-semibold">{selected ? formatYen(selected.income) : "—"}</span>
          </div>
          <div className="text-[10px] text-[#9B9588] mt-1">
            支出 <span className="num text-[#B85450] font-semibold">{selected ? formatYen(selected.expense) : "—"}</span>
          </div>
        </div>
      </div>

      <div
        className="relative flex items-stretch"
        style={{ height }}
        role="group"
        aria-label="月別収支グラフ"
      >
        <div className="flex-1 relative">
          <div
            className="absolute left-0 right-0 border-t border-dashed border-[#E0DBCF]"
            style={{ top: half + 12 }}
          />
          <div
            className="absolute -left-1 text-[9px] text-[#B5B0A4] num"
            style={{ top: half + 8 }}
          >
            0
          </div>
          <div className="absolute inset-0 flex items-stretch gap-[3px]">
            {data.map((m, i) => {
              const ratio = Math.abs(m.balance) / maxAbs;
              const barH = animateIn ? ratio * (half - 6) : 0;
              const positive = m.balance >= 0;
              const isSelected = i === selectedIdx;
              return (
                <button
                  key={m.ym}
                  type="button"
                  onClick={() => setSelectedIdx(i)}
                  aria-label={`${Number(m.ym.slice(5))}月: ${formatYenShort(m.balance, { sign: m.balance > 0 })}`}
                  className="flex-1 relative active:scale-95 transition-transform"
                >
                  <div
                    className="absolute left-1/2 -translate-x-1/2 rounded transition-all"
                    style={{
                      width: "76%",
                      [positive ? "bottom" : "top"]: half + 12,
                      height: Math.max(2, barH),
                      background: positive
                        ? isSelected
                          ? "#3D8B4E"
                          : "#86C998"
                        : isSelected
                        ? "#B85450"
                        : "#E8B4A6",
                      transitionDuration: `${500 + i * 40}ms`,
                      transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
                    }}
                  />
                  {isSelected && (
                    <span
                      className="absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
                      style={{
                        background: positive ? "#3D8B4E" : "#B85450",
                        [positive ? "bottom" : "top"]: half + 8,
                      }}
                    />
                  )}
                  <div
                    className="absolute left-0 right-0 text-center text-[9px] num"
                    style={{
                      bottom: -2,
                      color: isSelected ? "#1F1F1F" : "#9B9588",
                      fontWeight: isSelected ? 700 : 500,
                    }}
                  >
                    {Number(m.ym.slice(5))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="mt-3 text-center text-[10px] text-[#9B9588]">
        バーをタップで月の内訳を表示
      </div>
    </div>
  );
}
