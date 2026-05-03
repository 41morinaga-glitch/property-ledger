"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { actions, useAppData } from "@/lib/store";
import { ChevronLeft } from "@/components/Icon";
import { getSettings, type AppData } from "@/lib/types";
import { fiscalPeriodOf } from "@/lib/calc";
import {
  getLastSyncAt,
  getStoredEmail,
  isConfigured,
  isSignedIn,
  signIn,
  signOut,
} from "@/lib/drive";
import { forcePullRemote, forcePushLocal, resetSyncState, syncOnce } from "@/lib/sync";

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
        <Section title="決算期">
          <FiscalCard data={data} />
        </Section>

        <Section title="クラウド同期">
          <DriveSyncCard onMessage={setMsg} />
        </Section>

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

function FiscalCard({ data }: { data: AppData }) {
  const settings = getSettings(data);
  const period = fiscalPeriodOf(settings.fiscalStartMonth);
  return (
    <Card>
      <div className="px-4 pt-4 pb-2">
        <div className="text-[14px] font-semibold mb-1">決算月の開始</div>
        <div className="text-[11px] text-[#9B9588] leading-relaxed mb-3">
          12ヶ月の達成率はこの月から1年間で計算されます。日本の会社員は通常 4月、個人事業主は 1月。
        </div>
        <div className="grid grid-cols-6 gap-1.5">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
            const active = m === settings.fiscalStartMonth;
            return (
              <button
                key={m}
                type="button"
                onClick={() => actions.updateSettings({ fiscalStartMonth: m })}
                className="py-2 rounded-lg text-[13px] font-semibold num transition-all"
                style={{
                  background: active ? "#1F1F1F" : "#F0EDE5",
                  color: active ? "#FFFFFF" : "#1F1F1F",
                  boxShadow: active ? "0 2px 6px rgba(31,31,31,0.18)" : "none",
                }}
              >
                {m}
              </button>
            );
          })}
        </div>
      </div>
      <div className="border-t border-[#F5F2EB] px-4 py-3 text-[11px] text-[#7A6F5C] leading-relaxed num">
        現在の決算期: <span className="font-semibold text-[#1F1F1F]">{period.label}</span>(
        {period.startYear}年{period.startMonthIdx + 1}月 〜 {period.endYear}年{period.endMonthIdx + 1}月)
      </div>
    </Card>
  );
}

