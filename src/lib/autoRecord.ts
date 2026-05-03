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

const GEN_TAG = "[auto]";

export function generateAutoRecords(data: AppData, now: Date = new Date()): AutoRecordResult {
  const addedTx: Transaction[] = [];
  const updatedProps: Property[] = [];
  const currentYm = ymOf(now);

  for (const p of data.properties) {
    if (p.status !== "owned") continue;
    const cfg = p.autoRecord;
    if (!cfg || !cfg.enabled) continue;

    const startYm = pickStartYm(p, cfg, currentYm);
    if (!startYm) continue;

    let cursor = startYm;
    let lastDone = cfg.lastGeneratedYm;

    while (ymCompare(cursor, currentYm) <= 0) {
      if (cfg.rent && p.rent > 0) {
        const date = ymToDate(cursor, cfg.rentDay);
        if (!hasMatchingTx(data.transactions, addedTx, p.id, "income", date, p.rent)) {
          addedTx.push({
            id: uid(),
            propertyId: p.id,
            kind: "income",
            amount: p.rent,
            date,
            memo: `家賃 ${GEN_TAG}`,
            createdAt: new Date().toISOString(),
          });
        }
      }

      if (cfg.expense) {
        const expAmt = (p.managementFee ?? 0) + p.monthlyExpense;
        if (expAmt > 0) {
          const date = ymToDate(cursor, cfg.expenseDay);
          if (!hasMatchingTx(data.transactions, addedTx, p.id, "expense", date, expAmt)) {
            addedTx.push({
              id: uid(),
              propertyId: p.id,
              kind: "expense",
              amount: expAmt,
              date,
              memo: `毎月の経費 ${GEN_TAG}`,
              createdAt: new Date().toISOString(),
            });
          }
        }
      }

      lastDone = cursor;
      cursor = nextYm(cursor);
    }

    if (lastDone && lastDone !== cfg.lastGeneratedYm) {
      updatedProps.push({
        ...p,
        autoRecord: { ...cfg, lastGeneratedYm: lastDone },
      });
    }
  }

  return { added: addedTx, updatedProperties: updatedProps };
}

function pickStartYm(p: Property, cfg: NonNullable<Property["autoRecord"]>, currentYm: string): string | null {
  if (cfg.lastGeneratedYm) {
    const next = nextYm(cfg.lastGeneratedYm);
    return ymCompare(next, currentYm) <= 0 ? next : null;
  }
  if (p.acquiredAt) {
    const ym = p.acquiredAt.slice(0, 7);
    return ymCompare(ym, currentYm) <= 0 ? ym : null;
  }
  return currentYm;
}

function hasMatchingTx(
  existing: Transaction[],
  pending: Transaction[],
  propertyId: string,
  kind: Transaction["kind"],
  date: string,
  amount: number,
): boolean {
  const ym = date.slice(0, 7);
  const find = (t: Transaction) =>
    t.propertyId === propertyId &&
    t.kind === kind &&
    t.amount === amount &&
    t.date.slice(0, 7) === ym;
  return existing.some(find) || pending.some(find);
}
