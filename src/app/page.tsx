"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAppData, actions } from "@/lib/store";
import { currentYm, formatYen, formatYenShort, greeting } from "@/lib/format";
import { balance, expense, income, monthSummary, monthlyCFEstimate, txByProperty } from "@/lib/calc";
import { PropertyCard } from "@/components/PropertyCard";
import { MonthCarousel } from "@/components/MonthCarousel";
import { ChevronRight } from "@/components/Icon";

export default function HomePage() {
  const data = useAppData();
  const [ym, setYm] = useState<string>(currentYm());
  const [hello, setHello] = useState("");

  useEffect(() => {
    setHello(greeting());
  }, []);

  const owned = useMemo(() => data.properties.filter((p) => p.status === "owned"), [data.properties]);
  const considering = useMemo(
    () => data.properties.filter((p) => p.status === "considering"),
    [data.properties],
  );

  const total = useMemo(() => monthSummary(data.transactions, ym), [data.transactions, ym]);
  const lifetime = useMemo(() => {
    const txs = data.transactions;
    return {
      balance: balance(txs),
      income: income(txs),
      expense: expense(txs),
    };
  }, [data.transactions]);

  const isFirstUse = data.properties.length === 0 && data.transactions.length === 0;

  if (isFirstUse) return <Onboarding />;

  const lifetimeColor = lifetime.balance >= 0 ? "#3D8B4E" : "#B85450";
  const monthColor = total.balance >= 0 ? "#3D8B4E" : "#B85450";
  const considerSum = considering.reduce((s, p) => s + monthlyCFEstimate(p), 0);

  return (
    <div className="pt-4">
      <div className="flex justify-between items-center px-7 pt-3">
        <MonthCarousel ym={ym} onChange={setYm} />
        <div className="text-xs text-[#9B9588] font-medium">{hello}</div>
      </div>

      <div className="text-center px-7 py-10">
        <div className="text-[11px] tracking-[2px] text-[#9B9588] mb-3">累計</div>
        <div
          className="text-[52px] font-bold num animate-fade-up"
          style={{ color: lifetimeColor, letterSpacing: "-1.5px", lineHeight: 1 }}
        >
          {formatYen(lifetime.balance, { sign: lifetime.balance > 0 })}
        </div>
        <div className="flex justify-center gap-6 mt-5 text-[11px] text-[#9B9588]">
          <span>累計収入 <span className="num text-[#3D8B4E] font-semibold">{formatYen(lifetime.income)}</span></span>
          <span>累計支出 <span className="num text-[#B85450] font-semibold">{formatYen(lifetime.expense)}</span></span>
        </div>

        <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 text-[12px]">
          <span className="text-[#9B9588]">今月</span>
          <span className="num font-semibold" style={{ color: monthColor }}>
            {formatYen(total.balance, { sign: total.balance > 0 })}
          </span>
        </div>
      </div>

      <div className="h-px bg-[#EFEBE3] mx-7 mb-6" />

      <SectionHeader
        left="所有"
        right={`${owned.length}件`}
        addHref="/properties/new?status=owned"
      />
      <div className="px-6 mb-6">
        {owned.length === 0 ? (
          <EmptyMini text="まだ物件が登録されていません" />
        ) : (
          owned.map((p) => {
            const monthBal = monthSummary(txByProperty(data.transactions, p.id), ym).balance;
            return <PropertyCard key={p.id} property={p} monthBalance={monthBal} />;
          })
        )}
      </div>

      <SectionHeader
        left="検討中"
        right={`${considering.length}件`}
        addHref="/properties/new?status=considering"
      />
      <div className="px-6 mb-8">
        {considering.length === 0 ? (
          <EmptyMini text="検討中の物件はありません" />
        ) : (
          <>
            <ConsiderBanner top={considering[0]} totalAdd={considerSum} count={considering.length} />
            {considering.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function SectionHeader({
  left,
  right,
  addHref,
}: {
  left: string;
  right: string;
  addHref: string;
}) {
  return (
    <div className="flex justify-between items-baseline px-7 pb-3.5">
      <div className="text-[13px] font-semibold text-[#9B9588] tracking-wider">{left}</div>
      <div className="flex items-center gap-3 text-[11px] text-[#9B9588]">
        <span>{right}</span>
        <Link href={addHref} className="text-[#1F1F1F] font-semibold active:opacity-60">
          ＋追加
        </Link>
      </div>
    </div>
  );
}

function EmptyMini({ text }: { text: string }) {
  return (
    <div className="text-center text-[12px] text-[#9B9588] py-5 bg-white/60 rounded-xl">
      {text}
    </div>
  );
}

function ConsiderBanner({
  top,
  totalAdd,
  count,
}: {
  top: { id: string; name: string };
  totalAdd: number;
  count: number;
}) {
  return (
    <Link
      href={`/properties/${top.id}`}
      className="block mb-3 rounded-2xl p-4 text-white relative overflow-hidden active:opacity-90"
      style={{
        background: "linear-gradient(135deg, #4F7CAC 0%, #3A5F8A 100%)",
      }}
    >
      <span
        className="absolute -top-8 -right-8 w-24 h-24 rounded-full"
        style={{ background: "rgba(255,255,255,0.06)" }}
      />
      <div className="flex items-center gap-2 text-[10px] opacity-85 tracking-[1.5px] mb-2.5">
        シミュレーション
      </div>
      <div className="text-sm font-semibold leading-snug mb-3">
        「<span className="bg-white/20 px-2 py-0.5 rounded-md font-bold">{top.name}</span>」を買えば、
        <br />
        月収支が <span className="bg-white/20 px-2 py-0.5 rounded-md font-bold num">{formatYenShort(totalAdd, { sign: true })}</span>
        {count > 1 ? " 程度プラスの試算" : " 増える試算"}
      </div>
      <div className="flex items-center justify-between text-[11px] opacity-90">
        <span>詳細を見る</span>
        <ChevronRight size={14} />
      </div>
    </Link>
  );
}

function Onboarding() {
  return (
    <div className="px-7 pt-16 pb-10">
      <div className="text-center mb-12">
        <div className="text-[10px] tracking-[3px] text-[#9B9588] font-semibold mb-3">PROPERTY LEDGER</div>
        <h1 className="text-3xl font-bold tracking-tight">物件ノート</h1>
        <p className="text-sm text-[#7A6F5C] mt-3 leading-relaxed">
          持っている物件の家計簿。
          <br />
          家賃と経費を、10秒で記録。
        </p>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm mb-3">
        <div className="text-[11px] tracking-[1.5px] text-[#3D8B4E] font-semibold mb-1.5">STEP 1</div>
        <div className="text-base font-bold mb-1">物件を追加する</div>
        <p className="text-[12px] text-[#7A6F5C] leading-relaxed mb-4">
          所有している物件、検討中の物件のどちらでもOK。写真と家賃を入れるだけ。
        </p>
        <Link
          href="/properties/new?status=owned"
          className="block py-3 rounded-xl bg-[#1F1F1F] text-white text-center text-sm font-semibold active:scale-[0.98] transition-transform"
        >
          所有物件を追加
        </Link>
        <Link
          href="/properties/new?status=considering"
          className="block py-3 rounded-xl mt-2 bg-[#F0EDE5] text-[#1F1F1F] text-center text-sm font-semibold active:scale-[0.98] transition-transform"
        >
          検討中の物件を追加
        </Link>
      </div>

      <button
        onClick={() => actions.loadSample()}
        className="w-full py-3 rounded-xl text-[13px] text-[#7A6F5C] active:bg-white/40"
      >
        まずはサンプルデータで試す
      </button>

      <p className="text-center text-[10px] text-[#9B9588] mt-10 leading-relaxed">
        すべてのデータはあなたのこの端末のブラウザにのみ保存されます。
        <br />
        サーバーには一切送信されません。
      </p>
    </div>
  );
}
