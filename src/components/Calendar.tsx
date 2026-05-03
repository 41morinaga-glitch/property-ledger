"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "./Icon";

interface Props {
  value: string;
  onChange: (iso: string) => void;
  onClose: () => void;
}

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toIso(y: number, m: number, d: number): string {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

function todayParts(): { y: number; m: number; d: number } {
  const t = new Date();
  return { y: t.getFullYear(), m: t.getMonth(), d: t.getDate() };
}

export function Calendar({ value, onChange, onClose }: Props) {
  const initial = useMemo(() => {
    if (value) {
      const [y, m, d] = value.split("-").map(Number);
      return { y, m: m - 1, d };
    }
    return todayParts();
  }, [value]);

  const [view, setView] = useState({ y: initial.y, m: initial.m });
  const today = todayParts();

  const cells = useMemo(() => {
    const first = new Date(view.y, view.m, 1);
    const startDow = first.getDay();
    const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
    const days: ({ d: number; iso: string } | null)[] = [];
    for (let i = 0; i < startDow; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push({ d, iso: toIso(view.y, view.m, d) });
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [view]);

  const shift = (delta: number) => {
    const d = new Date(view.y, view.m + delta, 1);
    setView({ y: d.getFullYear(), m: d.getMonth() });
  };

  const select = (iso: string) => {
    onChange(iso);
    onClose();
  };

  return (
    <div className="bg-[#FAFAF7] rounded-t-[24px] pt-2 pb-7 select-none">
      <div className="w-9 h-1 bg-[#C0BBB0] rounded-full mx-auto mb-3" />
      <div className="flex items-center justify-between px-5 pb-4">
        <button
          type="button"
          onClick={() => shift(-1)}
          className="w-10 h-10 grid place-items-center rounded-full active:bg-[#F0EDE5]"
          aria-label="前月"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="text-[18px] font-bold num tracking-tight">
          {view.y}年 {view.m + 1}月
        </div>
        <button
          type="button"
          onClick={() => shift(1)}
          className="w-10 h-10 grid place-items-center rounded-full active:bg-[#F0EDE5]"
          aria-label="次月"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 px-3 mb-1">
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            className="text-center text-[11px] font-semibold py-1.5"
            style={{ color: i === 0 ? "#B85450" : i === 6 ? "#4F7CAC" : "#9B9588" }}
          >
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 px-3 gap-y-1">
        {cells.map((cell, i) => {
          if (!cell) return <div key={i} className="aspect-square" />;
          const isSelected = cell.iso === value;
          const isToday =
            cell.d === today.d && view.m === today.m && view.y === today.y;
          const dow = i % 7;
          const dowColor = dow === 0 ? "#B85450" : dow === 6 ? "#4F7CAC" : "#1F1F1F";
          return (
            <button
              key={cell.iso}
              type="button"
              onClick={() => select(cell.iso)}
              className="aspect-square grid place-items-center text-[16px] font-semibold num rounded-full active:scale-95 transition-transform"
              style={{
                background: isSelected ? "#1F1F1F" : "transparent",
                color: isSelected ? "white" : dowColor,
                position: "relative",
              }}
            >
              {cell.d}
              {!isSelected && isToday && (
                <span
                  className="absolute bottom-1 w-1 h-1 rounded-full"
                  style={{ background: dowColor }}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex gap-2 px-4 mt-5">
        <button
          type="button"
          onClick={() => {
            const t = todayParts();
            select(toIso(t.y, t.m, t.d));
          }}
          className="flex-1 py-3 rounded-xl bg-[#F0EDE5] text-[#1F1F1F] font-semibold text-[14px] active:scale-[0.98]"
        >
          今日
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-3 rounded-xl bg-[#1F1F1F] text-white font-semibold text-[14px] active:scale-[0.98]"
        >
          閉じる
        </button>
      </div>
    </div>
  );
}
