"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { actions, useAppData } from "@/lib/store";
import {
  balance,
  effectiveMonthlyExpense,
  grossYield,
  last12Months,
  monthlyCFEstimate,
  monthSummary,
  netYield,
  txByProperty,
} from "@/lib/calc";
import {
  currentYm,
  formatJpDate,
  formatPercent,
  formatYen,
  formatYenShort,
} from "@/lib/format";
import { ChevronLeft, MoreIcon, PlusIcon, TrashIcon } from "@/components/Icon";
import { Thumb } from "@/components/Thumb";
import { RecordSheet } from "@/components/RecordSheet";

export default function PropertyDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const data = useAppData();
  const [recordOpen, setRecordOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const property = data.properties.find((p) => p.id === params.id);
  const ym = useMemo(() => currentYm(), []);

  const txs = useMemo(
    () => (property ? txByProperty(data.transactions, property.id) : []),
    [data.transactions, property],
  );

  if (!property) {
    return (
      <div className="px-7 pt-20 text-center">
        <div className="text-sm text-[#9B9588] mb-4">物件が見つかりません</div>
        <Link href="/properties" className="text-[#1F1F1F] underline text-sm">
          物件一覧へ
        </Link>
      </div>
    );
  }

  const isOwned = property.status === "owned";
  const month = monthSummary(txs, ym);
  const lifetimeBalance = balance(txs);

  const monthly12 = last12Months(txs, ym);
  const max12 = Math.max(1, ...monthly12.map((m) => Math.abs(m.balance)));

  const projectedMonthly = monthlyCFEstimate(property);
  const projected30y = projectedMonthly * 12 * 30;

  const recordedTx = [...txs].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 30);

  return (
    <div className="pb-10">
      <div className="relative">
        {property.photo ? (
          <div
            className="aspect-[16/12] bg-cover bg-center"
            style={{ backgroundImage: `url(${property.photo})` }}
          />
        ) : (
          <div className="aspect-[16/12] bg-gradient-to-br from-[#E8DFD0] to-[#D4C5A8] grid place-items-center">
            <Thumb size={80} rounded={20} />
          </div>
        )}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/30 to-transparent pointer-events-none" />
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="戻る"
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/90 grid place-items-center shadow-md backdrop-blur"
        >
          <ChevronLeft />
        </button>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="メニュー"
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 grid place-items-center shadow-md backdrop-blur"
        >
          <MoreIcon />
        </button>
        {menuOpen && (
          <div className="absolute top-16 right-4 z-30 bg-white rounded-xl shadow-lg overflow-hidden min-w-[180px]">
            <Link
              href={`/properties/${property.id}/edit`}
              className="block px-4 py-3 text-sm hover:bg-[#F7F5F0] active:bg-[#F0EDE5]"
            >
              編集する
            </Link>
            {isOwned ? (
              <button
                onClick={() => {
                  actions.setPropertyStatus(property.id, "considering");
                  setMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-3 text-sm hover:bg-[#F7F5F0] active:bg-[#F0EDE5] border-t border-[#F0EDE5]"
              >
                検討中に戻す
              </button>
            ) : (
              <button
                onClick={() => {
                  actions.setPropertyStatus(property.id, "owned");
                  setMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-3 text-sm hover:bg-[#F7F5F0] active:bg-[#F0EDE5] border-t border-[#F0EDE5]"
              >
                所有へ移す
              </button>
            )}
            <button
              onClick={() => {
                if (!confirm("この物件を削除します。記録もすべて削除されます。")) return;
                actions.deleteProperty(property.id);
                router.push("/properties");
              }}
              className="block w-full text-left px-4 py-3 text-sm text-[#B85450] border-t border-[#F0EDE5]"
            >
              削除する
            </button>
          </div>
        )}
        {!isOwned && (
          <span className="absolute bottom-3 left-4 px-2.5 py-1 rounded-full bg-[#4F7CAC] text-white text-[10px] font-bold tracking-wider">
            検討中
          </span>
        )}
      </div>

      <div className="px-6 pt-6">
        <div className="text-[11px] tracking-[1.5px] text-[#9B9588] font-semibold">
          {property.address || "—"}
        </div>
        <h1 className="text-[24px] font-bold mt-1 tracking-tight">{property.name}</h1>
      </div>

      <div className="text-center px-6 pt-7 pb-2">
        <div className="text-[11px] tracking-[2px] text-[#9B9588] mb-2">
          {isOwned ? "今月の収支" : "想定 月CF"}
        </div>
        <div
          className="text-[48px] font-bold num animate-fade-up"
          style={{
            color: isOwned
              ? month.balance >= 0
                ? "#3D8B4E"
                : "#B85450"
              : "#4F7CAC",
            letterSpacing: "-1.5px",
            lineHeight: 1,
          }}
        >
          {isOwned
            ? formatYen(month.balance, { sign: month.balance > 0 })
            : formatYen(projectedMonthly, { sign: projectedMonthly > 0 })}
        </div>
        {isOwned && (
          <div className="flex justify-center gap-6 mt-4 text-[11px] text-[#9B9588]">
            <span>
              収入 <span className="num text-[#3D8B4E] font-semibold">{formatYen(month.income)}</span>
            </span>
            <span>
              支出 <span className="num text-[#B85450] font-semibold">{formatYen(month.expense)}</span>
            </span>
          </div>
        )}
      </div>

      <div className="mx-6 mt-6 mb-6 bg-white rounded-2xl p-5 shadow-sm">
        <Row label="家賃 (月)" value={formatYen(property.rent)} />
        {property.managementFee ? (
          <Row label="管理費 (月)" value={formatYen(property.managementFee)} />
        ) : null}
        {property.propertyTax ? (
          <Row
            label="固定資産税 (年)"
            value={formatYen(property.propertyTax)}
            hint={`月割 ${formatYen(Math.round(property.propertyTax / 12))}`}
          />
        ) : null}
        {property.monthlyExpense ? (
          <Row label="その他経費 (月)" value={formatYen(property.monthlyExpense)} />
        ) : null}
        <Row
          label="経費合計 (月)"
          value={formatYen(effectiveMonthlyExpense(property))}
          accent={false}
          subtle
        />
        {property.purchasePrice && (
          <>
            <Row label="購入価格" value={formatYenShort(property.purchasePrice)} />
            <Row
              label="表面利回り"
              value={formatPercent(grossYield(property))}
              hint="家賃 × 12 / 購入価格"
            />
            <Row
              label="実質利回り"
              value={formatPercent(netYield(property))}
              hint="(家賃 − 経費) × 12 / 購入価格"
              accent
            />
          </>
        )}
        {!isOwned && (
          <Row label="30年累計予測" value={formatYenShort(projected30y, { sign: true })} accent />
        )}
        {isOwned && property.acquiredAt && (
          <Row label="取得日" value={formatJpDate(property.acquiredAt)} last />
        )}
      </div>

      {isOwned && (
        <>
          <div className="px-7 mb-3 flex items-baseline justify-between">
            <div className="text-[11px] tracking-[1.5px] text-[#9B9588] font-semibold">
              過去12ヶ月の収支
            </div>
            <div className="text-[11px] text-[#9B9588] num">
              累計 <span className="text-[#3D8B4E] font-semibold">{formatYen(lifetimeBalance, { sign: lifetimeBalance > 0 })}</span>
            </div>
          </div>
          <div className="mx-6 bg-white rounded-2xl p-4 shadow-sm mb-6">
            <div className="flex items-end gap-1.5 h-32">
              {monthly12.map((m) => {
                const h = (Math.abs(m.balance) / max12) * 100;
                const positive = m.balance >= 0;
                return (
                  <div key={m.ym} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full h-full flex flex-col justify-end">
                      <div
                        className="rounded-t-md w-full"
                        style={{
                          height: `${Math.max(2, h)}%`,
                          background: positive ? "#86C998" : "#E8B4A6",
                          minHeight: 4,
                        }}
                      />
                    </div>
                    <div className="text-[9px] text-[#9B9588] num">{Number(m.ym.slice(5))}</div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 text-center text-[10px] text-[#9B9588]">
              この物件の月別収支(緑=プラス・コーラル=マイナス)
            </div>
          </div>
        </>
      )}

      {isOwned && (
        <div className="px-6 mb-6">
          <div className="flex items-baseline justify-between mb-3 px-1">
            <div className="text-[11px] tracking-[1.5px] text-[#9B9588] font-semibold">
              最近の記録
            </div>
            <button
              onClick={() => setRecordOpen(true)}
              className="text-[12px] text-[#1F1F1F] font-semibold flex items-center gap-1 active:opacity-60"
            >
              <PlusIcon size={14} /> 記録する
            </button>
          </div>
          {recordedTx.length === 0 ? (
            <div className="bg-white/60 rounded-xl text-center text-[12px] text-[#9B9588] py-6">
              まだ記録がありません。＋ボタンから入力できます。
            </div>
          ) : (
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
              {recordedTx.map((t, i) => (
                <div
                  key={t.id}
                  className={`flex items-center justify-between px-4 py-3 ${
                    i < recordedTx.length - 1 ? "border-b border-[#F5F2EB]" : ""
                  }`}
                >
                  <div>
                    <div className="text-[13px] font-semibold">
                      {t.kind === "income" ? "家賃" : "経費"}
                    </div>
                    <div className="text-[10px] text-[#9B9588] mt-0.5">
                      {formatJpDate(t.date)}
                      {t.memo ? ` · ${t.memo}` : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className="text-[14px] font-bold num"
                      style={{ color: t.kind === "income" ? "#3D8B4E" : "#B85450" }}
                    >
                      {t.kind === "income" ? "+" : "-"}
                      {formatYen(t.amount)}
                    </div>
                    <button
                      onClick={() => {
                        if (!confirm("この記録を削除しますか?")) return;
                        actions.deleteTransaction(t.id);
                      }}
                      aria-label="削除"
                      className="text-[#9B9588] active:text-[#B85450]"
                    >
                      <TrashIcon size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!isOwned && (
        <div className="px-6 mb-6">
          <div className="bg-gradient-to-br from-[#4F7CAC] to-[#3A5F8A] text-white rounded-2xl p-5 shadow-md">
            <div className="text-[10px] tracking-[1.5px] opacity-80 font-semibold mb-2">
              買ったら、こう変わる
            </div>
            <div className="text-[14px] leading-relaxed mb-4">
              いまのポートフォリオに追加すると、
              <br />
              月収支が <span className="font-bold num bg-white/20 px-2 py-0.5 rounded-md">{formatYen(projectedMonthly, { sign: true })}</span> 増える試算
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Stat
                label="月CF"
                value={formatYen(projectedMonthly, { sign: projectedMonthly > 0 })}
              />
              <Stat label="年CF" value={formatYenShort(projectedMonthly * 12, { sign: true })} />
              <Stat label="30年累計" value={formatYenShort(projected30y, { sign: true })} />
              <Stat
                label="表面利回り"
                value={property.purchasePrice ? formatPercent(grossYield(property)) : "—"}
              />
            </div>
          </div>
          <button
            onClick={() => {
              actions.setPropertyStatus(property.id, "owned");
              router.push(`/properties/${property.id}`);
            }}
            className="w-full mt-4 py-4 rounded-2xl bg-[#1F1F1F] text-white font-semibold text-[14px] active:scale-[0.98] transition-transform"
          >
            購入した — 所有へ移す
          </button>
        </div>
      )}

      <RecordSheet
        open={recordOpen}
        onClose={() => setRecordOpen(false)}
        onSaved={() => setRecordOpen(false)}
        defaultPropertyId={property.id}
      />
    </div>
  );
}

function Row({
  label,
  value,
  hint,
  accent,
  subtle,
  last,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
  subtle?: boolean;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between py-3 ${last ? "" : "border-b border-[#F5F2EB]"}`}
    >
      <div>
        <div
          className="text-[12px] font-medium"
          style={{ color: subtle ? "#B5B0A4" : "#9B9588" }}
        >
          {label}
        </div>
        {hint && <div className="text-[10px] text-[#B5B0A4] mt-0.5">{hint}</div>}
      </div>
      <div
        className="text-[15px] font-bold num"
        style={{
          color: accent ? "#3D8B4E" : subtle ? "#7A6F5C" : "#1F1F1F",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/12 rounded-xl px-3 py-2.5 backdrop-blur" style={{ background: "rgba(255,255,255,0.12)" }}>
      <div className="text-[10px] opacity-90">{label}</div>
      <div className="text-[14px] font-bold num mt-1">{value}</div>
    </div>
  );
}
