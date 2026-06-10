"use client";

import { Card } from "@/components/ui/Card";
import { PageContainer } from "@/components/ui/PageContainer";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { VisaInvitationForm } from "@/components/visa/VisaInvitationForm";

export default function VisaInvitationPage() {
  return (
    <main className="min-h-screen py-16 md:py-24">
      <PageContainer className="max-w-3xl">
        <SectionHeader
          variant="onDark"
          eyebrow="Visa support"
          title="Tourist visa invitation"
          description="Submit passport details for each traveler. Our licensed team prepares official invitation letters for Pakistan tourist visas."
        />
        <Card className="mt-10 p-6 md:p-8">
          <VisaInvitationForm showHeader />
        </Card>
      </PageContainer>
    </main>
  );
}
