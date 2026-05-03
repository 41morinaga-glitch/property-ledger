"use client";

import { useSyncExternalStore } from "react";
import { EMPTY_DATA, type AppData, type Property, type Transaction } from "./types";
import { generateAutoRecords } from "./autoRecord";

const STORAGE_KEY = "property-ledger:v1";
const SEED_KEY = "property-ledger:seeded";

let cache: AppData | null = null;
const listeners = new Set<() => void>();

function readFromStorage(): AppData {
  if (typeof window === "undefined") return EMPTY_DATA;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_DATA;
    const parsed = JSON.parse(raw) as AppData;
    if (parsed?.version !== 1) return EMPTY_DATA;
    return parsed;
  } catch {
    return EMPTY_DATA;
  }
}

function writeToStorage(data: AppData) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getSnapshot(): AppData {
  if (cache === null) cache = readFromStorage();
  return cache;
}

function getServerSnapshot(): AppData {
  return EMPTY_DATA;
}

function emit() {
  for (const l of listeners) l();
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      cache = readFromStorage();
      emit();
    }
  };
  if (typeof window !== "undefined") window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
  };
}

function update(mut: (d: AppData) => AppData, opts: { touch?: boolean } = {}) {
  const raw = mut(getSnapshot());
  const next: AppData =
    opts.touch === false ? raw : { ...raw, lastModified: new Date().toISOString() };
  cache = next;
  writeToStorage(next);
  emit();
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function useAppData(): AppData {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export const actions = {
  addProperty(input: Omit<Property, "id" | "createdAt">): Property {
    const p: Property = {
      ...input,
      id: uid(),
      createdAt: new Date().toISOString(),
    };
    update((d) => ({ ...d, properties: [...d.properties, p] }));
    return p;
  },

  updateProperty(id: string, patch: Partial<Property>) {
    update((d) => ({
      ...d,
      properties: d.properties.map((p) => (p.id === id ? { ...p, ...patch, id: p.id } : p)),
    }));
  },

  deleteProperty(id: string) {
    update((d) => ({
      ...d,
      properties: d.properties.filter((p) => p.id !== id),
      transactions: d.transactions.filter((t) => t.propertyId !== id),
    }));
  },

  setPropertyStatus(id: string, status: Property["status"]) {
    update((d) => ({
      ...d,
      properties: d.properties.map((p) => (p.id === id ? { ...p, status } : p)),
    }));
  },

  addTransaction(input: Omit<Transaction, "id" | "createdAt">): Transaction {
    const t: Transaction = {
      ...input,
      id: uid(),
      createdAt: new Date().toISOString(),
    };
    update((d) => ({ ...d, transactions: [...d.transactions, t] }));
    return t;
  },

  updateTransaction(id: string, patch: Partial<Transaction>) {
    update((d) => ({
      ...d,
      transactions: d.transactions.map((t) => (t.id === id ? { ...t, ...patch, id: t.id } : t)),
    }));
  },

  deleteTransaction(id: string) {
    update((d) => ({
      ...d,
      transactions: d.transactions.filter((t) => t.id !== id),
    }));
  },

  importData(data: AppData) {
    update(() => ({ ...EMPTY_DATA, ...data, version: 1 }));
  },

  replaceFromRemote(data: AppData) {
    update(() => ({ ...EMPTY_DATA, ...data, version: 1 }), { touch: false });
  },

  getCurrent(): AppData {
    return getSnapshot();
  },

  reset() {
    update(() => EMPTY_DATA);
    if (typeof window !== "undefined") localStorage.removeItem(SEED_KEY);
  },

  loadSample() {
    update(() => SAMPLE_DATA);
    if (typeof window !== "undefined") localStorage.setItem(SEED_KEY, "1");
  },

  runAutoRecord(): { added: number } {
    const current = getSnapshot();
    const { added, updatedProperties } = generateAutoRecords(current);
    if (added.length === 0 && updatedProperties.length === 0) return { added: 0 };
    update((d) => {
      const propIndex = new Map(updatedProperties.map((p) => [p.id, p]));
      return {
        ...d,
        properties: d.properties.map((p) => propIndex.get(p.id) ?? p),
        transactions: [...d.transactions, ...added],
      };
    });
    return { added: added.length };
  },
};

const today = new Date();
const ymOf = (offset: number) => {
  const d = new Date(today.getFullYear(), today.getMonth() + offset, 15);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const SAMPLE_DATA: AppData = {
  version: 1,
  properties: [
    {
      id: "sample-1",
      name: "中野ハイツ 203",
      status: "owned",
      address: "東京都中野区",
      rent: 85000,
      managementFee: 8000,
      propertyTax: 60000,
      monthlyExpense: 0,
      purchasePrice: 22000000,
      acquiredAt: "2023-04-01",
      createdAt: new Date().toISOString(),
    },
    {
      id: "sample-2",
      name: "三軒茶屋アパート",
      status: "owned",
      address: "東京都世田谷区",
      rent: 120000,
      managementFee: 12000,
      propertyTax: 96000,
      monthlyExpense: 18000,
      purchasePrice: 35000000,
      acquiredAt: "2024-09-01",
      createdAt: new Date().toISOString(),
    },
    {
      id: "sample-3",
      name: "渋谷 1LDK",
      status: "considering",
      address: "東京都渋谷区",
      rent: 120000,
      managementFee: 14000,
      propertyTax: 108000,
      monthlyExpense: 39000,
      purchasePrice: 35000000,
      createdAt: new Date().toISOString(),
    },
  ],
  transactions: [
    { id: "t1", propertyId: "sample-1", kind: "income", amount: 85000, date: ymOf(0), createdAt: new Date().toISOString() },
    { id: "t2", propertyId: "sample-1", kind: "expense", amount: 12500, date: ymOf(0), memo: "管理費・修繕積立金", createdAt: new Date().toISOString() },
    { id: "t3", propertyId: "sample-2", kind: "income", amount: 120000, date: ymOf(0), createdAt: new Date().toISOString() },
    { id: "t4", propertyId: "sample-2", kind: "expense", amount: 38000, date: ymOf(0), memo: "ローン返済・管理費", createdAt: new Date().toISOString() },
    { id: "t5", propertyId: "sample-1", kind: "income", amount: 85000, date: ymOf(-1), createdAt: new Date().toISOString() },
    { id: "t6", propertyId: "sample-1", kind: "expense", amount: 12500, date: ymOf(-1), createdAt: new Date().toISOString() },
    { id: "t7", propertyId: "sample-2", kind: "income", amount: 120000, date: ymOf(-1), createdAt: new Date().toISOString() },
    { id: "t8", propertyId: "sample-2", kind: "expense", amount: 50000, date: ymOf(-1), memo: "エアコン修理", createdAt: new Date().toISOString() },
  ],
};

export function hasSeenSeedPrompt(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(SEED_KEY) !== null;
}

export function markSeedPromptSeen() {
  if (typeof window !== "undefined") localStorage.setItem(SEED_KEY, "1");
}
