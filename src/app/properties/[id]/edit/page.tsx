"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useAppData } from "@/lib/store";
import { PropertyForm } from "@/components/PropertyForm";

export default function EditPropertyPage() {
  const params = useParams<{ id: string }>();
  const data = useAppData();
  const property = data.properties.find((p) => p.id === params.id);

  if (!property) {
    return (
      <div className="px-7 pt-20 text-center">
        <div className="text-sm text-[#9B9588] mb-4">物件が見つかりません</div>
        <Link href="/properties" className="text-[#1F1F1F] underline text-sm">
          物件一覧へ
        </Link>
      </div>
    );
  }

  return <PropertyForm initial={property} />;
}
