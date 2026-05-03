"use client";

import { actions } from "./store";
import {
  isSignedIn,
  lastModifiedOf,
  pullFromDrive,
  pushToDrive,
} from "./drive";
import type { AppData } from "./types";

let cachedFileId: string | null = null;
let inflight: Promise<SyncReport> | null = null;
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let lastLocalSeen: string | undefined;

export interface SyncReport {
  status: "ok" | "conflict" | "error" | "skipped";
  direction?: "pulled" | "pushed" | "noop";
  message?: string;
  remote?: AppData;
  local?: AppData;
}

export async function syncOnce(): Promise<SyncReport> {
  if (!isSignedIn()) return { status: "skipped", message: "未サインイン" };
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const local = actions.getCurrent();
      const { remote, fileId } = await pullFromDrive();
      cachedFileId = fileId;

      if (!remote) {
        if (local.properties.length === 0 && local.transactions.length === 0) {
          return { status: "ok", direction: "noop" };
        }
        const meta = await pushToDrive(local, null);
        cachedFileId = meta.id;
        return { status: "ok", direction: "pushed" };
      }

      const lt = lastModifiedOf(local);
      const rt = lastModifiedOf(remote);

      if (lt === rt && lt > 0) {
        return { status: "ok", direction: "noop" };
      }

      if (rt > lt) {
        actions.replaceFromRemote(remote);
        lastLocalSeen = remote.lastModified;
        return { status: "ok", direction: "pulled" };
      }

      if (lt > rt) {
        await pushToDrive(local, cachedFileId);
        lastLocalSeen = local.lastModified;
        return { status: "ok", direction: "pushed" };
      }

      return {
        status: "conflict",
        local,
        remote,
        message: "ローカルとクラウドの両方に変更があります",
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "同期エラー";
      return { status: "error", message: msg };
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

export function schedulePush(delayMs = 1500) {
  if (!isSignedIn()) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(async () => {
    const local = actions.getCurrent();
    if (local.lastModified === lastLocalSeen) return;
    try {
      await pushToDrive(local, cachedFileId);
      lastLocalSeen = local.lastModified;
    } catch {
      // ignore — next syncOnce will retry
    }
  }, delayMs);
}

export async function forcePushLocal(): Promise<SyncReport> {
  if (!isSignedIn()) return { status: "skipped", message: "未サインイン" };
  try {
    const local = actions.getCurrent();
    const meta = await pushToDrive(local, cachedFileId);
    cachedFileId = meta.id;
    lastLocalSeen = local.lastModified;
    return { status: "ok", direction: "pushed" };
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "送信失敗" };
  }
}

export async function forcePullRemote(): Promise<SyncReport> {
  if (!isSignedIn()) return { status: "skipped", message: "未サインイン" };
  try {
    const { remote, fileId } = await pullFromDrive();
    cachedFileId = fileId;
    if (!remote) return { status: "ok", direction: "noop", message: "クラウドにデータがありません" };
    actions.replaceFromRemote(remote);
    lastLocalSeen = remote.lastModified;
    return { status: "ok", direction: "pulled" };
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "取得失敗" };
  }
}

export function resetSyncState() {
  cachedFileId = null;
  lastLocalSeen = undefined;
  if (pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
  }
}
