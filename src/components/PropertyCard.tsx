"use client";

import Link from "next/link";
import type { Property } from "@/lib/types";
import { formatYen } from "@/lib/format";
import { monthlyCFEstimate } from "@/lib/calc";
import { Thumb } from "./Thumb";

interface Props {
  property: Property;
  monthBalance?: number;
}

export function PropertyCard({ property, monthBalance }: Props) {
  const isConsidering = property.status === "considering";
  const display = isConsidering
    ? formatYen(monthlyCFEstimate(property), { sign: true })
    : monthBalance !== undefined
    ? formatYen(monthBalance, { sign: monthBalance > 0 })
    : formatYen(monthlyCFEstimate(property), { sign: true });

  const color = isConsidering
    ? "#4F7CAC"
    : (monthBalance ?? monthlyCFEstimate(property)) >= 0
    ? "#3D8B4E"
    : "#B85450";

  return (
    <Link
      href={`/properties/${property.id}`}
      className="flex items-center gap-3.5 bg-white rounded-2xl p-3 mb-2 shadow-sm active:bg-[#FAFAF7] transition-colors"
    >
      <Thumb src={property.photo} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold truncate">{property.name}</div>
        <div className="text-[10px] text-[#9B9588] mt-0.5">
          家賃 {formatYen(property.rent)}
          {isConsidering && " (想定)"}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="text-base font-bold num" style={{ color }}>
          {display}
        </div>
        <div className="text-[9px] text-[#9B9588] font-medium mt-0.5">
          {isConsidering ? "予想CF/月" : "今月"}
        </div>
      </div>
    </Link>
  );
}
