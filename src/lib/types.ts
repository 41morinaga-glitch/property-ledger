export type PropertyStatus = "owned" | "considering";

export interface Property {
  id: string;
  name: string;
  status: PropertyStatus;
  address?: string;
  photo?: string;
  rent: number;
  monthlyExpense: number;
  managementFee?: number;
  propertyTax?: number;
  purchasePrice?: number;
  acquiredAt?: string;
  note?: string;
  createdAt: string;
  autoRecord?: AutoRecordConfig;
}

export interface AutoRecordConfig {
  enabled: boolean;
  rentDay: number;
  expenseDay: number;
  rent: boolean;
  expense: boolean;
  lastGeneratedYm?: string;
}

export const DEFAULT_AUTO_RECORD: AutoRecordConfig = {
  enabled: false,
  rentDay: 27,
  expenseDay: 1,
  rent: true,
  expense: true,
};

export type TxKind = "income" | "expense";
export type TxCategory = "main" | "other";

export interface Transaction {
  id: string;
  propertyId: string;
  kind: TxKind;
  category?: TxCategory;
  amount: number;
  date: string;
  memo?: string;
  createdAt: string;
}

export function txCategory(t: Transaction): TxCategory {
  return t.category ?? "main";
}

export function txLabel(t: Transaction): string {
  const cat = txCategory(t);
  if (t.kind === "income") return cat === "other" ? "その他収入" : "家賃";
  return cat === "other" ? "その他費用" : "経費";
}

export interface AppData {
  version: 1;
  properties: Property[];
  transactions: Transaction[];
  lastModified?: string;
}

export const EMPTY_DATA: AppData = {
  version: 1,
  properties: [],
  transactions: [],
};
