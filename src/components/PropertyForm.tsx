"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AutoRecordConfig, Property, PropertyStatus } from "@/lib/types";
import { DEFAULT_AUTO_RECORD } from "@/lib/types";
import { actions } from "@/lib/store";
import { formatYen } from "@/lib/format";
import { CalIcon, CameraIcon, ChevronLeft, TrashIcon } from "./Icon";
import { Calendar } from "./Calendar";

interface Props {
  initial?: Property;
  defaultStatus?: PropertyStatus;
}

export function PropertyForm({ initial, defaultStatus = "owned" }: Props) {
  const router = useRouter();
  const isEdit = !!initial;
  const [name, setName] = useState(initial?.name ?? "");
  const [status, setStatus] = useState<PropertyStatus>(initial?.status ?? defaultStatus);
  const [address, setAddress] = useState(initial?.address ?? "");
  const [photo, setPhoto] = useState(initial?.photo ?? "");
  const [rent, setRent] = useState<string>(initial ? String(initial.rent) : "");
  const [monthlyExpense, setMonthlyExpense] = useState<string>(
    initial ? String(initial.monthlyExpense) : "",
  );
  const [managementFee, setManagementFee] = useState<string>(
    initial?.managementFee ? String(initial.managementFee) : "",
  );
  const [propertyTax, setPropertyTax] = useState<string>(
    initial?.propertyTax ? String(initial.propertyTax) : "",
  );
  const [purchasePrice, setPurchasePrice] = useState<string>(
    initial?.purchasePrice ? String(initial.purchasePrice) : "",
  );
  const [acquiredAt, setAcquiredAt] = useState(initial?.acquiredAt ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [autoRecord, setAutoRecord] = useState<AutoRecordConfig>(
    initial?.autoRecord ?? DEFAULT_AUTO_RECORD,
  );
  const [error, setError] = useState<string | null>(null);
  const [showCal, setShowCal] = useState(false);

  useEffect(() => {
    setError(null);
  }, [name, rent]);

  const handlePhoto = async (file: File | null) => {
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      setError("画像は4MB以下にしてください");
      return;
    }
    const dataUrl = await fileToDataUrl(file);
    const resized = await resizeImage(dataUrl, 800);
    setPhoto(resized);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("物件名を入力してください");
      return;
    }
    const rentNum = Number(rent || "0");
    const expNum = Number(monthlyExpense || "0");
    const mgmtNum = managementFee ? Number(managementFee) : undefined;
    const taxNum = propertyTax ? Number(propertyTax) : undefined;
    const priceNum = purchasePrice ? Number(purchasePrice) : undefined;

    const payload = {
      name: name.trim(),
      status,
      address: address.trim() || undefined,
      photo: photo || undefined,
      rent: rentNum,
      monthlyExpense: expNum,
      managementFee: mgmtNum,
      propertyTax: taxNum,
      purchasePrice: priceNum,
      acquiredAt: acquiredAt || undefined,
      note: note.trim() || undefined,
      autoRecord: status === "owned" && autoRecord.enabled ? autoRecord : undefined,
    };

    if (isEdit && initial) {
      actions.updateProperty(initial.id, payload);
      router.push(`/properties/${initial.id}`);
    } else {
      const p = actions.addProperty(payload);
      router.push(`/properties/${p.id}`);
    }
  };

  const handleDelete = () => {
    if (!initial) return;
    if (!confirm("この物件を削除します。記録された家賃・経費もすべて削除されます。")) return;
    actions.deleteProperty(initial.id);
    router.push("/properties");
  };

  return (
    <form onSubmit={submit} className="pb-10">
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full bg-white grid place-items-center shadow-sm active:scale-95"
          aria-label="戻る"
        >
          <ChevronLeft />
        </button>
        <div className="text-[15px] font-bold">{isEdit ? "物件を編集" : "物件を追加"}</div>
        <div className="w-9" />
      </div>

      <div className="px-5 pt-3">
        <div className="bg-[#F0EDE5] rounded-xl p-1 flex mb-5">
          <Pill active={status === "owned"} onClick={() => setStatus("owned")} color="#3D8B4E">
            所有
          </Pill>
          <Pill active={status === "considering"} onClick={() => setStatus("considering")} color="#4F7CAC">
            検討中
          </Pill>
        </div>

        <PhotoPicker photo={photo} onChange={handlePhoto} onClear={() => setPhoto("")} />

        <Field label="物件名">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: 中野ハイツ 203"
            className="w-full text-[18px] py-4 px-5 bg-white rounded-xl border border-transparent focus:outline-none focus:border-[#1F1F1F]"
          />
        </Field>

        <Field label="住所(任意)">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="例: 東京都中野区"
            className="w-full text-[18px] py-4 px-5 bg-white rounded-xl border border-transparent focus:outline-none focus:border-[#1F1F1F]"
          />
        </Field>

        <Field label={status === "owned" ? "月家賃" : "想定月家賃"}>
          <YenInput value={rent} onChange={setRent} placeholder="85000" />
        </Field>

        <Field label="管理費(月・任意)">
          <YenInput value={managementFee} onChange={setManagementFee} placeholder="8000" />
        </Field>

        <Field label="固定資産税(年・任意)">
          <YenInput value={propertyTax} onChange={setPropertyTax} placeholder="60000" />
        </Field>

        <Field label="その他月額経費(ローン返済・修繕費など)">
          <YenInput value={monthlyExpense} onChange={setMonthlyExpense} placeholder="12500" />
        </Field>

        <Field label={status === "owned" ? "購入価格(任意)" : "想定購入価格(任意)"}>
          <YenInput value={purchasePrice} onChange={setPurchasePrice} placeholder="22000000" />
        </Field>

        {status === "owned" && (
          <Field label="取得日(任意)">
            <button
              type="button"
              onClick={() => setShowCal(true)}
              className="w-full text-left text-[18px] py-4 px-5 bg-white rounded-xl border border-transparent focus:outline-none focus:border-[#1F1F1F] flex items-center gap-3"
              style={{ color: acquiredAt ? "#1F1F1F" : "#9B9588" }}
            >
              <CalIcon size={18} />
              <span>{acquiredAt ? formatJpDateFull(acquiredAt) : "日付を選択"}</span>
            </button>
          </Field>
        )}

        {status === "owned" && (
          <AutoRecordSection
            value={autoRecord}
            onChange={setAutoRecord}
            rent={Number(rent || "0")}
            expense={Number(monthlyExpense || "0") + (managementFee ? Number(managementFee) : 0)}
          />
        )}

        <Field label="メモ(任意)">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="w-full text-[16px] py-4 px-5 bg-white rounded-xl border border-transparent focus:outline-none focus:border-[#1F1F1F] resize-none leading-relaxed"
          />
        </Field>

        {error && (
          <div className="bg-[#FCE8E5] text-[#B85450] text-[13px] py-3 px-4 rounded-xl mb-3">{error}</div>
        )}

        <button
          type="submit"
          className="w-full py-4 rounded-2xl bg-[#1F1F1F] text-white font-semibold text-[15px] active:scale-[0.98] transition-transform"
        >
          {isEdit ? "保存" : "追加する"}
        </button>

        {isEdit && (
          <button
            type="button"
            onClick={handleDelete}
            className="w-full py-3 mt-3 rounded-xl text-[#B85450] text-[13px] font-medium flex items-center justify-center gap-1.5 active:bg-[#FCE8E5]/50"
          >
            <TrashIcon size={14} /> この物件を削除
          </button>
        )}
      </div>

      {showCal && (
        <div className="fixed inset-0 z-50 flex items-end animate-fade-in">
          <button
            type="button"
            aria-label="閉じる"
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowCal(false)}
          />
          <div className="relative w-full max-w-[480px] mx-auto animate-slide-up">
            <Calendar
              value={acquiredAt}
              onChange={setAcquiredAt}
              onClose={() => setShowCal(false)}
            />
          </div>
        </div>
      )}
    </form>
  );
}

