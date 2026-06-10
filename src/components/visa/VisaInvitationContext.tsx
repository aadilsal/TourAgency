"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export const VISA_MODAL_DISMISSED_KEY = "junket-visa-modal-dismissed";
export const VISA_SUBMITTED_KEY = "junket-visa-submitted";

type VisaInvitationContextValue = {
  open: boolean;
  openModal: () => void;
  closeModal: () => void;
  markDismissed: () => void;
  markSubmitted: () => void;
};

const VisaInvitationContext = createContext<VisaInvitationContextValue | null>(
  null,
);

export function VisaInvitationProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const markDismissed = useCallback(() => {
    try {
      localStorage.setItem(VISA_MODAL_DISMISSED_KEY, "1");
    } catch {
      /* ignore */
    }
  }, []);

  const markSubmitted = useCallback(() => {
    try {
      localStorage.setItem(VISA_SUBMITTED_KEY, "1");
    } catch {
      /* ignore */
    }
  }, []);

  const openModal = useCallback(() => setOpen(true), []);

  const closeModal = useCallback(() => {
    setOpen(false);
    markDismissed();
  }, [markDismissed]);

  const value = useMemo(
    () => ({
      open,
      openModal,
      closeModal,
      markDismissed,
      markSubmitted,
    }),
    [open, openModal, closeModal, markDismissed, markSubmitted],
  );

  return (
    <VisaInvitationContext.Provider value={value}>
      {children}
    </VisaInvitationContext.Provider>
  );
}

export function useVisaInvitation() {
  const ctx = useContext(VisaInvitationContext);
  if (!ctx) {
    throw new Error("useVisaInvitation must be used within VisaInvitationProvider");
  }
  return ctx;
}
