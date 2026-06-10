"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { COUNTRIES } from "@/lib/countries";
import { FieldLabel, FieldError } from "@/components/ui/FormField";

type Props = {
  id?: string;
  label?: string;
  required?: boolean;
  value: string;
  onChange: (code: string) => void;
  error?: string;
  disabled?: boolean;
};

export function CountrySelect({
  id: idProp,
  label = "Nationality",
  required,
  value,
  onChange,
  error,
  disabled,
}: Props) {
  const autoId = useId();
  const inputId = idProp ?? autoId;
  const listboxId = `${inputId}-listbox`;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(
    () => COUNTRIES.find((c) => c.code === value),
    [value],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q),
    );
  }, [query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const selectCountry = useCallback(
    (code: string) => {
      onChange(code);
      setQuery("");
      setOpen(false);
      inputRef.current?.blur();
    },
    [onChange],
  );

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    }
    if (e.key === "Enter" && filtered[activeIndex]) {
      e.preventDefault();
      selectCountry(filtered[activeIndex].code);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <FieldLabel htmlFor={inputId} required={required}>
        {label}
      </FieldLabel>
      <div
        className={cn(
          "relative mt-1 flex w-full items-center rounded-xl border border-slate-200/90 bg-white/95 shadow-sm transition-[box-shadow,border-color] focus-within:border-brand-accent/50 focus-within:ring-2 focus-within:ring-brand-accent/20",
          error && "border-red-300 focus-within:ring-red-200",
          disabled && "opacity-60",
        )}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            open && filtered[activeIndex]
              ? `${inputId}-opt-${filtered[activeIndex].code}`
              : undefined
          }
          disabled={disabled}
          autoComplete="country"
          placeholder={selected?.name ?? "Search country…"}
          value={open ? query : selected?.name ?? ""}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            setQuery("");
          }}
          onKeyDown={onKeyDown}
          className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-base text-black outline-none placeholder:text-slate-500 sm:text-sm"
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          aria-label="Toggle country list"
          className="shrink-0 px-2 text-slate-400"
          onClick={() => {
            setOpen((o) => !o);
            inputRef.current?.focus();
          }}
        >
          <ChevronDown className={cn("h-4 w-4 transition", open && "rotate-180")} />
        </button>
      </div>
      {open && filtered.length > 0 ? (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
        >
          {filtered.map((c, i) => (
            <li
              key={c.code}
              id={`${inputId}-opt-${c.code}`}
              role="option"
              aria-selected={value === c.code}
              className={cn(
                "cursor-pointer px-3 py-2.5 text-sm text-slate-900",
                i === activeIndex && "bg-havezic-primary/10",
                value === c.code && "font-semibold",
              )}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => selectCountry(c.code)}
            >
              {c.name}
            </li>
          ))}
        </ul>
      ) : null}
      {open && filtered.length === 0 ? (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 shadow-lg">
          No countries found
        </div>
      ) : null}
      <FieldError>{error}</FieldError>
    </div>
  );
}
