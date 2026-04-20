"use client";

import type { ReactNode } from "react";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { PlannerWidgetProvider } from "@/components/planner/PlannerWidgetContext";
import { PlannerChatWidgetRoot } from "@/components/planner/PlannerChatWidgetRoot";
import { PlannerHomeAutoOpen } from "@/components/planner/PlannerHomeAutoOpen";
import { SmoothScroll } from "@/components/ui/SmoothScroll";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SmoothScroll>
      <ConvexClientProvider>
        <PlannerWidgetProvider>
          {children}
          <PlannerHomeAutoOpen />
          <PlannerChatWidgetRoot />
        </PlannerWidgetProvider>
      </ConvexClientProvider>
    </SmoothScroll>
  );
}
