 "use client";
 
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
   const rootRef = useRef<HTMLDivElement>(null);
   const btnRef = useRef<HTMLButtonElement>(null);
   const id = useId();
 
   useEffect(() => {
     if (!open) return;
     function onDown(e: PointerEvent) {
       const el = rootRef.current;
       if (!el) return;
       if (el.contains(e.target as Node)) return;
       setOpen(false);
     }
     function onKey(e: KeyboardEvent) {
       if (e.key === "Escape") setOpen(false);
     }
     window.addEventListener("pointerdown", onDown);
     window.addEventListener("keydown", onKey);
     return () => {
       window.removeEventListener("pointerdown", onDown);
       window.removeEventListener("keydown", onKey);
     };
   }, [open]);
 
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
       {open ? (
         <div
           id={id}
           role="menu"
           className={cn(
             "absolute top-[calc(100%+8px)] z-30 w-56 overflow-hidden rounded-2xl border border-border bg-panel shadow-glass backdrop-blur-glass",
             align === "right" ? "right-0" : "left-0",
             menuClassName,
           )}
         >
           {items.map((it, idx) => (
             <button
               key={`${it.label}-${idx}`}
               type="button"
               role="menuitem"
               disabled={it.disabled}
               className={cn(
                 "w-full px-3 py-3 text-left text-sm font-semibold hover:bg-black/5 dark:hover:bg-white/10",
                 it.tone === "danger" ? "text-red-600" : "text-foreground",
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
         </div>
       ) : null}
     </div>
   );
 }
 
