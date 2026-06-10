"use client";

import { Modal } from "@/components/ui/Modal";
import { VisaInvitationPromo } from "@/components/visa/VisaInvitationPromo";
import { useVisaInvitation } from "@/components/visa/VisaInvitationContext";

export function VisaInvitationModal() {
  const { open, closeModal } = useVisaInvitation();

  return (
    <Modal
      open={open}
      onClose={closeModal}
      title="Tourist Visa Invitation"
      description="Official invitation letters for Pakistan travel."
      panelClassName="max-w-md"
    >
      <VisaInvitationPromo layout="modal" onCtaClick={closeModal} />
    </Modal>
  );
}
