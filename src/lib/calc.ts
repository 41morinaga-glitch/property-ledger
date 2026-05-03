import type { AppData, Property, Transaction } from "./types";
import { ymKey } from "./format";

export function txInMonth(txs: Transaction[], ym: string): Transaction[] {
  return txs.filter((t) => ymKey(t.date) === ym);
}

export function balance(txs: Transaction[]): number {
  let sum = 0;
  for (const t of txs) sum += t.kind === "income" ? t.amount : -t.amount;
  return sum;
}

export function income(txs: Transaction[]): number {
  return txs.filter((t) => t.kind === "income").reduce((s, t) => s + t.amount, 0);
}

export function expense(txs: Transaction[]): number {
  return txs.filter((t) => t.kind === "expense").reduce((s, t) => s + t.amount, 0);
}

export function txByProperty(txs: Transaction[], propertyId: string): Transaction[] {
  return txs.filter((t) => t.propertyId === propertyId);
}

export interface MonthSummary {
  ym: string;
  income: number;
  expense: number;
  balance: number;
}

export function monthSummary(txs: Transaction[], ym: string): MonthSummary {
  const m = txInMonth(txs, ym);
  const inc = income(m);
  const exp = expense(m);
  return { ym, income: inc, expense: exp, balance: inc - exp };
}

export function last12Months(txs: Transaction[], anchorYm: string): MonthSummary[] {
  const [yy, mm] = anchorYm.split("-").map(Number);
  const result: MonthSummary[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(yy, mm - 1 - i, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    result.push(monthSummary(txs, ym));
  }
  return result;
}

export function ytd(txs: Transaction[], year: number): MonthSummary[] {
  const result: MonthSummary[] = [];
  for (let m = 1; m <= 12; m++) {
    const ym = `${year}-${String(m).padStart(2, "0")}`;
    result.push(monthSummary(txs, ym));
  }
  return result;
}

export function grossYield(p: Property): number {
  if (!p.purchasePrice || p.purchasePrice <= 0) return 0;
  return ((p.rent * 12) / p.purchasePrice) * 100;
}

export function netYield(p: Property): number {
  if (!p.purchasePrice || p.purchasePrice <= 0) return 0;
  const cf = (p.rent - p.monthlyExpense) * 12;
  return (cf / p.purchasePrice) * 100;
}

export function monthlyCFEstimate(p: Property): number {
  return p.rent - p.monthlyExpense;
}

export function ownedTotalMonthlyCF(data: AppData): number {
  return data.properties
    .filter((p) => p.status === "owned")
    .reduce((s, p) => s + monthlyCFEstimate(p), 0);
}

export function propertyContribution(data: AppData, propertyId: string, ym: string): number {
  const total = monthSummary(data.transactions, ym).balance;
  if (total === 0) return 0;
  const mine = monthSummary(txByProperty(data.transactions, propertyId), ym).balance;
  return (mine / total) * 100;
}
