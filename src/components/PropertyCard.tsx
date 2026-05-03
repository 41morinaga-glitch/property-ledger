"use client";

import Link from "next/link";
import type { Property } from "@/lib/types";
import { formatYen } from "@/lib/format";
import { monthlyCFEstimate } from "@/lib/calc";

interface Props {
  property: Property;
  /** 累計実績残高(累計表示モード) */
  lifetimeBalance?: number;
  /** 達成率 % — null は計算不能(取得日や購入価格が無いなど) */
  achievementRate?: number | null;
  /** 達成率のラベル接頭辞(例: "決算期" / "累計") */
  achievementLabel?: string;
  /** 月別表示モード。lifetimeBalance が指定されない場合のみ参照 */
  monthBalance?: number;
}

export function PropertyCard({
  property,
  lifetimeBalance,
  achievementRate,
  achievementLabel = "達成率",
  monthBalance,
}: Props) {
  const isConsidering = property.status === "considering";

  let amount: number;
  let label: string;
  let labelExtra: { text: string; color: string } | undefined;

  if (isConsidering) {
    amount = monthlyCFEstimate(property);
    label = "予想CF/月";
  } else if (lifetimeBalance !== undefined) {
    amount = lifetimeBalance;
    label = "累計";
    if (achievementRate !== null && achievementRate !== undefined) {
      const rate = achievementRate;
      const color =
        rate >= 100
          ? "#3D8B4E"
          : rate >= 80
          ? "#7AAA85"
          : rate >= 50
          ? "#9B9588"
          : "#B85450";
      labelExtra = {
        text: `${achievementLabel} ${Math.round(rate)}%`,
        color,
      };
    }
  } else if (monthBalance !== undefined) {
    amount = monthBalance;
    label = "今月";
  } else {
    amount = monthlyCFEstimate(property);
    label = "予想CF/月";
  }

  const color = isConsidering
    ? "#4F7CAC"
    : amount >= 0
    ? "#3D8B4E"
    : "#B85450";

  return (
    <Link
      href={`/properties/${property.id}`}
      className="flex items-center gap-3.5 bg-white rounded-2xl px-4 py-3.5 mb-2 shadow-sm active:bg-[#FAFAF7] transition-colors"
    >
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold truncate flex items-center gap-1.5">
          {property.name}
          {property.autoRecord?.enabled && (
            <span
              className="text-[9px] font-semibold tracking-wider px-1.5 py-0.5 rounded-full bg-[#F0F4F0] text-[#3D8B4E]"
              title="毎月の自動記録ON"
            >
              自動
            </span>
          )}
        </div>
        <div className="text-[10px] text-[#9B9588] mt-0.5 num">
          家賃 {formatYen(property.rent)}
          {isConsidering && " (想定)"}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="text-base font-bold num" style={{ color }}>
          {formatYen(amount, { sign: amount > 0 })}
        </div>
        <div className="text-[9px] text-[#9B9588] font-medium mt-0.5 flex items-center justify-end gap-1.5">
          <span>{label}</span>
          {labelExtra && (
            <>
              <span className="text-[#D8D2C5]">·</span>
              <span className="num font-bold" style={{ color: labelExtra.color }}>
                {labelExtra.text}
              </span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
