"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server.js";
import { internal } from "./_generated/api.js";
import { Resend } from "resend";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export const sendGuestBookingNotification = internalAction({
  args: { guestBookingId: v.id("guestBookings") },
  handler: async (ctx, { guestBookingId }) => {
    const booking = await ctx.runQuery(internal.bookings.getGuestBookingDoc, {
      id: guestBookingId,
    });
    if (!booking) return;
    const tour = await ctx.runQuery(internal.bookings.getTourDoc, {
      id: booking.tourId,
    });
    const to = process.env.ADMIN_NOTIFICATION_EMAIL;
    const resend = getResend();
    if (!resend || !to) return;

    const tourTitle = tour?.title ?? "Tour";
    const startDate = booking.preferredStart ?? "—";
    const adminHtml = `<p style="font-size:16px;margin:0 0 12px;"><strong>New tour customisation request</strong></p>
        <p style="margin:0 0 8px;"><strong>${esc(booking.name)}</strong> wants to customise <strong>${esc(tourTitle)}</strong></p>
        <p style="margin:0 0 4px;">Phone: ${esc(booking.phone)}</p>
        <p style="margin:0 0 4px;">Email: ${booking.email ? esc(booking.email) : "—"}</p>
        <p style="margin:0 0 4px;">Travelers: ${booking.peopleCount}</p>
        <p style="margin:0 0 4px;"><strong>Preferred start:</strong> ${esc(startDate)}</p>
        <p style="margin:0 0 4px;">Window: ${esc(booking.preferredStart ?? "—")} → ${esc(booking.preferredEnd ?? "—")}</p>
        <p style="margin:0 0 4px;">Adults / children: ${booking.adults ?? "—"} / ${booking.children ?? "—"}</p>
        <p style="margin:0 0 4px;">Departure city: ${booking.departureCity ? esc(booking.departureCity) : "—"}</p>
        <p style="margin:0 0 4px;">Special needs: ${booking.specialNeeds ? esc(booking.specialNeeds) : "—"}</p>
        <p style="margin:0 0 12px;">Notes: ${booking.notes ? esc(booking.notes) : "—"}</p>
        <p><a href="${esc(process.env.APP_BASE_URL ?? "")}/admin/bookings">Open admin</a></p>`;

    await resend.emails.send({
      from: process.env.RESEND_FROM ?? "JunketTours <onboarding@resend.dev>",
      to: [to],
      subject: `New tour customisation: ${tourTitle}`,
      html: adminHtml,
    });

    const guestEmail = booking.email?.trim();
    if (guestEmail) {
      const guestHtml = `<p style="font-size:16px;margin:0 0 12px;">Hi ${esc(booking.name.split(" ")[0] || booking.name)},</p>
        <p style="margin:0 0 12px;">We&apos;ve received your customisation request for <strong>${esc(tourTitle)}</strong>.</p>
        <p style="margin:0 0 8px;"><strong>Your details</strong></p>
        <ul style="margin:0 0 12px;padding-left:20px;">
          <li>Preferred start: ${esc(startDate)}</li>
          <li>Travelers: ${booking.peopleCount}</li>
          <li>Phone on file: ${esc(booking.phone)}</li>
        </ul>
        <p style="margin:0 0 12px;"><strong>Next steps</strong></p>
        <p style="margin:0 0 12px;">Our team will be in touch to discuss dates, inclusions, and a tailored quote for your trip.</p>
        <p style="margin:0;color:#64748b;font-size:14px;">— JunketTours</p>`;

      await resend.emails.send({
        from: process.env.RESEND_FROM ?? "JunketTours <onboarding@resend.dev>",
        to: [guestEmail],
        subject: `We received your customisation request — ${tourTitle}`,
        html: guestHtml,
      });
    }
  },
});

