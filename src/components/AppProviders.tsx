"use client";

import type { ReactNode } from "react";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { PlannerWidgetProvider } from "@/components/planner/PlannerWidgetContext";
import { PlannerChatWidgetRoot } from "@/components/planner/PlannerChatWidgetRoot";
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
          <Suspense fallback={null}>
            <RouteTransitionOverlay />
          </Suspense>
          {!isAdmin ? (
            <>
              <PlannerChatWidgetRoot />
            </>
          ) : null}
        </PlannerWidgetProvider>
      </ConvexClientProvider>
    </SmoothScroll>
  );
}
