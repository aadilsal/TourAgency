 "use client";
 
 import { createPortal } from "react-dom";
 import { useEffect, useId, useRef, useState } from "react";
 import { cn } from "@/lib/cn";
 
 type Item = {
   label: string;
   onClick: () => void;
   tone?: "default" | "danger";
   disabled?: boolean;
 };
 
 export function PopoverMenu({
   buttonLabel,
   buttonClassName,
   menuClassName,
   items,
   align = "right",
 }: {
   buttonLabel: string;
   buttonClassName?: string;
   menuClassName?: string;
   items: Item[];
   align?: "left" | "right";
 }) {
   const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; flipUp: boolean } | null>(
    null,
  );
   const rootRef = useRef<HTMLDivElement>(null);
   const btnRef = useRef<HTMLButtonElement>(null);
   const menuRef = useRef<HTMLDivElement>(null);
   const id = useId();
 
   useEffect(() => {
     if (!open) return;
    function computePos() {
      const btn = btnRef.current;
      if (!btn) return;
      const r = btn.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      const menuW = 224; // tailwind w-56
      const itemH = 48;
      const chrome = 16;
      const menuH = items.length * itemH + chrome;
      const pad = 8;

      const spaceBelow = vh - r.bottom;
      const spaceAbove = r.top;
      const flipUp = spaceBelow < menuH + 40 && spaceAbove > spaceBelow;

      const idealTop = flipUp ? r.top - 8 - menuH : r.bottom + 8;
      const top = Math.max(pad, Math.min(idealTop, vh - pad - Math.min(menuH, vh - pad * 2)));

      const idealLeft = align === "right" ? r.right - menuW : r.left;
      const left = Math.max(pad, Math.min(idealLeft, vw - pad - menuW));

      setPos({ top, left, flipUp });
    }

    computePos();

    function onReflow() {
      computePos();
    }
     function onDown(e: PointerEvent) {
       const el = rootRef.current;
       if (!el) return;
       if (el.contains(e.target as Node)) return;
       // The menu is portalled to <body>, so it isn't inside rootRef.
       if (menuRef.current?.contains(e.target as Node)) return;
       setOpen(false);
     }
     function onKey(e: KeyboardEvent) {
       if (e.key === "Escape") {
         e.preventDefault();
         setOpen(false);
         btnRef.current?.focus();
       }
     }
     window.addEventListener("pointerdown", onDown);
     window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onReflow);
    window.addEventListener("scroll", onReflow, true);
     return () => {
       window.removeEventListener("pointerdown", onDown);
       window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onReflow);
      window.removeEventListener("scroll", onReflow, true);
     };
  }, [open, align, items.length]);
 
   return (
     <div ref={rootRef} className="relative inline-flex">
       <button
         ref={btnRef}
         type="button"
         className={cn(buttonClassName)}
         aria-haspopup="menu"
         aria-expanded={open}
         aria-controls={open ? id : undefined}
         onClick={() => setOpen((v) => !v)}
       >
         {buttonLabel}
       </button>
      {open && pos
        ? createPortal(
            <div
              ref={menuRef}
              id={id}
              role="menu"
              data-lenis-prevent
              className={cn(
                // Light panel: the old #0b1220 background left the theme's black
                // `text-foreground` items unreadable.
                "fixed z-[300] w-56 overflow-y-auto overscroll-contain rounded-2xl border border-slate-200 bg-white py-1 text-slate-900 shadow-lg",
                menuClassName,
              )}
              style={{ top: pos.top, left: pos.left, maxHeight: "calc(100dvh - 16px)" }}
            >
              {items.map((it, idx) => (
                <button
                  key={`${it.label}-${idx}`}
                  type="button"
                  role="menuitem"
                  disabled={it.disabled}
                  className={cn(
                    "min-h-11 w-full px-3 py-3 text-left text-sm font-semibold hover:bg-slate-100 focus-visible:bg-slate-100 focus-visible:outline-none",
                    it.tone === "danger" ? "text-red-600" : "text-slate-900",
                    it.disabled && "opacity-40",
                  )}
                  onClick={() => {
                    if (it.disabled) return;
                    setOpen(false);
                    it.onClick();
                  }}
                >
                  {it.label}
                </button>
              ))}
            </div>,
            document.body,
          )
        : null}
     </div>
   );
 }
 