function DriveSyncCard({ onMessage }: { onMessage: (m: string) => void }) {
  const [signedIn, setSignedIn] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = () => {
    setSignedIn(isSignedIn());
    setEmail(getStoredEmail());
    setLastSync(getLastSyncAt());
  };

  useEffect(() => {
    refresh();
  }, []);

  if (!isConfigured()) {
    return (
      <Card>
        <div className="px-4 py-4">
          <div className="text-[14px] font-semibold mb-1">Google Drive 同期は未設定</div>
          <div className="text-[11px] text-[#9B9588] leading-relaxed">
            管理者がデプロイ時に Google OAuth クライアントID(<code className="text-[10px]">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code>)を設定する必要があります。設定後、ここから Google アカウントでサインインしてデバイス間で同期できます。
          </div>
        </div>
      </Card>
    );
  }

  const handleSignIn = async () => {
    setLoading(true);
    try {
      await signIn();
      refresh();
      const r = await syncOnce();
      if (r.status === "ok") {
        if (r.direction === "pulled") onMessage("Driveから読み込みました");
        else if (r.direction === "pushed") onMessage("Driveに保存しました");
        else onMessage("同期OK(変更なし)");
      } else if (r.status === "error") {
        onMessage(`同期エラー: ${r.message}`);
      } else if (r.status === "conflict") {
        onMessage("ローカルとクラウドの両方に変更があります。手動で同期してください。");
      }
      refresh();
    } catch (e) {
      onMessage(`サインイン失敗: ${e instanceof Error ? e.message : "不明"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (!confirm("Google アカウントからサインアウトしますか?ローカルデータはこの端末に残ります。")) return;
    setLoading(true);
    try {
      await signOut();
      resetSyncState();
      refresh();
      onMessage("サインアウトしました");
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setLoading(true);
    try {
      const r = await syncOnce();
      if (r.status === "ok") {
        if (r.direction === "pulled") onMessage("Driveから読み込みました");
        else if (r.direction === "pushed") onMessage("Driveに保存しました");
        else onMessage("同期OK(変更なし)");
      } else if (r.status === "error") {
        onMessage(`同期エラー: ${r.message}`);
      } else if (r.status === "conflict") {
        onMessage("ローカルとクラウドに同時変更あり。下のボタンでどちらを採用するか選んでください");
      }
      refresh();
    } finally {
      setLoading(false);
    }
  };

  const handlePush = async () => {
    if (!confirm("ローカルのデータでクラウドを上書きします。よろしいですか?")) return;
    setLoading(true);
    const r = await forcePushLocal();
    onMessage(r.status === "ok" ? "クラウドに上書きしました" : `失敗: ${r.message ?? ""}`);
    refresh();
    setLoading(false);
  };

  const handlePull = async () => {
    if (!confirm("クラウドのデータでローカルを上書きします。よろしいですか?")) return;
    setLoading(true);
    const r = await forcePullRemote();
    onMessage(r.status === "ok" ? "クラウドから読み込みました" : `失敗: ${r.message ?? ""}`);
    refresh();
    setLoading(false);
  };

  return (
    <Card>
      {!signedIn ? (
        <div className="px-4 py-5">
          <div className="text-[14px] font-semibold mb-1">他のデバイスとデータを共有</div>
          <div className="text-[11px] text-[#9B9588] leading-relaxed mb-4">
            ご自身の Google Drive にデータを保存します。製作者は内容を見ることができません(専用フォルダ <code className="text-[10px]">drive.appdata</code> のみアクセス)。
          </div>
          <button
            type="button"
            onClick={handleSignIn}
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-white border border-[#D8D2C5] text-[14px] font-semibold flex items-center justify-center gap-2.5 active:scale-[0.98] disabled:opacity-50"
          >
            <GoogleIcon />
            <span>{loading ? "サインイン中…" : "Google でサインイン"}</span>
          </button>
        </div>
      ) : (
        <>
          <div className="px-4 py-4 border-b border-[#F5F2EB]">
            <div className="flex items-center gap-3">
              <GoogleIcon />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold truncate">{email ?? "Google アカウント"}</div>
                <div className="text-[10px] text-[#9B9588] mt-0.5">
                  最終同期 {lastSync ? formatRelative(lastSync) : "—"}
                </div>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSync}
            disabled={loading}
            className="w-full text-left px-4 py-3.5 border-b border-[#F5F2EB] active:bg-[#FAFAF7] disabled:opacity-50"
          >
            <div className="text-[14px] font-semibold">いま同期する</div>
            <div className="text-[11px] text-[#9B9588] mt-0.5">差分があれば自動的にやり取りします</div>
          </button>
          <button
            type="button"
            onClick={handlePush}
            disabled={loading}
            className="w-full text-left px-4 py-3.5 border-b border-[#F5F2EB] active:bg-[#FAFAF7] disabled:opacity-50"
          >
            <div className="text-[14px] font-semibold">この端末を優先してクラウドへ送る</div>
            <div className="text-[11px] text-[#9B9588] mt-0.5">クラウド側を上書きします</div>
          </button>
          <button
            type="button"
            onClick={handlePull}
            disabled={loading}
            className="w-full text-left px-4 py-3.5 border-b border-[#F5F2EB] active:bg-[#FAFAF7] disabled:opacity-50"
          >
            <div className="text-[14px] font-semibold">クラウドを優先してこの端末に取り込む</div>
            <div className="text-[11px] text-[#9B9588] mt-0.5">この端末を上書きします</div>
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={loading}
            className="w-full text-left px-4 py-3.5 active:bg-[#FAFAF7] disabled:opacity-50"
          >
            <div className="text-[14px] font-semibold text-[#B85450]">サインアウト</div>
            <div className="text-[11px] text-[#9B9588] mt-0.5">ローカルデータはこの端末に残ります</div>
          </button>
        </>
      )}
    </Card>
  );
}

function formatRelative(iso: string): string {
  const t = Date.parse(iso);
  if (!t) return iso;
  const diff = Date.now() - t;
  const min = Math.round(diff / 60000);
  if (min < 1) return "たった今";
  if (min < 60) return `${min}分前`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h}時間前`;
  const d = Math.round(h / 24);
  return `${d}日前`;
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.6 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.4-4.2 5.8l6.2 5.2C40.7 35.8 44 30.3 44 24c0-1.2-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}