function formatJpDateFull(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function AutoRecordSection({
  value,
  onChange,
  rent,
  expense,
}: {
  value: AutoRecordConfig;
  onChange: (cfg: AutoRecordConfig) => void;
  rent: number;
  expense: number;
}) {
  const setEnabled = (v: boolean) => onChange({ ...value, enabled: v });
  const setRent = (v: boolean) => onChange({ ...value, rent: v });
  const setExpense = (v: boolean) => onChange({ ...value, expense: v });
  const setRentDay = (d: number) => onChange({ ...value, rentDay: d });
  const setExpenseDay = (d: number) => onChange({ ...value, expenseDay: d });

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-5">
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex-1 pr-3">
          <div className="text-[15px] font-semibold">毎月の自動記録</div>
          <div className="text-[11px] text-[#9B9588] mt-0.5 leading-relaxed">
            一度設定すると、毎月の家賃・経費を自動で記録します。
          </div>
        </div>
        <Toggle on={value.enabled} onChange={setEnabled} />
      </div>

      {value.enabled && (
        <div className="border-t border-[#F5F2EB] px-5 py-4 space-y-4">
          <RecurringRow
            label="家賃を毎月記録"
            on={value.rent}
            onToggle={setRent}
            day={value.rentDay}
            onDayChange={setRentDay}
            amount={rent}
          />
          <RecurringRow
            label="経費を毎月記録"
            sublabel="管理費 + その他経費"
            on={value.expense}
            onToggle={setExpense}
            day={value.expenseDay}
            onDayChange={setExpenseDay}
            amount={expense}
          />
          <div className="text-[11px] text-[#9B9588] leading-relaxed pt-1">
            ※ 固定資産税は年単位なので自動記録の対象外です。手動で記録してください。
            <br />※ 同月内に同額の手動記録があれば、自動記録は重複しません。
          </div>
        </div>
      )}
    </div>
  );
}

