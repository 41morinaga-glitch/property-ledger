"use client";

import { useEffect, useMemo, useState } from "react";
import { actions, useAppData } from "@/lib/store";
import { formatJpDate, formatYen, todayISO } from "@/lib/format";
import { CalIcon, BuildingIcon, ChevronRight, DeleteKeyIcon } from "./Icon";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  defaultPropertyId?: string;
}

export function RecordSheet({ open, onClose, onSaved, defaultPropertyId }: Props) {
  const data = useAppData();
  const owned = useMemo(() => data.properties.filter((p) => p.status === "owned"), [data.properties]);
  const [kind, setKind] = useState<"income" | "expense">("income");
  const [amount, setAmount] = useState<string>("");
  const [propertyId, setPropertyId] = useState<string>("");
  const [date, setDate] = useState<string>(todayISO());
  const [showPicker, setShowPicker] = useState<"property" | "date" | null>(null);

  useEffect(() => {
    if (!open) return;
    setAmount("");
    setKind("income");
    setDate(todayISO());
    setPropertyId(defaultPropertyId || owned[0]?.id || "");
    setShowPicker(null);
  }, [open, defaultPropertyId, owned]);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const amountNum = Number(amount || "0");
  const canSave = amountNum > 0 && propertyId;
  const selectedProperty = data.properties.find((p) => p.id === propertyId);
  const display = amountNum > 0 ? formatYen(kind === "income" ? amountNum : -amountNum, { sign: true }) : "¥0";
  const color = kind === "income" ? "#3D8B4E" : "#B85450";

  const press = (key: string) => {
    if (key === "del") {
      setAmount((a) => a.slice(0, -1));
      return;
    }
    setAmount((a) => {
      const next = (a + key).replace(/^0+(?=\d)/, "");
      if (next.length > 9) return a;
      return next;
    });
  };

  const handleSave = () => {
    if (!canSave) return;
    actions.addTransaction({
      propertyId,
      kind,
      amount: amountNum,
      date,
    });
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      <button
        type="button"
        aria-label="閉じる"
        className="absolute inset-0 bg-black/40 animate-fade-in"
        style={{ backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-[480px] bg-[#FAFAF7] rounded-t-[28px] pt-2 pb-6 animate-slide-up"
        style={{ boxShadow: "0 -10px 30px rgba(0,0,0,0.18)", paddingBottom: "max(22px, env(safe-area-inset-bottom))" }}
      >
        <div className="w-9 h-1 bg-[#C0BBB0] rounded-full mx-auto mb-2" />
        <div className="flex items-center justify-between px-6 pt-3 pb-4">
          <div className="text-[17px] font-bold">記録する</div>
          <button onClick={onClose} className="text-[#9B9588] text-sm font-medium">
            キャンセル
          </button>
        </div>

        <div className="mx-6 mb-5 p-1 flex bg-[#F0EDE5] rounded-xl">
          <Pill active={kind === "income"} color="#3D8B4E" onClick={() => setKind("income")}>
            家賃
          </Pill>
          <Pill active={kind === "expense"} color="#B85450" onClick={() => setKind("expense")}>
            経費
          </Pill>
        </div>

        <div className="text-center px-6 pb-5">
          <div className="text-[11px] tracking-[2px] text-[#9B9588] mb-2">金額</div>
          <div className="text-[44px] font-bold leading-none num" style={{ color, letterSpacing: "-1.5px" }}>
            {display}
            <span
              className="inline-block w-[2.5px] h-[32px] ml-1 align-middle animate-blink"
              style={{ background: color }}
            />
          </div>
        </div>

        <div className="flex gap-2 px-6 pb-4">
          <button
            type="button"
            onClick={() => setShowPicker("property")}
            className="flex-1 bg-white rounded-xl p-3 flex items-center gap-2.5 shadow-sm text-left"
          >
            <span className="w-8 h-8 rounded-lg bg-[#F7F5F0] grid place-items-center shrink-0 text-[#1a1a1a]">
              <BuildingIcon size={14} />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-[9px] tracking-wider text-[#9B9588]">物件</span>
              <span className="block text-[13px] font-semibold truncate">
                {selectedProperty?.name || "未選択"}
              </span>
            </span>
            <ChevronRight />
          </button>
          <button
            type="button"
            onClick={() => setShowPicker("date")}
            className="bg-white rounded-xl p-3 flex items-center gap-2.5 shadow-sm text-left min-w-[120px]"
          >
            <span className="w-8 h-8 rounded-lg bg-[#F7F5F0] grid place-items-center shrink-0">
              <CalIcon size={14} />
            </span>
            <span className="min-w-0">
              <span className="block text-[9px] tracking-wider text-[#9B9588]">日付</span>
              <span className="block text-[13px] font-semibold whitespace-nowrap">{formatJpDate(date)}</span>
            </span>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-1.5 px-4">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((k) => (
            <Key key={k} onPress={() => press(k)}>
              {k}
            </Key>
          ))}
          <Key onPress={() => press("000")} variant="special">
            000
          </Key>
          <Key onPress={() => press("0")}>0</Key>
          <Key onPress={() => press("del")} variant="delete">
            <DeleteKeyIcon size={22} />
          </Key>
        </div>

        <button
          onClick={handleSave}
          disabled={!canSave}
          className="mx-4 mt-3.5 py-4 rounded-2xl text-white text-[15px] font-semibold shadow-[0_8px_20px_rgba(31,31,31,0.2)] disabled:opacity-50 w-[calc(100%-2rem)]"
          style={{ background: "#1F1F1F" }}
        >
          保存
        </button>

        {showPicker === "property" && (
          <PickerOverlay onClose={() => setShowPicker(null)} title="物件を選択">
            {owned.length === 0 ? (
              <div className="text-sm text-[#9B9588] py-8 text-center">
                先に所有物件を追加してください
              </div>
            ) : (
              owned.map((p) => (
                <button
                  key={p.id}
                  className="w-full text-left px-5 py-3.5 border-b border-[#F0EDE5] last:border-b-0 active:bg-[#F7F5F0] flex items-center justify-between"
                  onClick={() => {
                    setPropertyId(p.id);
                    setShowPicker(null);
                  }}
                >
                  <span className="text-[15px] font-medium">{p.name}</span>
                  {p.id === propertyId && <span className="text-[#3D8B4E] text-sm">✓</span>}
                </button>
              ))
            )}
          </PickerOverlay>
        )}

        {showPicker === "date" && (
          <PickerOverlay onClose={() => setShowPicker(null)} title="日付を選択">
            <div className="px-5 py-5">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-[16px] py-3 px-3 bg-white rounded-xl border border-[#EFEBE3] focus:outline-none focus:border-[#1F1F1F]"
              />
              <button
                className="mt-4 w-full py-3 rounded-xl bg-[#1F1F1F] text-white font-semibold"
                onClick={() => setShowPicker(null)}
              >
                決定
              </button>
            </div>
          </PickerOverlay>
        )}
      </div>
    </div>
  );
}

function Pill({
  active,
  color,
  onClick,
  children,
}: {
  active: boolean;
  color: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 py-2.5 text-center text-sm font-semibold rounded-[9px] transition-all"
      style={{
        background: active ? "white" : "transparent",
        color: active ? color : "#9B9588",
        boxShadow: active ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
      }}
    >
      {children}
    </button>
  );
}

function Key({
  children,
  onPress,
  variant,
}: {
  children: React.ReactNode;
  onPress: () => void;
  variant?: "special" | "delete";
}) {
  const bg = variant ? "#F0EDE5" : "white";
  return (
    <button
      type="button"
      onClick={onPress}
      className="h-[50px] rounded-xl text-[22px] font-semibold flex items-center justify-center active:scale-95 transition-transform"
      style={{
        background: bg,
        boxShadow: variant ? "none" : "0 1px 3px rgba(0,0,0,0.04)",
        fontSize: variant === "special" ? 16 : 22,
      }}
    >
      {children}
    </button>
  );
}

function PickerOverlay({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="absolute inset-0 z-10 flex items-end animate-fade-in">
      <button
        type="button"
        aria-label="閉じる"
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />
      <div className="relative w-full bg-[#FAFAF7] rounded-t-[20px] pt-2 pb-6 animate-slide-up max-h-[80%] overflow-auto no-scrollbar">
        <div className="w-9 h-1 bg-[#C0BBB0] rounded-full mx-auto mb-2" />
        <div className="px-5 py-2 flex items-center justify-between">
          <div className="text-[15px] font-bold">{title}</div>
          <button onClick={onClose} className="text-sm text-[#9B9588]">
            閉じる
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
