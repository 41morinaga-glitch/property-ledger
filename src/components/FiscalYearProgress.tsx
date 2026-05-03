"use client";

import { useEffect, useState } from "react";
import type { FiscalAchievement } from "@/lib/calc";
import { formatYen, formatYenShort } from "@/lib/format";

interface Props {
  fa: FiscalAchievement;
}

export function FiscalYearProgress({ fa }: Props) {
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimateIn(true), 30);
    return () => clearTimeout(t);
  }, []);

  const rate = fa.rate;
  const rateColor =
    rate === null
      ? "#9B9588"
      : rate >= 100
      ? "#3D8B4E"
      : rate >= 80
      ? "#7AAA85"
      : rate >= 50
      ? "#9B9588"
      : "#B85450";

  const statusText =
    rate === null
      ? "実績不足"
      : rate >= 110
      ? "想定を超えて好調"
      : rate >= 95
      ? "順調"
      : rate >= 80
      ? "やや遅れ"
      : "未達(要対策)";

  const monthLabels = fa.monthSummaries.map((m) => Number(m.ym.slice(5)));

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 pt-4 pb-3 border-b border-[#F5F2EB]">
        <div className="text-[10px] tracking-[1.5px] text-[#9B9588] font-semibold">
          決算期 {fa.period.label}
        </div>
        <div className="text-[11px] text-[#9B9588] mt-0.5 num">
          {fa.period.startYear}年{fa.period.startMonthIdx + 1}月 〜 {fa.period.endYear}年
          {fa.period.endMonthIdx + 1}月
        </div>
      </div>

      <div className="px-5 py-5 text-center">
        <div className="text-[11px] tracking-[2px] text-[#9B9588] mb-1.5">12ヶ月の達成率</div>
        <div
          className="text-[44px] font-bold num leading-none animate-fade-up"
          style={{ color: rateColor, letterSpacing: "-1.5px" }}
        >
          {rate === null ? "—" : `${Math.round(rate)}%`}
        </div>
        <div className="text-[12px] mt-2 font-semibold" style={{ color: rateColor }}>
          {statusText}
        </div>
      </div>

      <div className="px-5 pb-3">
        <div className="flex items-end gap-1 h-28" aria-label="月別進捗バー">
          {fa.monthSummaries.map((m, i) => {
            const elapsed = i < fa.monthsElapsed;
            const expected = fa.monthlyExpected;
            const ratio =
              !elapsed || expected <= 0
                ? null
                : m.balance / expected;
            const fillRatio =
              ratio === null ? 0.45 : Math.max(0.05, Math.min(1.5, Math.abs(ratio)));
            const h = animateIn ? fillRatio * 80 : 0;
            let fill: string;
            if (!elapsed) {
              fill = "#EFEBE3";
            } else if (ratio === null) {
              fill = "#EFEBE3";
            } else if (ratio >= 1.0) {
              fill = "#3D8B4E";
            } else if (ratio >= 0.8) {
              fill = "#86C998";
            } else if (ratio >= 0.5) {
              fill = "#C9B79C";
            } else if (ratio >= 0) {
              fill = "#E8B4A6";
            } else {
              fill = "#B85450";
            }
            const isCurrent = i === fa.monthsElapsed - 1;
            return (
              <div key={m.ym} className="flex-1 flex flex-col items-center gap-1.5">
                <div className="w-full flex flex-col justify-end" style={{ height: 80 }}>
                  <div
                    className="w-full rounded-t-md"
                    style={{
                      height: `${h}px`,
                      background: fill,
                      transition: `height 600ms cubic-bezier(0.16,1,0.3,1) ${i * 30}ms`,
                      minHeight: elapsed ? 4 : 2,
                      opacity: elapsed ? 1 : 0.5,
                    }}
                  />
                </div>
                <div
                  className="text-[9px] num"
                  style={{
                    color: isCurrent ? "#1F1F1F" : "#9B9588",
                    fontWeight: isCurrent ? 700 : 500,
                  }}
                >
                  {monthLabels[i]}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-2 text-center text-[10px] text-[#9B9588]">
          各バー: その月の収支 ÷ 予想月CF。緑=順調・コーラル=未達・薄色=未来
        </div>
      </div>

      <div className="border-t border-[#F5F2EB] grid grid-cols-3 divide-x divide-[#F5F2EB] text-center">
        <Stat label="経過" value={`${fa.monthsElapsed} / 12 ヶ月`} />
        <Stat
          label="累計実績"
          value={formatYenShort(fa.actualSoFar, { sign: fa.actualSoFar > 0 })}
          color={fa.actualSoFar >= 0 ? "#3D8B4E" : "#B85450"}
        />
        <Stat
          label="期末予想"
          value={formatYen(fa.expectedFull, { sign: fa.expectedFull > 0 })}
          color="#7A6F5C"
        />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="py-3 px-2">
      <div className="text-[10px] text-[#9B9588]">{label}</div>
      <div className="text-[13px] font-bold num mt-1" style={{ color: color ?? "#1F1F1F" }}>
        {value}
      </div>
    </div>
  );
}