export const sendUserBookingNotification = internalAction({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, { bookingId }) => {
    const booking = await ctx.runQuery(internal.bookings.getUserBookingDoc, {
      id: bookingId,
    });
    if (!booking) return;
    const tour = await ctx.runQuery(internal.bookings.getTourDoc, {
      id: booking.tourId,
    });
    const user = await ctx.runQuery(internal.auth.getUserBySubject, {
      subject: booking.userId as string,
    });
    const to = process.env.ADMIN_NOTIFICATION_EMAIL;
    const resend = getResend();
    if (!resend || !to) return;
    const tourTitle = tour?.title ?? "Tour";
    const startDate = booking.preferredStart ?? "—";
    const adminHtml = `<p style="font-size:16px;margin:0 0 12px;"><strong>New tour customisation request</strong></p>
        <p style="margin:0 0 8px;"><strong>${esc(user?.name ?? "Member")}</strong> (${user?.email ? esc(user.email) : "—"}) wants to customise <strong>${esc(tourTitle)}</strong></p>
        <p style="margin:0 0 4px;">Phone: ${user?.phone ? esc(user.phone) : "—"}</p>
        <p style="margin:0 0 4px;">Travelers: ${booking.peopleCount}</p>
        <p style="margin:0 0 4px;"><strong>Preferred start:</strong> ${esc(startDate)}</p>
        <p style="margin:0 0 4px;">Window: ${esc(booking.preferredStart ?? "—")} → ${esc(booking.preferredEnd ?? "—")}</p>
        <p style="margin:0 0 4px;">Adults / children: ${booking.adults ?? "—"} / ${booking.children ?? "—"}</p>
        <p style="margin:0 0 4px;">Departure city: ${booking.departureCity ? esc(booking.departureCity) : "—"}</p>
        <p style="margin:0 0 4px;">Special needs: ${booking.specialNeeds ? esc(booking.specialNeeds) : "—"}</p>
        <p style="margin:0 0 12px;">Notes: ${booking.notes ? esc(booking.notes) : "—"}</p>
        <p><a href="${esc(process.env.APP_BASE_URL ?? "")}/admin/bookings">Open admin</a></p>`;

    await resend.emails.send({
      from: process.env.RESEND_FROM ?? "JunketTours <onboarding@resend.dev>",
      to: [to],
      subject: `New tour customisation: ${tourTitle}`,
      html: adminHtml,
    });

    const memberEmail = user?.email?.trim();
    if (memberEmail) {
      const memberHtml = `<p style="font-size:16px;margin:0 0 12px;">Hi ${esc((user?.name ?? "there").split(" ")[0])},</p>
        <p style="margin:0 0 12px;">We&apos;ve received your customisation request for <strong>${esc(tourTitle)}</strong>.</p>
        <p style="margin:0 0 8px;"><strong>Your details</strong></p>
        <ul style="margin:0 0 12px;padding-left:20px;">
          <li>Preferred start: ${esc(startDate)}</li>
          <li>Travelers: ${booking.peopleCount}</li>
        </ul>
        <p style="margin:0 0 12px;"><strong>Next steps</strong></p>
        <p style="margin:0 0 12px;">Our team will be in touch to discuss dates, inclusions, and a tailored quote for your trip.</p>
        <p style="margin:0;color:#64748b;font-size:14px;">— JunketTours</p>`;

      await resend.emails.send({
        from: process.env.RESEND_FROM ?? "JunketTours <onboarding@resend.dev>",
        to: [memberEmail],
        subject: `We received your customisation request — ${tourTitle}`,
        html: memberHtml,
      });
    }
  },
});

