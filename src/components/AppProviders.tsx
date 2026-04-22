"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { PlannerWidgetProvider } from "@/components/planner/PlannerWidgetContext";
import { PlannerChatWidgetRoot } from "@/components/planner/PlannerChatWidgetRoot";
import { PlannerHomeAutoOpen } from "@/components/planner/PlannerHomeAutoOpen";
import { SmoothScroll } from "@/components/ui/SmoothScroll";
import { RouteTransitionOverlay } from "@/components/ui/RouteTransitionOverlay";

export function AppProviders({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  return (
    <SmoothScroll>
      <ConvexClientProvider>
        <PlannerWidgetProvider>
          {children}
          <RouteTransitionOverlay />
          {!isAdmin ? (
            <>
              <PlannerHomeAutoOpen />
              <PlannerChatWidgetRoot />
            </>
          ) : null}
        </PlannerWidgetProvider>
      </ConvexClientProvider>
    </SmoothScroll>
  );
}
