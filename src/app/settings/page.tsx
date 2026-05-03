"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { actions, useAppData } from "@/lib/store";
import { ChevronLeft } from "@/components/Icon";
import type { AppData } from "@/lib/types";

export default function SettingsPage() {
  const router = useRouter();
  const data = useAppData();
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `property-ledger_${stamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMsg("バックアップを書き出しました");
  };

  const importJson = async (file: File | null) => {
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as AppData;
      if (parsed.version !== 1 || !Array.isArray(parsed.properties)) {
        throw new Error("ファイル形式が不正です");
      }
      if (
        !confirm(
          `現在のデータを ${parsed.properties.length} 件の物件 / ${parsed.transactions.length} 件の記録で置き換えます。よろしいですか?`,
        )
      )
        return;
      actions.importData(parsed);
      setMsg("読み込みました");
    } catch (e) {
      setMsg(`読み込みに失敗: ${e instanceof Error ? e.message : "不明なエラー"}`);
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const reset = () => {
    if (
      !confirm(
        "すべての物件と記録を削除します。この操作は取り消せません。先にバックアップを書き出しましたか?",
      )
    )
      return;
    actions.reset();
    router.push("/");
  };

  return (
    <div className="pb-10">
      <div className="flex items-center justify-between px-5 pt-5 pb-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full bg-white grid place-items-center shadow-sm active:scale-95"
          aria-label="戻る"
        >
          <ChevronLeft />
        </button>
        <div className="text-[15px] font-bold">設定</div>
        <div className="w-9" />
      </div>

      <div className="px-6 pt-4">
        <Section title="データ">
          <Card>
            <Item
              title="バックアップを書き出す"
              desc="物件・記録すべてを JSON ファイルでダウンロード"
              onClick={exportJson}
            />
            <Item
              title="バックアップから読み込む"
              desc="書き出した JSON を読み込んで復元(現在のデータは置き換わります)"
              onClick={() => fileRef.current?.click()}
            />
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => importJson(e.target.files?.[0] ?? null)}
            />
          </Card>
        </Section>

        <Section title="統計">
          <Card>
            <StatRow label="所有物件" value={`${data.properties.filter((p) => p.status === "owned").length} 件`} />
            <StatRow
              label="検討中物件"
              value={`${data.properties.filter((p) => p.status === "considering").length} 件`}
            />
            <StatRow label="記録数" value={`${data.transactions.length} 件`} />
          </Card>
        </Section>

        <Section title="サンプル / リセット">
          <Card>
            <Item
              title="サンプルデータを読み込む"
              desc="現在のデータを置き換えてサンプルにする(使い方の確認用)"
              onClick={() => {
                if (!confirm("現在のデータを置き換えてサンプルを読み込みますか?")) return;
                actions.loadSample();
                setMsg("サンプルを読み込みました");
              }}
            />
            <Item
              title="すべてのデータを削除"
              desc="物件と記録のすべてを完全に削除します"
              danger
              onClick={reset}
            />
          </Card>
        </Section>

        <Section title="プライバシー">
          <Card>
            <div className="px-4 py-4 text-[12px] text-[#7A6F5C] leading-relaxed">
              データはこの端末のブラウザ(localStorage)にのみ保存されます。サーバー・運営者が閲覧することはありません。ブラウザを変えると見えなくなるので、定期的にバックアップを書き出してください。
            </div>
          </Card>
        </Section>

        {msg && (
          <div className="fixed left-1/2 -translate-x-1/2 bottom-28 z-50 bg-[#1F1F1F] text-white text-[12px] px-4 py-2.5 rounded-full shadow-lg animate-fade-in">
            {msg}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="text-[11px] tracking-[1.5px] text-[#9B9588] font-semibold mb-2 px-1">
        {title}
      </div>
      {children}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">{children}</div>
  );
}

function Item({
  title,
  desc,
  onClick,
  danger,
}: {
  title: string;
  desc: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left px-4 py-3.5 border-b border-[#F5F2EB] last:border-b-0 active:bg-[#FAFAF7]"
    >
      <div
        className="text-[14px] font-semibold"
        style={{ color: danger ? "#B85450" : "#1F1F1F" }}
      >
        {title}
      </div>
      <div className="text-[11px] text-[#9B9588] mt-1 leading-relaxed">{desc}</div>
    </button>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center px-4 py-3 border-b border-[#F5F2EB] last:border-b-0">
      <div className="text-[13px] text-[#7A6F5C]">{label}</div>
      <div className="text-[14px] font-semibold num">{value}</div>
    </div>
  );
}