function RecurringRow({
  label,
  sublabel,
  on,
  onToggle,
  day,
  onDayChange,
  amount,
}: {
  label: string;
  sublabel?: string;
  on: boolean;
  onToggle: (v: boolean) => void;
  day: number;
  onDayChange: (d: number) => void;
  amount: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[14px] font-semibold">{label}</div>
          {sublabel && <div className="text-[10px] text-[#9B9588] mt-0.5">{sublabel}</div>}
        </div>
        <Toggle on={on} onChange={onToggle} small />
      </div>
      {on && (
        <div className="mt-3 flex items-center gap-3 pl-1">
          <span className="text-[12px] text-[#9B9588]">毎月</span>
          <select
            value={day}
            onChange={(e) => onDayChange(Number(e.target.value))}
            className="text-[16px] py-2 px-3 bg-[#F0EDE5] rounded-lg font-semibold num focus:outline-none"
          >
            {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>
                {d}日
              </option>
            ))}
          </select>
          <span className="text-[12px] text-[#9B9588]">に</span>
          <span className="ml-auto text-[14px] font-bold num text-[#1F1F1F]">
            {formatYen(amount)}
          </span>
        </div>
      )}
    </div>
  );
}

function Toggle({
  on,
  onChange,
  small,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  small?: boolean;
}) {
  const w = small ? 40 : 48;
  const h = small ? 24 : 28;
  const knob = small ? 18 : 22;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="relative shrink-0 rounded-full transition-colors"
      style={{
        width: w,
        height: h,
        background: on ? "#3D8B4E" : "#D8D2C5",
      }}
    >
      <span
        className="absolute top-1/2 -translate-y-1/2 rounded-full bg-white shadow-sm transition-all"
        style={{
          width: knob,
          height: knob,
          left: on ? w - knob - 3 : 3,
        }}
      />
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block mb-5">
      <span className="block text-[12px] tracking-[1px] text-[#9B9588] font-semibold mb-2 px-1">
        {label}
      </span>
      {children}
    </label>
  );
}

function YenInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (s: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[#9B9588] text-[18px] font-medium">¥</span>
      <input
        type="number"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full text-[20px] py-4 pl-11 pr-5 bg-white rounded-xl border border-transparent focus:outline-none focus:border-[#1F1F1F] num text-right font-semibold"
      />
    </div>
  );
}

function Pill({
  active,
  onClick,
  color,
  children,
}: {
  active: boolean;
  onClick: () => void;
  color: string;
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

function PhotoPicker({
  photo,
  onChange,
  onClear,
}: {
  photo: string;
  onChange: (f: File | null) => void;
  onClear: () => void;
}) {
  return (
    <div className="mb-5">
      <span className="block text-[11px] tracking-[1px] text-[#9B9588] font-semibold mb-1.5 px-1">
        写真(任意)
      </span>
      <label
        className="block aspect-[16/10] rounded-2xl bg-white shadow-sm relative overflow-hidden cursor-pointer active:scale-[0.99] transition-transform"
        style={photo ? { backgroundImage: `url(${photo})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
      >
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
        {!photo && (
          <div className="absolute inset-0 grid place-items-center text-[#9B9588]">
            <div className="flex flex-col items-center gap-2">
              <CameraIcon size={28} />
              <span className="text-[12px]">タップして写真を選択</span>
            </div>
          </div>
        )}
        {photo && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onClear();
            }}
            className="absolute top-2 right-2 px-2.5 py-1 rounded-full bg-black/60 text-white text-[11px] font-medium"
          >
            削除
          </button>
        )}
      </label>
    </div>
  );
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function resizeImage(dataUrl: string, maxDim: number): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.round(img.width * ratio);
      const h = Math.round(img.height * ratio);
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const ctx = c.getContext("2d");
      if (!ctx) return resolve(dataUrl);
      ctx.drawImage(img, 0, 0, w, h);
      resolve(c.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
