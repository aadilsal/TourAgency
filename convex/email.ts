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
    const adminHtml = `<p style="font-size:16px;margin:0 0 12px;"><strong>New booking alert</strong></p>
        <p style="margin:0 0 8px;"><strong>${esc(booking.name)}</strong> requested <strong>${esc(tourTitle)}</strong></p>
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
      subject: `New guest booking: ${tourTitle}`,
      html: adminHtml,
    });

    const guestEmail = booking.email?.trim();
    if (guestEmail) {
      const guestHtml = `<p style="font-size:16px;margin:0 0 12px;">Hi ${esc(booking.name.split(" ")[0] || booking.name)},</p>
        <p style="margin:0 0 12px;">We&apos;ve received your booking request for <strong>${esc(tourTitle)}</strong>.</p>
        <p style="margin:0 0 8px;"><strong>Your details</strong></p>
        <ul style="margin:0 0 12px;padding-left:20px;">
          <li>Preferred start: ${esc(startDate)}</li>
          <li>Travelers: ${booking.peopleCount}</li>
          <li>Phone on file: ${esc(booking.phone)}</li>
        </ul>
        <p style="margin:0 0 12px;"><strong>Next steps</strong></p>
        <p style="margin:0 0 12px;">Our team will contact you shortly to confirm availability, inclusions, and payment.</p>
        <p style="margin:0;color:#64748b;font-size:14px;">— JunketTours</p>`;

      await resend.emails.send({
        from: process.env.RESEND_FROM ?? "JunketTours <onboarding@resend.dev>",
        to: [guestEmail],
        subject: `We received your booking request — ${tourTitle}`,
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
    await resend.emails.send({
      from: process.env.RESEND_FROM ?? "JunketTours <onboarding@resend.dev>",
      to: [to],
      subject: `New customer booking: ${tour?.title ?? "Tour"}`,
      html: `<p><strong>${user?.name}</strong> (${user?.email}) booked <strong>${tour?.title}</strong></p>
        <p>People: ${booking.peopleCount}</p>
        <p>Total: ${booking.totalPrice}</p>
        <p>Adults / children: ${booking.adults ?? "—"} / ${booking.children ?? "—"}</p>
        <p>Travel window: ${booking.preferredStart ?? "—"} → ${booking.preferredEnd ?? "—"}</p>
        <p>Departure city: ${booking.departureCity ?? "—"}</p>
        <p>Special needs: ${booking.specialNeeds ?? "—"}</p>
        <p>Notes: ${booking.notes ?? "—"}</p>`,
    });
  },
});
