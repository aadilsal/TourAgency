import { expect, test } from "vitest";
import { emailSendUrl, invoiceMessage, itineraryMessage, whatsappSendUrl } from "./sendToCustomer";

test("WhatsApp link turns a local 03xx number into 923xx and encodes the message", () => {
  const url = whatsappSendUrl("0300-123 4567", "Hi & bye");
  expect(url).toBe("https://wa.me/923001234567?text=Hi%20%26%20bye");
  expect(whatsappSendUrl("+92 300 1234567", "x")).toBe("https://wa.me/923001234567?text=x");
  expect(whatsappSendUrl("", "x")).toBeNull();
  expect(whatsappSendUrl(undefined, "x")).toBeNull();
});

test("email link needs a real-looking address", () => {
  expect(emailSendUrl("a@b.co", "Sub ject", "Body")).toBe("mailto:a@b.co?subject=Sub%20ject&body=Body");
  expect(emailSendUrl("not-an-email", "s", "b")).toBeNull();
  expect(emailSendUrl("", "s", "b")).toBeNull();
});

test("messages include the trip, dates and total", () => {
  const it = itineraryMessage({
    clientName: "Ahmed Ali",
    title: "Hunza Escape",
    startDate: "2026-11-01",
    endDate: "2026-11-05",
    days: 5,
    priceLabel: "PKR 150,000 (Standard)",
  });
  expect(it).toContain("Ahmed!");
  expect(it).toContain("Hunza Escape");
  expect(it).toContain("2026-11-01 to 2026-11-05 (5 days)");
  expect(it).toContain("Total: PKR 150,000 (Standard)");

  const inv = invoiceMessage({
    clientName: "Sara",
    invoiceNumber: "INV/26-27/0001",
    tripTitle: "Hunza Escape",
    totalLabel: "PKR 150,000",
    dueLabel: "PKR 75,000",
  });
  expect(inv).toContain("INV/26-27/0001");
  expect(inv).toContain("Total: PKR 150,000");
  expect(inv).toContain("Amount due: PKR 75,000");
});
