export function formatYen(n: number, opts: { sign?: boolean } = {}): string {
  const abs = Math.abs(Math.round(n));
  const body = abs.toLocaleString("ja-JP");
  if (n === 0) return "¥0";
  if (n < 0) return `-¥${body}`;
  if (opts.sign) return `+¥${body}`;
  return `¥${body}`;
}

export function formatYenShort(n: number, opts: { sign?: boolean } = {}): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : opts.sign ? "+" : "";
  if (abs >= 100_000_000) return `${sign}¥${(abs / 100_000_000).toFixed(1)}億`;
  if (abs >= 10_000_000) return `${sign}¥${(abs / 10_000_000).toFixed(1)}千万`;
  if (abs >= 10_000) return `${sign}¥${(abs / 10_000).toFixed(1)}万`;
  return formatYen(n, opts);
}

export function formatPercent(n: number, fractionDigits = 1): string {
  return `${n.toFixed(fractionDigits)}%`;
}

export function todayISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function formatJpDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

export function ymKey(iso: string): string {
  return iso.slice(0, 7);
}

export function currentYm(): string {
  return todayISO().slice(0, 7);
}

export function ymDisplay(ym: string): string {
  const [y, m] = ym.split("-");
  return `${y} . ${Number(m)}`;
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "こんばんは";
  if (h < 11) return "おはようございます";
  if (h < 17) return "こんにちは";
  return "こんばんは";
}
