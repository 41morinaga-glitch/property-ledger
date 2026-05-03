import type { AppData, Property, Transaction } from "./types";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function clampDay(year: number, monthIdx: number, day: number): number {
  const last = new Date(year, monthIdx + 1, 0).getDate();
  return Math.min(Math.max(1, day), last);
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

function ymOf(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

function ymToDate(ym: string, day: number): string {
  const [y, m] = ym.split("-").map(Number);
  const d = clampDay(y, m - 1, day);
  return `${y}-${pad(m)}-${pad(d)}`;
}

function nextYm(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m, 1);
  return ymOf(d);
}

function ymCompare(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

interface AutoRecordResult {
  added: Transaction[];
  updatedProperties: Property[];
}

const RENT_TAG = "家賃 [auto]";
const MONTHLY_EXPENSE_TAG = "毎月の経費 [auto]";
const PROPERTY_TAX_TAG = "固定資産税 [auto]";

export function generateAutoRecords(data: AppData, now: Date = new Date()): AutoRecordResult {
  const addedTx: Transaction[] = [];
  const updatedProps: Property[] = [];
  const currentYm = ymOf(now);
  const todayIso = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  for (const p of data.properties) {
    if (p.status !== "owned") continue;
    const cfg = p.autoRecord;
    if (!cfg || !cfg.enabled) continue;

    let cfgPatched = false;
    let updatedCfg = { ...cfg };

    // ============= 月次 =============
    const monthlyStartYm = pickMonthlyStartYm(cfg, currentYm);
    if (monthlyStartYm) {
      let cursor = monthlyStartYm;
      let lastDoneYm = cfg.lastGeneratedYm;
      while (ymCompare(cursor, currentYm) <= 0) {
        if (cfg.rent && p.rent > 0) {
          const date = ymToDate(cursor, cfg.rentDay);
          if (!hasMonthlyMarker(data.transactions, addedTx, p.id, "income", "rent", cursor)) {
            addedTx.push({
              id: uid(),
              propertyId: p.id,
              kind: "income",
              category: "main",
              amount: p.rent,
              date,
              memo: RENT_TAG,
              createdAt: new Date().toISOString(),
            });
          }
        }
        if (cfg.expense) {
          const expAmt = (p.managementFee ?? 0) + p.monthlyExpense;
          if (expAmt > 0) {
            const date = ymToDate(cursor, cfg.expenseDay);
            if (!hasMonthlyMarker(data.transactions, addedTx, p.id, "expense", "monthly", cursor)) {
              addedTx.push({
                id: uid(),
                propertyId: p.id,
                kind: "expense",
                category: "main",
                amount: expAmt,
                date,
                memo: MONTHLY_EXPENSE_TAG,
                createdAt: new Date().toISOString(),
              });
            }
          }
        }
        lastDoneYm = cursor;
        cursor = nextYm(cursor);
      }
      if (lastDoneYm && lastDoneYm !== cfg.lastGeneratedYm) {
        updatedCfg = { ...updatedCfg, lastGeneratedYm: lastDoneYm };
        cfgPatched = true;
      }
    }

    // ============= 年次(固定資産税) =============
    if (cfg.propertyTax && (p.propertyTax ?? 0) > 0) {
      const taxMonth = cfg.propertyTaxMonth ?? 5;
      const taxDay = cfg.propertyTaxDay ?? 1;
      const yearStart = pickYearlyStartYear(cfg, now);
      let lastDoneYear = cfg.lastGeneratedTaxYear;
      for (let year = yearStart; year <= now.getFullYear(); year++) {
        const day = clampDay(year, taxMonth - 1, taxDay);
        const date = `${year}-${pad(taxMonth)}-${pad(day)}`;
        if (date > todayIso) break;
        if (!hasYearlyTaxMarker(data.transactions, addedTx, p.id, year)) {
          addedTx.push({
            id: uid(),
            propertyId: p.id,
            kind: "expense",
            category: "main",
            amount: p.propertyTax!,
            date,
            memo: PROPERTY_TAX_TAG,
            createdAt: new Date().toISOString(),
          });
        }
        lastDoneYear = year;
      }
      if (lastDoneYear !== undefined && lastDoneYear !== cfg.lastGeneratedTaxYear) {
        updatedCfg = { ...updatedCfg, lastGeneratedTaxYear: lastDoneYear };
        cfgPatched = true;
      }
    }

    if (cfgPatched) {
      updatedProps.push({ ...p, autoRecord: updatedCfg });
    }
  }

  return { added: addedTx, updatedProperties: updatedProps };
}

function pickMonthlyStartYm(
  cfg: NonNullable<Property["autoRecord"]>,
  currentYm: string,
): string | null {
  if (cfg.lastGeneratedYm) {
    const next = nextYm(cfg.lastGeneratedYm);
    return ymCompare(next, currentYm) <= 0 ? next : null;
  }
  return currentYm;
}

function pickYearlyStartYear(
  cfg: NonNullable<Property["autoRecord"]>,
  now: Date,
): number {
  if (cfg.lastGeneratedTaxYear !== undefined) {
    return cfg.lastGeneratedTaxYear + 1;
  }
  return now.getFullYear();
}

function hasMonthlyMarker(
  existing: Transaction[],
  pending: Transaction[],
  propertyId: string,
  kind: Transaction["kind"],
  marker: "rent" | "monthly",
  ym: string,
): boolean {
  const isCandidate = (t: Transaction) => {
    if (t.propertyId !== propertyId) return false;
    if (t.kind !== kind) return false;
    if ((t.category ?? "main") !== "main") return false;
    if (t.date.slice(0, 7) !== ym) return false;
    if (t.memo?.includes(PROPERTY_TAX_TAG)) return false;
    if (marker === "rent") {
      return true;
    }
    return true;
  };
  return existing.some(isCandidate) || pending.some(isCandidate);
}

function hasYearlyTaxMarker(
  existing: Transaction[],
  pending: Transaction[],
  propertyId: string,
  year: number,
): boolean {
  const find = (t: Transaction) => {
    if (t.propertyId !== propertyId) return false;
    if (t.kind !== "expense") return false;
    if (t.date.slice(0, 4) !== String(year)) return false;
    return t.memo?.includes(PROPERTY_TAX_TAG) ?? false;
  };
  return existing.some(find) || pending.some(find);
}
