"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

interface Props {
  items: { value: number; label: string }[];
  value: number;
  onChange: (v: number) => void;
  itemHeight?: number;
  visibleRows?: number;
  width?: number | string;
}

export function WheelPicker({
  items,
  value,
  onChange,
  itemHeight = 40,
  visibleRows = 5,
  width = "auto",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSyncedValue = useRef<number>(value);
  const initialIdxRef = useRef<number>(
    Math.max(0, items.findIndex((i) => i.value === value)),
  );
  const [activeIdx, setActiveIdx] = useState<number>(initialIdxRef.current);

  const containerHeight = itemHeight * visibleRows;
  const padding = (containerHeight - itemHeight) / 2;

  useLayoutEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = initialIdxRef.current * itemHeight;
    }
  }, [itemHeight]);

  useEffect(() => {
    if (!ref.current) return;
    if (value === lastSyncedValue.current) return;
    const idx = items.findIndex((i) => i.value === value);
    if (idx < 0) return;
    lastSyncedValue.current = value;
    setActiveIdx(idx);
    ref.current.scrollTo({ top: idx * itemHeight, behavior: "smooth" });
  }, [value, items, itemHeight]);

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    const idx = Math.max(
      0,
      Math.min(items.length - 1, Math.round(el.scrollTop / itemHeight)),
    );
    if (idx !== activeIdx) {
      setActiveIdx(idx);
    }
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      const finalIdx = Math.max(
        0,
        Math.min(items.length - 1, Math.round(el.scrollTop / itemHeight)),
      );
      const v = items[finalIdx]?.value;
      if (v !== undefined && v !== lastSyncedValue.current) {
        lastSyncedValue.current = v;
        onChange(v);
      }
    }, 150);
  };

  return (
    <div
      className="relative select-none"
      style={{ width, height: containerHeight }}
    >
      <div
        className="absolute left-2 right-2 pointer-events-none rounded-xl"
        style={{
          top: padding,
          height: itemHeight,
          background: "rgba(31,31,31,0.06)",
        }}
      />

      <div
        ref={ref}
        onScroll={onScroll}
        className="absolute inset-0 overflow-y-scroll no-scrollbar"
        style={{
          scrollSnapType: "y mandatory",
          WebkitOverflowScrolling: "touch",
          touchAction: "pan-y",
          overscrollBehavior: "contain",
        }}
      >
        <div style={{ height: padding }} aria-hidden />
        {items.map((it, i) => {
          const dist = Math.abs(i - activeIdx);
          const opacity = dist === 0 ? 1 : dist === 1 ? 0.55 : dist === 2 ? 0.28 : 0.14;
          const scale = dist === 0 ? 1 : dist === 1 ? 0.92 : 0.84;
          return (
            <div
              key={it.value}
              className="num font-semibold text-center"
              style={{
                height: itemHeight,
                lineHeight: `${itemHeight}px`,
                fontSize: 18,
                color: "#1F1F1F",
                opacity,
                transform: `scale(${scale})`,
                scrollSnapAlign: "center",
                scrollSnapStop: "always",
                transition: "opacity 0.18s, transform 0.18s",
              }}
            >
              {it.label}
            </div>
          );
        })}
        <div style={{ height: padding }} aria-hidden />
      </div>
    </div>
  );
}
