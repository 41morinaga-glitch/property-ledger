"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { PropertyForm } from "@/components/PropertyForm";
import type { PropertyStatus } from "@/lib/types";

function NewPropertyInner() {
  const params = useSearchParams();
  const raw = params.get("status");
  const defaultStatus: PropertyStatus = raw === "considering" ? "considering" : "owned";
  return <PropertyForm defaultStatus={defaultStatus} />;
}

export default function NewPropertyPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-[#9B9588] text-sm">読み込み中...</div>}>
      <NewPropertyInner />
    </Suspense>
  );
}
