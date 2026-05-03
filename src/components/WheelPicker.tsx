"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronLeft } from "./Icon";

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

  const commit = (idx: number) => {
    const clamped = Math.max(0, Math.min(items.length - 1, idx));
    const v = items[clamped]?.value;
    if (v !== undefined && v !== lastSyncedValue.current) {
      lastSyncedValue.current = v;
      onChange(v);
    }
  };

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
      commit(Math.round(el.scrollTop / itemHeight));
    }, 150);
  };

  const scrollToIdx = (idx: number) => {
    const clamped = Math.max(0, Math.min(items.length - 1, idx));
    if (ref.current) {
      ref.current.scrollTo({ top: clamped * itemHeight, behavior: "smooth" });
    }
    setActiveIdx(clamped);
    commit(clamped);
  };

  const step = (delta: number) => scrollToIdx(activeIdx + delta);

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

      <button
        type="button"
        aria-label="ひとつ前"
        onClick={() => step(-1)}
        className="absolute right-1 z-10 w-7 h-6 grid place-items-center rounded-md text-[#9B9588] active:bg-[#F0EDE5]"
        style={{ top: 4 }}
      >
        <RotatedChevron up />
      </button>
      <button
        type="button"
        aria-label="ひとつ次"
        onClick={() => step(1)}
        className="absolute right-1 z-10 w-7 h-6 grid place-items-center rounded-md text-[#9B9588] active:bg-[#F0EDE5]"
        style={{ bottom: 4 }}
      >
        <RotatedChevron />
      </button>

      <div
        ref={ref}
        onScroll={onScroll}
        className="absolute inset-0 overflow-y-scroll no-scrollbar cursor-ns-resize"
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
              role="button"
              tabIndex={0}
              onClick={() => scrollToIdx(i)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  scrollToIdx(i);
                }
              }}
              className="num font-semibold text-center cursor-pointer"
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

function RotatedChevron({ up }: { up?: boolean }) {
  return (
    <span style={{ transform: up ? "rotate(90deg)" : "rotate(-90deg)", display: "inline-block" }}>
      <ChevronLeft size={14} />
    </span>
  );
}
