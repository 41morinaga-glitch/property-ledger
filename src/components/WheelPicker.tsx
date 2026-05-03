"use client";

import { useEffect, useRef, useState } from "react";

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
  itemHeight = 38,
  visibleRows = 5,
  width = "auto",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeIdx, setActiveIdx] = useState(() => Math.max(0, items.findIndex((i) => i.value === value)));
  const containerHeight = itemHeight * visibleRows;
  const padding = (containerHeight - itemHeight) / 2;

  useEffect(() => {
    const idx = items.findIndex((i) => i.value === value);
    if (idx >= 0 && idx !== activeIdx) {
      setActiveIdx(idx);
      if (ref.current) {
        ref.current.scrollTo({ top: idx * itemHeight, behavior: "smooth" });
      }
    }
  }, [value, items, itemHeight, activeIdx]);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = activeIdx * itemHeight;
    }
  }, [itemHeight]); // eslint-disable-line react-hooks/exhaustive-deps

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    const idx = Math.round(el.scrollTop / itemHeight);
    const clamped = Math.max(0, Math.min(items.length - 1, idx));
    if (clamped !== activeIdx) {
      setActiveIdx(clamped);
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try {
          (navigator as Navigator & { vibrate?: (p: number) => void }).vibrate?.(3);
        } catch {
          // ignore
        }
      }
    }
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      const finalIdx = Math.round(el.scrollTop / itemHeight);
      const v = items[Math.max(0, Math.min(items.length - 1, finalIdx))]?.value;
      if (v !== undefined && v !== value) onChange(v);
    }, 120);
  };

  return (
    <div
      className="relative select-none"
      style={{ width, height: containerHeight }}
    >
      <div
        className="absolute inset-x-2 pointer-events-none rounded-xl"
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
        }}
      >
        <div style={{ height: padding }} />
        {items.map((it, i) => {
          const dist = Math.abs(i - activeIdx);
          const opacity = dist === 0 ? 1 : dist === 1 ? 0.55 : dist === 2 ? 0.28 : 0.14;
          const scale = dist === 0 ? 1 : dist === 1 ? 0.92 : 0.84;
          return (
            <button
              key={it.value}
              type="button"
              onClick={() => {
                if (ref.current) {
                  ref.current.scrollTo({ top: i * itemHeight, behavior: "smooth" });
                }
              }}
              className="block w-full num font-semibold text-center transition-all"
              style={{
                height: itemHeight,
                lineHeight: `${itemHeight}px`,
                fontSize: 18,
                color: "#1F1F1F",
                opacity,
                transform: `scale(${scale})`,
                scrollSnapAlign: "center",
              }}
            >
              {it.label}
            </button>
          );
        })}
        <div style={{ height: padding }} />
      </div>
    </div>
  );
}
