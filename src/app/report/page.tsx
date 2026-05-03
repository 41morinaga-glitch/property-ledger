"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAppData } from "@/lib/store";
import { balance, monthSummary, txByProperty, ytd } from "@/lib/calc";
import { formatYen, formatYenShort } from "@/lib/format";
import { Thumb } from "@/components/Thumb";
import { DownloadIcon } from "@/components/Icon";

export default function ReportPage() {
  const data = useAppData();
  const now = new Date();
  const [year, setYear] = useState<number>(now.getFullYear());

  const years = useMemo(() => {
    const set = new Set<number>();
    for (const t of data.transactions) set.add(Number(t.date.slice(0, 4)));
    set.add(now.getFullYear());
    return [...set].sort((a, b) => b - a);
  }, [data.transactions, now]);

  const months = useMemo(() => ytd(data.transactions, year), [data.transactions, year]);

  const ytdTotal = months.reduce((s, m) => s + m.balance, 0);
  const ytdIncome = months.reduce((s, m) => s + m.income, 0);
  const ytdExpense = months.reduce((s, m) => s + m.expense, 0);

  const ranking = useMemo(() => {
    const owned = data.properties.filter((p) => p.status === "owned");
    return owned
      .map((p) => {
        const yearTxs = txByProperty(data.transactions, p.id).filter(
          (t) => Number(t.date.slice(0, 4)) === year,
        );
        return { property: p, balance: balance(yearTxs) };
      })
      .sort((a, b) => b.balance - a.balance);
  }, [data, year]);

  const maxRank = Math.max(1, ...ranking.map((r) => Math.abs(r.balance)));

  let cum = 0;
  const cumulative = months.map((m) => {
    cum += m.balance;
    return { ym: m.ym, cum };
  });
  const maxCum = Math.max(1, ...cumulative.map((c) => Math.abs(c.cum)));
  const minCum = Math.min(0, ...cumulative.map((c) => c.cum));
  const cumRange = Math.max(1, maxCum - minCum);

  const exportCSV = () => {
    const rows = [["日付", "種別", "金額", "物件", "メモ"]];
    const yearTx = data.transactions
      .filter((t) => Number(t.date.slice(0, 4)) === year)
      .sort((a, b) => (a.date < b.date ? -1 : 1));
    for (const t of yearTx) {
      const p = data.properties.find((x) => x.id === t.propertyId);
      rows.push([
        t.date,
        t.kind === "income" ? "収入" : "経費",
        String(t.amount),
        p?.name || "(削除済み物件)",
        t.memo || "",
      ]);
    }
    const csv = rows
      .map((r) =>
        r.map((c) => (/[",\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(","),
      )
      .join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `物件ノート_${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="pt-6">
      <div className="px-7 pb-3 flex items-baseline justify-between">
        <h1 className="text-[28px] font-bold">レポート</h1>
        <Link
          href="/settings"
          className="text-[12px] text-[#9B9588] underline-offset-2 active:text-[#1F1F1F]"
        >
          設定
        </Link>
      </div>

      <div className="px-6 pb-2 flex gap-2 overflow-x-auto no-scrollbar">
        {years.map((y) => (
          <button
            key={y}
            onClick={() => setYear(y)}
            className="px-4 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap"
            style={{
              background: y === year ? "#1F1F1F" : "transparent",
              color: y === year ? "#FFFFFF" : "#9B9588",
              border: y === year ? "none" : "1px solid #E0DBCF",
            }}
          >
            {y}年
          </button>
        ))}
      </div>

      <div className="text-center px-7 py-8">
        <div className="text-[11px] tracking-[2px] text-[#9B9588] mb-2">{year}年 累計収益</div>
        <div
          className="text-[48px] font-bold num animate-fade-up"
          style={{
            color: ytdTotal >= 0 ? "#3D8B4E" : "#B85450",
            letterSpacing: "-1.5px",
            lineHeight: 1,
          }}
        >
          {formatYen(ytdTotal, { sign: ytdTotal > 0 })}
        </div>
        <div className="flex justify-center gap-6 mt-4 text-[11px] text-[#9B9588]">
          <span>
            収入 <span className="num text-[#3D8B4E] font-semibold">{formatYen(ytdIncome)}</span>
          </span>
          <span>
            支出 <span className="num text-[#B85450] font-semibold">{formatYen(ytdExpense)}</span>
          </span>
        </div>
      </div>

      <div className="mx-6 mb-6 bg-white rounded-2xl p-4 shadow-sm">
        <div className="text-[11px] tracking-[1.5px] text-[#9B9588] font-semibold mb-3">
          月別の累計推移
        </div>
        <div className="relative h-32">
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full"
          >
            <line x1="0" y1={(maxCum / cumRange) * 100} x2="100" y2={(maxCum / cumRange) * 100} stroke="#EFEBE3" strokeWidth="0.5" />
            <polyline
              fill="none"
              stroke="#3D8B4E"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
              points={cumulative
                .map((c, i) => {
                  const x = (i / (cumulative.length - 1 || 1)) * 100;
                  const y = ((maxCum - c.cum) / cumRange) * 100;
                  return `${x},${y}`;
                })
                .join(" ")}
            />
          </svg>
          <div className="absolute inset-x-0 bottom-0 flex justify-between text-[9px] text-[#9B9588] num">
            <span>1月</span>
            <span>6月</span>
            <span>12月</span>
          </div>
        </div>
      </div>

      <div className="px-7 mb-3 text-[11px] tracking-[1.5px] text-[#9B9588] font-semibold">
        物件別ランキング
      </div>
      <div className="px-6 mb-7">
        {ranking.length === 0 ? (
          <div className="bg-white/60 rounded-2xl p-6 text-center text-[12px] text-[#9B9588]">
            所有物件がありません
          </div>
        ) : (
          ranking.map((r, idx) => (
            <Link
              key={r.property.id}
              href={`/properties/${r.property.id}`}
              className="flex items-center gap-3 bg-white rounded-2xl p-3 mb-2 shadow-sm active:bg-[#FAFAF7]"
            >
              <div className="w-6 text-[14px] font-bold text-[#9B9588] num">{idx + 1}</div>
              <Thumb src={r.property.photo} size={42} rounded={9} />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold truncate">{r.property.name}</div>
                <div className="mt-1.5 h-1 bg-[#F0EDE5] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(Math.abs(r.balance) / maxRank) * 100}%`,
                      background: r.balance >= 0 ? "#86C998" : "#E8B4A6",
                    }}
                  />
                </div>
              </div>
              <div
                className="text-[14px] font-bold num shrink-0"
                style={{ color: r.balance >= 0 ? "#3D8B4E" : "#B85450" }}
              >
                {formatYenShort(r.balance, { sign: r.balance > 0 })}
              </div>
            </Link>
          ))
        )}
      </div>

      <div className="px-6 mb-8">
        <button
          onClick={exportCSV}
          className="w-full py-4 rounded-2xl bg-[#1F1F1F] text-white text-[14px] font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <DownloadIcon size={16} />
          {year}年のデータを CSV 出力
        </button>
        <p className="text-[10px] text-[#9B9588] text-center mt-3 leading-relaxed">
          CSV は確定申告ソフトに取り込めます。
          <br />
          Excel/Numbers でも UTF-8(BOM付) で文字化けせず開けます。
        </p>
      </div>
    </div>
  );
}
