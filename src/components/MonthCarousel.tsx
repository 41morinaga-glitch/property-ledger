"use client";

import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "./Icon";

interface Props {
  ym: string;
  onChange: (ym: string) => void;
}

export function MonthCarousel({ ym, onChange }: Props) {
  const [yyyy, mm] = useMemo(() => ym.split("-").map(Number), [ym]);

  const shift = (delta: number) => {
    const d = new Date(yyyy, mm - 1 + delta, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    onChange(`${y}-${m}`);
  };

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => shift(-1)}
        className="w-7 h-7 grid place-items-center rounded-full text-[#9B9588] active:bg-[#F0EDE5]"
        aria-label="前月"
      >
        <ChevronLeft size={14} />
      </button>
      <div className="text-xs tracking-[1.5px] text-[#9B9588] font-medium num min-w-[64px] text-center">
        {yyyy} . {mm}
      </div>
      <button
        type="button"
        onClick={() => shift(1)}
        className="w-7 h-7 grid place-items-center rounded-full text-[#9B9588] active:bg-[#F0EDE5]"
        aria-label="次月"
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );
}
