"use client";

import { useState, type ReactNode } from "react";

type Props<T> = {
  items: T[];
  getKey: (item: T) => string | number;
  onReorder: (items: T[]) => void;
  renderItem: (item: T, index: number) => ReactNode;
  disabled?: boolean;
};

export function move<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/** Reorderable list: drag the handle, or use the ↑ ↓ buttons (keyboard friendly). */
export function SortableList<T>({ items, getKey, onReorder, renderItem, disabled }: Props<T>) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  return (
    <ul className="flex flex-col gap-2">
      {items.map((item, i) => (
        <li
          key={getKey(item)}
          draggable={!disabled}
          onDragStart={(e) => {
            setDragIndex(i);
            e.dataTransfer.effectAllowed = "move";
          }}
          onDragOver={(e) => {
            if (dragIndex === null) return;
            e.preventDefault();
            setOverIndex(i);
          }}
          onDrop={(e) => {
            e.preventDefault();
            if (dragIndex !== null && dragIndex !== i) onReorder(move(items, dragIndex, i));
            setDragIndex(null);
            setOverIndex(null);
          }}
          onDragEnd={() => {
            setDragIndex(null);
            setOverIndex(null);
          }}
          className={`flex items-center gap-3 rounded-card border bg-white p-3 transition-colors ${
            overIndex === i && dragIndex !== i ? "border-brand" : "border-line"
          } ${dragIndex === i ? "opacity-50" : ""}`}
        >
          {!disabled && (
            <span className="cursor-grab text-lg text-muted select-none" aria-hidden title="Drag to reorder">
              ⋮⋮
            </span>
          )}
          <div className="min-w-0 flex-1">{renderItem(item, i)}</div>
          {!disabled && (
            <div className="flex flex-col">
              <button
                type="button"
                aria-label="Move up"
                disabled={i === 0}
                onClick={() => onReorder(move(items, i, i - 1))}
                className="px-1.5 text-xs text-muted hover:text-brand disabled:opacity-30"
              >
                ▲
              </button>
              <button
                type="button"
                aria-label="Move down"
                disabled={i === items.length - 1}
                onClick={() => onReorder(move(items, i, i + 1))}
                className="px-1.5 text-xs text-muted hover:text-brand disabled:opacity-30"
              >
                ▼
              </button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
