"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAppData } from "@/lib/store";
import { currentYm, formatYen } from "@/lib/format";
import { monthSummary, txByProperty, monthlyCFEstimate } from "@/lib/calc";
import { PropertyCard } from "@/components/PropertyCard";

type Tab = "owned" | "considering";

export default function PropertiesPage() {
  const data = useAppData();
  const [tab, setTab] = useState<Tab>("owned");
  const ym = useMemo(() => currentYm(), []);

  const list = data.properties.filter((p) => p.status === tab);

  const totalOwnedThisMonth = useMemo(
    () =>
      data.properties
        .filter((p) => p.status === "owned")
        .reduce((s, p) => s + monthSummary(txByProperty(data.transactions, p.id), ym).balance, 0),
    [data, ym],
  );

  const totalConsideringCF = useMemo(
    () =>
      data.properties
        .filter((p) => p.status === "considering")
        .reduce((s, p) => s + monthlyCFEstimate(p), 0),
    [data.properties],
  );

  return (
    <div className="pt-6">
      <div className="px-7 pb-5">
        <h1 className="text-[28px] font-bold">物件</h1>
      </div>

      <div className="px-6 mb-5">
        <div className="bg-[#F0EDE5] rounded-xl p-1 flex">
          <TabPill active={tab === "owned"} onClick={() => setTab("owned")}>
            所有 {data.properties.filter((p) => p.status === "owned").length}
          </TabPill>
          <TabPill active={tab === "considering"} onClick={() => setTab("considering")}>
            検討中 {data.properties.filter((p) => p.status === "considering").length}
          </TabPill>
        </div>
      </div>

      <div className="px-7 mb-5 flex items-baseline justify-between">
        <div className="text-[11px] tracking-[1.5px] text-[#9B9588] font-semibold">
          {tab === "owned" ? "所有合計(今月)" : "検討中合計(予想CF/月)"}
        </div>
        <div
          className="text-[20px] font-bold num"
          style={{ color: tab === "owned" ? "#3D8B4E" : "#4F7CAC" }}
        >
          {formatYen(tab === "owned" ? totalOwnedThisMonth : totalConsideringCF, { sign: true })}
        </div>
      </div>

      <div className="px-6">
        {list.length === 0 ? (
          <div className="bg-white/60 rounded-2xl p-10 text-center">
            <div className="text-sm text-[#7A6F5C] mb-4">
              {tab === "owned" ? "所有物件がまだありません" : "検討中の物件はありません"}
            </div>
            <Link
              href={`/properties/new?status=${tab}`}
              className="inline-block px-5 py-2.5 rounded-full bg-[#1F1F1F] text-white text-[13px] font-semibold"
            >
              ＋ 物件を追加
            </Link>
          </div>
        ) : (
          <>
            {list.map((p) => {
              const monthBal =
                tab === "owned"
                  ? monthSummary(txByProperty(data.transactions, p.id), ym).balance
                  : undefined;
              return <PropertyCard key={p.id} property={p} monthBalance={monthBal} />;
            })}
            <Link
              href={`/properties/new?status=${tab}`}
              className="block mt-3 py-3 rounded-xl border border-dashed border-[#D8D2C5] text-center text-[13px] text-[#7A6F5C] active:bg-white/40"
            >
              ＋ 物件を追加
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

function TabPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 py-2.5 text-center text-[13px] font-semibold rounded-[9px] transition-all"
      style={{
        background: active ? "white" : "transparent",
        color: active ? "#1F1F1F" : "#9B9588",
        boxShadow: active ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
      }}
    >
      {children}
    </button>
  );
}
