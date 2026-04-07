"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type PlannerWidgetContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
};

const PlannerWidgetContext = createContext<PlannerWidgetContextValue | null>(
  null,
);

export function PlannerWidgetProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);

  const open = useCallback(() => setOpen(true), []);
  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((o) => !o), []);

  const value = useMemo(
    () => ({ isOpen, open, close, toggle }),
    [isOpen, open, close, toggle],
  );

  return (
    <PlannerWidgetContext.Provider value={value}>
      {children}
    </PlannerWidgetContext.Provider>
  );
}

export function usePlannerWidget(): PlannerWidgetContextValue {
  const ctx = useContext(PlannerWidgetContext);
  if (!ctx) {
    throw new Error("usePlannerWidget must be used within PlannerWidgetProvider");
  }
  return ctx;
}
