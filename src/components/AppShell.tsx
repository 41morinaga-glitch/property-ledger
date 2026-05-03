"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { ChartIcon, GridIcon, HomeIcon, PlusIcon } from "./Icon";
import { RecordSheet } from "./RecordSheet";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [recordOpen, setRecordOpen] = useState(false);
  const router = useRouter();

  const isFormPage =
    pathname === "/properties/new" ||
    /^\/properties\/[^/]+\/edit$/.test(pathname) ||
    pathname === "/settings";
  const showTabs = !isFormPage;
  const showFab =
    !isFormPage &&
    (pathname === "/" ||
      pathname === "/properties" ||
      /^\/properties\/[^/]+$/.test(pathname) ||
      pathname === "/report");

  const isActive = (p: string) => {
    if (p === "/") return pathname === "/";
    return pathname.startsWith(p);
  };

  return (
    <div className="min-h-dvh">
      <main
        className="max-w-[480px] mx-auto pb-[120px]"
        style={{ paddingBottom: showTabs ? 120 : 32 }}
      >
        {children}
      </main>

      {showFab && (
        <button
          onClick={() => setRecordOpen(true)}
          aria-label="記録する"
          className="fixed z-30 w-14 h-14 rounded-full bg-[#1F1F1F] text-[#FAFAF7] grid place-items-center shadow-[0_8px_24px_rgba(31,31,31,0.35)] active:scale-95 transition-transform"
          style={{
            right: "max(20px, calc(50vw - 240px + 20px))",
            bottom: showTabs ? 96 : 32,
          }}
        >
          <PlusIcon size={24} />
        </button>
      )}

      {showTabs && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-20"
          style={{
            background: "rgba(247,245,240,0.85)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderTop: "1px solid rgba(0,0,0,0.05)",
          }}
        >
          <div className="max-w-[480px] mx-auto flex items-stretch justify-around px-2 pt-2 pb-[max(14px,env(safe-area-inset-bottom))]">
            <TabLink href="/" label="ホーム" active={isActive("/")}>
              <HomeIcon size={20} />
            </TabLink>
            <TabLink href="/properties" label="物件" active={isActive("/properties")}>
              <GridIcon size={20} />
            </TabLink>
            <TabLink href="/report" label="レポート" active={isActive("/report")}>
              <ChartIcon size={20} />
            </TabLink>
          </div>
        </nav>
      )}

      <RecordSheet
        open={recordOpen}
        onClose={() => setRecordOpen(false)}
        onSaved={() => {
          setRecordOpen(false);
          router.refresh();
        }}
      />
    </div>
  );
}

function TabLink({
  href,
  label,
  active,
  children,
}: {
  href: string;
  label: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex-1 flex flex-col items-center justify-center gap-1 py-1.5 text-[10px]"
      style={{ color: active ? "#1F1F1F" : "#9B9588", fontWeight: active ? 600 : 500 }}
    >
      {children}
      <span>{label}</span>
    </Link>
  );
}