export const sendCustomItineraryRequestNotification = internalAction({
  args: { requestId: v.id("customItineraryRequests") },
  handler: async (ctx, { requestId }) => {
    const req = await ctx.runQuery(internal.customItineraries.getRequestDoc, {
      id: requestId,
    });
    if (!req) return;

    const to = process.env.ADMIN_NOTIFICATION_EMAIL;
    const resend = getResend();
    if (!resend || !to) return;

    const adminHtml = `<p style="font-size:16px;margin:0 0 12px;"><strong>New AI Planner request</strong></p>
      <p style="margin:0 0 8px;"><strong>${esc(req.name)}</strong> submitted a trip planning request.</p>
      <p style="margin:0 0 4px;">Phone: ${esc(req.phone)}</p>
      <p style="margin:0 0 4px;">Email: ${req.email ? esc(req.email) : "—"}</p>
      <p style="margin:0 0 4px;">Window: ${esc(req.preferredStart ?? "—")} → ${esc(req.preferredEnd ?? "—")}</p>
      <p style="margin:0 0 4px;">Adults / children: ${req.adults ?? "—"} / ${req.children ?? "—"}</p>
      <p style="margin:12px 0 4px;"><strong>Summary</strong></p>
      <p style="margin:0 0 12px;white-space:pre-wrap;">${esc(req.summary)}</p>
      <p style="margin:12px 0 4px;"><strong>Plan / proposal</strong></p>
      <p style="margin:0 0 12px;white-space:pre-wrap;">${esc(req.proposal)}</p>
      <p><a href="${esc(process.env.APP_BASE_URL ?? "")}/admin/custom-itineraries">Open admin</a></p>`;

    await resend.emails.send({
      from: process.env.RESEND_FROM ?? "JunketTours <onboarding@resend.dev>",
      to: [to],
      subject: `New AI Planner request: ${req.name}`,
      html: adminHtml,
    });

    const clientEmail = req.email?.trim();
    if (clientEmail) {
      const clientHtml = `<p style="font-size:16px;margin:0 0 12px;">Hi ${esc(req.name.split(" ")[0] || req.name)},</p>
        <p style="margin:0 0 12px;">We&apos;ve received your AI trip planning request.</p>
        <p style="margin:0 0 8px;"><strong>Next steps</strong></p>
        <p style="margin:0 0 12px;">Our team will review your plan and contact you soon to confirm route details, availability, and pricing.</p>
        <p style="margin:0;color:#64748b;font-size:14px;">— JunketTours</p>`;

      await resend.emails.send({
        from: process.env.RESEND_FROM ?? "JunketTours <onboarding@resend.dev>",
        to: [clientEmail],
        subject: "We received your trip planning request — JunketTours",
        html: clientHtml,
      });
    }
  },
});

export const sendCustomItineraryStatusUpdate = internalAction({
  args: {
    requestId: v.id("customItineraryRequests"),
    status: v.union(v.literal("approved"), v.literal("rejected")),
    adminNote: v.optional(v.string()),
    changedStatus: v.boolean(),
    changedAdminNote: v.boolean(),
  },
  handler: async (ctx, { requestId, status, adminNote, changedStatus, changedAdminNote }) => {
    const req = await ctx.runQuery(internal.customItineraries.getRequestDoc, {
      id: requestId,
    });
    if (!req) return;

    const resend = getResend();
    const to = process.env.ADMIN_NOTIFICATION_EMAIL;
    if (!resend || !to) return;

    const whatChanged =
      changedStatus && changedAdminNote
        ? "Status and note updated"
        : changedStatus
          ? "Status updated"
          : "Note updated";

    const noteLine = adminNote?.trim()
      ? `<p style="margin:0 0 12px;"><strong>Admin note:</strong> ${esc(adminNote.trim())}</p>`
      : "";

    const adminHtml = `<p style="font-size:16px;margin:0 0 12px;"><strong>${esc(whatChanged)}</strong></p>
      <p style="margin:0 0 8px;">Request: <strong>${esc(req.name)}</strong> (${esc(req.phone)})</p>
      <p style="margin:0 0 8px;">Status: <strong>${esc(status)}</strong></p>
      ${noteLine}
      <p><a href="${esc(process.env.APP_BASE_URL ?? "")}/admin/custom-itineraries">Open admin</a></p>`;

    await resend.emails.send({
      from: process.env.RESEND_FROM ?? "JunketTours <onboarding@resend.dev>",
      to: [to],
      subject: `AI Planner request update: ${req.name} → ${status}`,
      html: adminHtml,
    });

    const clientEmail = req.email?.trim();
    if (clientEmail) {
      const clientHtml = `<p style="font-size:16px;margin:0 0 12px;">Hi ${esc(req.name.split(" ")[0] || req.name)},</p>
        <p style="margin:0 0 12px;">There&apos;s an update to your trip planning request.</p>
        <p style="margin:0 0 8px;"><strong>Status:</strong> ${esc(status)}</p>
        ${noteLine}
        <p style="margin:0;color:#64748b;font-size:14px;">— JunketTours</p>`;

      await resend.emails.send({
        from: process.env.RESEND_FROM ?? "JunketTours <onboarding@resend.dev>",
        to: [clientEmail],
        subject: `Update on your trip planning request — ${status}`,
        html: clientHtml,
      });
    }
  },
});

