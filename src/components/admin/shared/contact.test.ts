import { describe, expect, test } from "vitest";
import {
  greetingText,
  mailtoHref,
  splitContact,
  telHref,
  whatsappHref,
  whatsappNumber,
} from "./contact";

describe("whatsappNumber", () => {
  test("turns Pakistani local numbers into 92…", () => {
    expect(whatsappNumber("0300 1234567")).toBe("923001234567");
    expect(whatsappNumber("0300-123-4567")).toBe("923001234567");
    expect(whatsappNumber("3001234567")).toBe("923001234567");
  });
  test("keeps international numbers", () => {
    expect(whatsappNumber("+92 300 1234567")).toBe("923001234567");
    expect(whatsappNumber("0044 7700 900123")).toBe("447700900123");
    expect(whatsappNumber("+44 7700 900123")).toBe("447700900123");
  });
  test("rejects emails, blanks and junk", () => {
    expect(whatsappNumber("ali@mail.test")).toBeNull();
    expect(whatsappNumber("")).toBeNull();
    expect(whatsappNumber("—")).toBeNull();
    expect(whatsappNumber("123")).toBeNull();
  });
});

test("whatsappHref carries a friendly greeting with name and subject", () => {
  const href = whatsappHref("0300 1234567", "Ali Khan", "booking request for Hunza");
  expect(href).toMatch(/^https:\/\/wa\.me\/923001234567\?text=/);
  const text = decodeURIComponent(href!.split("?text=")[1]);
  expect(text).toBe(greetingText("Ali Khan", "booking request for Hunza"));
  expect(text).toContain("Ali!");
  expect(text).toContain("booking request for Hunza");
});

test("tel and mailto links", () => {
  expect(telHref("+92 300 1234567")).toBe("tel:+923001234567");
  expect(telHref("0300 1234567")).toBe("tel:03001234567");
  expect(telHref("ali@mail.test")).toBeNull();
  expect(mailtoHref("ali@mail.test")).toBe("mailto:ali@mail.test");
  expect(mailtoHref("nope")).toBeNull();
});

test("splitContact moves an email stored in the phone column", () => {
  expect(splitContact("ali@mail.test")).toEqual({ email: "ali@mail.test" });
  expect(splitContact("0300 1", "x@y.z")).toEqual({ phone: "0300 1", email: "x@y.z" });
  expect(splitContact("—")).toEqual({ phone: undefined, email: undefined });
});
