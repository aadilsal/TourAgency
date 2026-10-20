"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { toUserFacingErrorMessage } from "@/lib/userFriendlyError";
import { canSharePdfFiles, emailSendUrl, whatsappSendUrl } from "./sendToCustomer";

/** A disabled button can't show a tooltip, so the reason sits on a wrapper. */
function WithReason({ reason, children }: { reason?: string; children: React.ReactNode }) {
  return (
    <span title={reason} className="inline-flex">
      {children}
    </span>
  );
}

/**
 * "Send on WhatsApp", "Send by email" and (on phones that support it)
 * "Share PDF". WhatsApp/email open with a ready-written message; the admin
 * attaches the downloaded PDF there, or uses "Share PDF" on a phone to send
 * the file itself.
 */
export function SendToCustomerButtons({
  phone,
  email,
  message,
  emailSubject,
  makePdf,
  onMessage,
}: {
  phone?: string;
  email?: string;
  /** Message for WhatsApp and the email body. */
  message: string;
  emailSubject: string;
  /** Builds the PDF to share (after saving). */
  makePdf?: () => Promise<{ blob: Blob; fileName: string }>;
  /** Status / error text for the parent's message area. */
  onMessage: (text: string | null) => void;
}) {
  const wa = whatsappSendUrl(phone, message);
  const mail = emailSendUrl(email, emailSubject, message);
  const [canShare, setCanShare] = useState(false);
  const [sharing, setSharing] = useState(false);
  /** PDF built on a tap whose share was blocked; the next tap shares it at once. */
  const readyFile = useRef<File | null>(null);

  useEffect(() => {
    setCanShare(Boolean(makePdf) && canSharePdfFiles());
  }, [makePdf]);

  async function share() {
    if (!makePdf || sharing) return;
    onMessage(null);
    setSharing(true);
    try {
      let file = readyFile.current;
      if (!file) {
        const { blob, fileName } = await makePdf();
        file = new File([blob], fileName, { type: "application/pdf" });
      }
      try {
        await navigator.share({ files: [file], title: emailSubject, text: message });
        readyFile.current = null;
      } catch (e) {
        const name = (e as { name?: string })?.name;
        if (name === "AbortError") return; // the admin closed the share sheet
        if (name === "NotAllowedError") {
          // Building the PDF took too long for the browser; it's ready now.
          readyFile.current = file;
          onMessage("PDF is ready — tap “Share PDF” again to send it.");
          return;
        }
        throw e;
      }
    } catch (e) {
      onMessage(`Couldn't share the PDF. ${toUserFacingErrorMessage(e)}`);
    } finally {
      setSharing(false);
    }
  }

  return (
    <>
      <WithReason reason={wa ? undefined : "Add the customer's phone number first"}>
        <Button
          type="button"
          variant="secondary"
          disabled={!wa}
          onClick={() => {
            if (wa) window.open(wa, "_blank", "noopener,noreferrer");
          }}
        >
          Send on WhatsApp
        </Button>
      </WithReason>
      <WithReason reason={mail ? undefined : "Add the customer's email first"}>
        <Button
          type="button"
          variant="secondary"
          disabled={!mail}
          onClick={() => {
            if (mail) window.location.href = mail;
          }}
        >
          Send by email
        </Button>
      </WithReason>
      {canShare ? (
        <Button type="button" variant="secondary" disabled={sharing} onClick={() => void share()}>
          {sharing ? "Preparing…" : "Share PDF"}
        </Button>
      ) : null}
    </>
  );
}
