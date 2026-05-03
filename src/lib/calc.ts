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

export function effectiveMonthlyExpense(p: Property): number {
  const mgmt = p.managementFee ?? 0;
  const tax = (p.propertyTax ?? 0) / 12;
  return p.monthlyExpense + mgmt + tax;
}

export function grossYield(p: Property): number {
  if (!p.purchasePrice || p.purchasePrice <= 0) return 0;
  return ((p.rent * 12) / p.purchasePrice) * 100;
}

export function netYield(p: Property): number {
  if (!p.purchasePrice || p.purchasePrice <= 0) return 0;
  const cf = (p.rent - effectiveMonthlyExpense(p)) * 12;
  return (cf / p.purchasePrice) * 100;
}

export function monthlyCFEstimate(p: Property): number {
  return p.rent - effectiveMonthlyExpense(p);
}

function monthsBetweenInclusive(startIso: string, now: Date = new Date()): number {
  const start = new Date(startIso + "T00:00:00");
  if (isNaN(start.getTime()) || start > now) return 0;
  const months =
    (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth()) +
    1;
  return Math.max(1, months);
}

export function trackingMonths(
  p: Property,
  propertyTxs: Transaction[],
  now: Date = new Date(),
): number {
  if (propertyTxs.length === 0) return 0;
  const sorted = [...propertyTxs].sort((a, b) => (a.date < b.date ? -1 : 1));
  const firstDate = sorted[0].date;
  const startIso =
    p.acquiredAt && p.acquiredAt > firstDate ? p.acquiredAt : firstDate;
  return monthsBetweenInclusive(startIso, now);
}

export function expectedLifetimeCF(
  p: Property,
  propertyTxs: Transaction[],
  now: Date = new Date(),
): number {
  const months = trackingMonths(p, propertyTxs, now);
  if (months <= 0) return 0;
  return monthlyCFEstimate(p) * months;
}

export function achievementRate(
  p: Property,
  propertyTxs: Transaction[],
  now: Date = new Date(),
): number | null {
  const expected = expectedLifetimeCF(p, propertyTxs, now);
  if (expected <= 0) return null;
  const actual = balance(propertyTxs);
  return (actual / expected) * 100;
}

export interface FiscalPeriod {
  startYear: number;
  startMonthIdx: number;
  endYear: number;
  endMonthIdx: number;
  label: string;
}

export function fiscalPeriodOf(
  startMonth: number,
  now: Date = new Date(),
): FiscalPeriod {
  const m = now.getMonth() + 1;
  const y = now.getFullYear();
  const startYear = m >= startMonth ? y : y - 1;
  const endYear = startMonth === 1 ? startYear : startYear + 1;
  const endMonthIdx = startMonth === 1 ? 11 : startMonth - 2;
  const label = `${startYear}年${startMonth}月期`;
  return {
    startYear,
    startMonthIdx: startMonth - 1,
    endYear,
    endMonthIdx,
    label,
  };
}

export function fiscalMonthYms(period: FiscalPeriod): string[] {
  const out: string[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(period.startYear, period.startMonthIdx + i, 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    out.push(`${yyyy}-${mm}`);
  }
  return out;
}

export function elapsedFiscalMonths(period: FiscalPeriod, now: Date = new Date()): number {
  const ymsList = fiscalMonthYms(period);
  const nowYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  let n = 0;
  for (const y of ymsList) {
    if (y <= nowYm) n++;
    else break;
  }
  return n;
}

export interface FiscalAchievement {
  period: FiscalPeriod;
  monthsElapsed: number;
  monthlyExpected: number;
  expectedSoFar: number;
  expectedFull: number;
  actualSoFar: number;
  rate: number | null;
  monthSummaries: MonthSummary[];
}

export function fiscalAchievement(
  p: Property,
  propertyTxs: Transaction[],
  startMonth: number,
  now: Date = new Date(),
): FiscalAchievement {
  const period = fiscalPeriodOf(startMonth, now);
  const ymsList = fiscalMonthYms(period);
  const monthsElapsed = elapsedFiscalMonths(period, now);
  const monthlyExpected = monthlyCFEstimate(p);
  const expectedSoFar = monthlyExpected * monthsElapsed;
  const expectedFull = monthlyExpected * 12;
  const monthSummaries = ymsList.map((ym) => monthSummary(propertyTxs, ym));
  const actualSoFar = monthSummaries
    .slice(0, monthsElapsed)
    .reduce((s, m) => s + m.balance, 0);
  const rate = expectedSoFar > 0 ? (actualSoFar / expectedSoFar) * 100 : null;
  return {
    period,
    monthsElapsed,
    monthlyExpected,
    expectedSoFar,
    expectedFull,
    actualSoFar,
    rate,
    monthSummaries,
  };
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
