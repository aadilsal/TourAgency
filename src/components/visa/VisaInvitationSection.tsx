"use client";

import { Card } from "@/components/ui/Card";
import { PageContainer } from "@/components/ui/PageContainer";
import { MotionSection } from "@/components/ui/MotionSection";
import { VisaInvitationPromo } from "@/components/visa/VisaInvitationPromo";

export function VisaInvitationSection() {
  return (
    <MotionSection>
      <section id="visa-invitation" className="scroll-mt-24 py-16 md:py-20">
        <PageContainer>
          <Card className="p-6 md:p-10">
            <VisaInvitationPromo layout="section" />
          </Card>
        </PageContainer>
      </section>
    </MotionSection>
  );
}
