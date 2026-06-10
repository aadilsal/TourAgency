"use client";

import type { ReactNode } from "react";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { PlannerWidgetProvider } from "@/components/planner/PlannerWidgetContext";
import { PlannerChatWidgetRoot } from "@/components/planner/PlannerChatWidgetRoot";
import { VisaInvitationProvider } from "@/components/visa/VisaInvitationContext";
import { VisaInvitationModal } from "@/components/visa/VisaInvitationModal";
import { VisaInvitationHomeAutoOpen } from "@/components/visa/VisaInvitationHomeAutoOpen";
import { SmoothScroll } from "@/components/ui/SmoothScroll";
import { RouteTransitionOverlay } from "@/components/ui/RouteTransitionOverlay";

export function AppProviders({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  return (
    <SmoothScroll>
      <ConvexClientProvider>
        <VisaInvitationProvider>
          <PlannerWidgetProvider>
            {children}
            <Suspense fallback={null}>
              <RouteTransitionOverlay />
            </Suspense>
            {!isAdmin ? (
              <>
                <PlannerChatWidgetRoot />
                <VisaInvitationModal />
                <VisaInvitationHomeAutoOpen />
              </>
            ) : null}
          </PlannerWidgetProvider>
        </VisaInvitationProvider>
      </ConvexClientProvider>
    </SmoothScroll>
  );
}
