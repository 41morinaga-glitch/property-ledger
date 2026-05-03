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
}

export type TxKind = "income" | "expense";

export interface Transaction {
  id: string;
  propertyId: string;
  kind: TxKind;
  amount: number;
  date: string;
  memo?: string;
  createdAt: string;
}

export interface AppData {
  version: 1;
  properties: Property[];
  transactions: Transaction[];
}

export const EMPTY_DATA: AppData = {
  version: 1,
  properties: [],
  transactions: [],
};
