"use client";

import { cn } from "@/lib/utils";
import { DURATION_OPTIONS, type DurationOption } from "@/lib/constants";

interface Props {
  selected: DurationOption;
  onSelect: (dur: DurationOption) => void;
}

export function DurationSelector({ selected, onSelect }: Props) {
  return (
    <div>
      <label className="block text-xs text-[var(--text-muted)] uppercase tracking-widest mb-3">
        Visibility Duration
      </label>
      <div className="flex flex-wrap gap-2">
        {DURATION_OPTIONS.map(dur => {
          const isSelected = dur.id === selected.id;
          return (
            <button
              key={dur.id}
              onClick={() => onSelect(dur)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                isSelected
                  ? "border-[var(--accent)] bg-[var(--accent-dim)] text-[var(--accent)]"
                  : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-alt)] hover:text-[var(--text-mid)]"
              )}
            >
              {dur.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
