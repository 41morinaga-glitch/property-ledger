"use client";

import type { AppData } from "./types";

const GSI_SRC = "https://accounts.google.com/gsi/client";
const FILE_NAME = "property-ledger.json";
const SCOPE = "https://www.googleapis.com/auth/drive.appdata";

const TOKEN_KEY = "property-ledger:drive-token";
const EMAIL_KEY = "property-ledger:drive-email";
const LAST_SYNC_KEY = "property-ledger:drive-last-sync";

interface StoredToken {
  access_token: string;
  expires_at: number;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string; expires_in?: number }) => void;
            error_callback?: (err: unknown) => void;
            prompt?: string;
          }) => { requestAccessToken: (overrides?: { prompt?: string }) => void };
          revoke: (token: string, done: () => void) => void;
        };
        id?: {
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

export function getClientId(): string | null {
  return process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || null;
}

export function isConfigured(): boolean {
  return !!getClientId();
}

export function isSignedIn(): boolean {
  return getValidToken() !== null;
}

export function getStoredEmail(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(EMAIL_KEY);
}

export function getLastSyncAt(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LAST_SYNC_KEY);
}

function setLastSyncAt(iso: string) {
  if (typeof window !== "undefined") localStorage.setItem(LAST_SYNC_KEY, iso);
}

function getValidToken(): string | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(TOKEN_KEY);
  if (!raw) return null;
  try {
    const t = JSON.parse(raw) as StoredToken;
    if (Date.now() >= t.expires_at - 30_000) return null;
    return t.access_token;
  } catch {
    return null;
  }
}

function storeToken(token: string, expiresInSec: number) {
  const data: StoredToken = {
    access_token: token,
    expires_at: Date.now() + expiresInSec * 1000,
  };
  localStorage.setItem(TOKEN_KEY, JSON.stringify(data));
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EMAIL_KEY);
}

let gsiPromise: Promise<void> | null = null;

function loadGsi(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("server"));
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (gsiPromise) return gsiPromise;
  gsiPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GSI_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("GSI load error")));
      return;
    }
    const s = document.createElement("script");
    s.src = GSI_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("GSI load error"));
    document.head.appendChild(s);
  });
  return gsiPromise;
}

export async function signIn(): Promise<{ email: string }> {
  const clientId = getClientId();
  if (!clientId) throw new Error("Google Client ID が設定されていません");
  await loadGsi();
  const google = window.google!;
  const token = await new Promise<{ access_token: string; expires_in: number }>(
    (resolve, reject) => {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPE,
        callback: (response) => {
          if (response.error || !response.access_token) {
            reject(new Error(response.error ?? "認証に失敗しました"));
            return;
          }
          resolve({
            access_token: response.access_token,
            expires_in: response.expires_in ?? 3600,
          });
        },
        error_callback: (err) => reject(err instanceof Error ? err : new Error("認証エラー")),
      });
      client.requestAccessToken({ prompt: "consent" });
    },
  );

  storeToken(token.access_token, token.expires_in);
  const email = await fetchUserEmail(token.access_token);
  if (email && typeof window !== "undefined") localStorage.setItem(EMAIL_KEY, email);
  return { email: email ?? "" };
}

export async function signOut(): Promise<void> {
  const token = getValidToken();
  if (token && typeof window !== "undefined") {
    await loadGsi().catch(() => {});
    if (window.google?.accounts.oauth2) {
      await new Promise<void>((resolve) => {
        window.google!.accounts.oauth2.revoke(token, () => resolve());
      });
    }
  }
  clearToken();
}

async function fetchUserEmail(accessToken: string): Promise<string | null> {
  try {
    const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { email?: string };
    return json.email ?? null;
  } catch {
    return null;
  }
}

interface DriveFileMeta {
  id: string;
  modifiedTime: string;
}

async function findExistingFile(token: string): Promise<DriveFileMeta | null> {
  const url = new URL("https://www.googleapis.com/drive/v3/files");
  url.searchParams.set("q", `name='${FILE_NAME}'`);
  url.searchParams.set("spaces", "appDataFolder");
  url.searchParams.set("fields", "files(id,modifiedTime)");
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw await driveError(res);
  const json = (await res.json()) as { files?: DriveFileMeta[] };
  return json.files && json.files.length > 0 ? json.files[0] : null;
}

async function downloadFile(token: string, fileId: string): Promise<AppData | null> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) throw await driveError(res);
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as AppData;
  } catch {
    return null;
  }
}

async function uploadFile(token: string, data: AppData, fileId: string | null): Promise<DriveFileMeta> {
  const boundary = `----PL${Math.random().toString(36).slice(2)}`;
  const meta = fileId
    ? {}
    : { name: FILE_NAME, parents: ["appDataFolder"] };
  const body =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(meta)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: application/json\r\n\r\n` +
    `${JSON.stringify(data)}\r\n` +
    `--${boundary}--`;

  const url = fileId
    ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart&fields=id,modifiedTime`
    : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,modifiedTime`;

  const res = await fetch(url, {
    method: fileId ? "PATCH" : "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body,
  });
  if (!res.ok) throw await driveError(res);
  return (await res.json()) as DriveFileMeta;
}

async function driveError(res: Response): Promise<Error> {
  let detail = `${res.status} ${res.statusText}`;
  try {
    const json = await res.json();
    detail = json?.error?.message || detail;
  } catch {
    // ignore
  }
  if (res.status === 401) clearToken();
  return new Error(`Drive API: ${detail}`);
}

export interface SyncResult {
  pulled: boolean;
  pushed: boolean;
  conflict?: { local: AppData; remote: AppData };
  error?: string;
}

export async function pullFromDrive(): Promise<{
  remote: AppData | null;
  fileId: string | null;
}> {
  const token = getValidToken();
  if (!token) throw new Error("サインインしていません");
  const meta = await findExistingFile(token);
  if (!meta) return { remote: null, fileId: null };
  const remote = await downloadFile(token, meta.id);
  return { remote, fileId: meta.id };
}

export async function pushToDrive(data: AppData, fileId: string | null): Promise<DriveFileMeta> {
  const token = getValidToken();
  if (!token) throw new Error("サインインしていません");
  const meta = await uploadFile(token, data, fileId);
  setLastSyncAt(new Date().toISOString());
  return meta;
}

export function lastModifiedOf(data: AppData): number {
  if (!data.lastModified) return 0;
  return Date.parse(data.lastModified) || 0;
}
