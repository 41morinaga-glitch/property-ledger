"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Property, PropertyStatus } from "@/lib/types";
import { actions } from "@/lib/store";
import { CameraIcon, ChevronLeft, TrashIcon } from "./Icon";

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
  const [purchasePrice, setPurchasePrice] = useState<string>(
    initial?.purchasePrice ? String(initial.purchasePrice) : "",
  );
  const [acquiredAt, setAcquiredAt] = useState(initial?.acquiredAt ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [error, setError] = useState<string | null>(null);

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
    const priceNum = purchasePrice ? Number(purchasePrice) : undefined;

    const payload = {
      name: name.trim(),
      status,
      address: address.trim() || undefined,
      photo: photo || undefined,
      rent: rentNum,
      monthlyExpense: expNum,
      purchasePrice: priceNum,
      acquiredAt: acquiredAt || undefined,
      note: note.trim() || undefined,
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
            className="w-full text-[15px] py-3 px-4 bg-white rounded-xl border border-transparent focus:outline-none focus:border-[#1F1F1F]"
          />
        </Field>

        <Field label="住所(任意)">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="例: 東京都中野区"
            className="w-full text-[15px] py-3 px-4 bg-white rounded-xl border border-transparent focus:outline-none focus:border-[#1F1F1F]"
          />
        </Field>

        <Field label={status === "owned" ? "月家賃" : "想定月家賃"}>
          <YenInput value={rent} onChange={setRent} placeholder="85000" />
        </Field>

        <Field label="月の経費目安(管理費・修繕積立・ローン返済など)">
          <YenInput value={monthlyExpense} onChange={setMonthlyExpense} placeholder="12500" />
        </Field>

        <Field label={status === "owned" ? "購入価格(任意)" : "想定購入価格(任意)"}>
          <YenInput value={purchasePrice} onChange={setPurchasePrice} placeholder="22000000" />
        </Field>

        {status === "owned" && (
          <Field label="取得日(任意)">
            <input
              type="date"
              value={acquiredAt}
              onChange={(e) => setAcquiredAt(e.target.value)}
              className="w-full text-[15px] py-3 px-4 bg-white rounded-xl border border-transparent focus:outline-none focus:border-[#1F1F1F]"
            />
          </Field>
        )}

        <Field label="メモ(任意)">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="w-full text-[14px] py-3 px-4 bg-white rounded-xl border border-transparent focus:outline-none focus:border-[#1F1F1F] resize-none"
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
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block mb-4">
      <span className="block text-[11px] tracking-[1px] text-[#9B9588] font-semibold mb-1.5 px-1">
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
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9B9588] text-[15px]">¥</span>
      <input
        type="number"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full text-[15px] py-3 pl-9 pr-4 bg-white rounded-xl border border-transparent focus:outline-none focus:border-[#1F1F1F] num"
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