function formatSex(sex: string): string {
  if (sex === "male") return "Male";
  if (sex === "female") return "Female";
  return "Other";
}

export const sendVisaInvitationNotification = internalAction({
  args: { requestId: v.id("visaInvitationRequests") },
  handler: async (ctx, { requestId }) => {
    const req = await ctx.runQuery(internal.visaInvitations.getRequestDoc, {
      id: requestId,
    });
    if (!req) return;

    const resend = getResend();
    const to = process.env.ADMIN_NOTIFICATION_EMAIL;
    if (!resend || !to) return;

    const travelerRows = req.travelers
      .map(
        (t) =>
          `<tr>
            <td style="padding:8px;border:1px solid #e2e8f0;">${esc(t.name)}</td>
            <td style="padding:8px;border:1px solid #e2e8f0;">${esc(formatSex(t.sex))}</td>
            <td style="padding:8px;border:1px solid #e2e8f0;">${esc(t.nationalityLabel)}</td>
            <td style="padding:8px;border:1px solid #e2e8f0;">${esc(t.dateOfBirth)}</td>
            <td style="padding:8px;border:1px solid #e2e8f0;">${esc(t.passportNumber)}</td>
            <td style="padding:8px;border:1px solid #e2e8f0;">${esc(t.passportIssueDate)}</td>
            <td style="padding:8px;border:1px solid #e2e8f0;">${esc(t.passportExpiryDate)}</td>
          </tr>`,
      )
      .join("");

    const adminHtml = `<p style="font-size:16px;margin:0 0 12px;"><strong>New visa invitation request</strong></p>
      <p style="margin:0 0 4px;"><strong>Contact:</strong> ${esc(req.contactName)}</p>
      <p style="margin:0 0 4px;">Email: ${esc(req.contactEmail)}</p>
      <p style="margin:0 0 12px;">Phone: ${esc(req.contactPhone)}</p>
      <p style="margin:0 0 8px;"><strong>Travelers (${req.travelers.length})</strong></p>
      <table style="border-collapse:collapse;width:100%;font-size:14px;margin:0 0 16px;">
        <thead>
          <tr style="background:#f8fafc;">
            <th style="padding:8px;border:1px solid #e2e8f0;text-align:left;">Name</th>
            <th style="padding:8px;border:1px solid #e2e8f0;text-align:left;">Sex</th>
            <th style="padding:8px;border:1px solid #e2e8f0;text-align:left;">Nationality</th>
            <th style="padding:8px;border:1px solid #e2e8f0;text-align:left;">DOB</th>
            <th style="padding:8px;border:1px solid #e2e8f0;text-align:left;">Passport</th>
            <th style="padding:8px;border:1px solid #e2e8f0;text-align:left;">Issue</th>
            <th style="padding:8px;border:1px solid #e2e8f0;text-align:left;">Expiry</th>
          </tr>
        </thead>
        <tbody>${travelerRows}</tbody>
      </table>
      <p><a href="${esc(process.env.APP_BASE_URL ?? "")}/admin/visa-invitations">Open admin</a></p>`;

    await resend.emails.send({
      from: process.env.RESEND_FROM ?? "JunketTours <onboarding@resend.dev>",
      to: [to],
      subject: `New visa invitation request — ${req.contactName} (${req.travelers.length} traveler${req.travelers.length === 1 ? "" : "s"})`,
      html: adminHtml,
    });

    const clientEmail = req.contactEmail.trim();
    if (clientEmail) {
      const clientHtml = `<p style="font-size:16px;margin:0 0 12px;">Hi ${esc(req.contactName.split(" ")[0] || req.contactName)},</p>
        <p style="margin:0 0 12px;">We&apos;ve received your tourist visa invitation request for <strong>${req.travelers.length}</strong> traveler${req.travelers.length === 1 ? "" : "s"}.</p>
        <p style="margin:0 0 12px;">Our licensed team will review your details and contact you within 24–48 hours to prepare your invitation letter.</p>
        <p style="margin:0;color:#64748b;font-size:14px;">— JunketTours</p>`;

      await resend.emails.send({
        from: process.env.RESEND_FROM ?? "JunketTours <onboarding@resend.dev>",
        to: [clientEmail],
        subject: "We received your visa invitation request — JunketTours",
        html: clientHtml,
      });
    }
  },
});
