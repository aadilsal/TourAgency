import { describe, expect, test } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";

function visit(headers: Record<string, string> = {}) {
  return middleware(new NextRequest("https://www.junkettours.co/tours", { headers }));
}

describe("currency middleware", () => {
  test("first visit from Pakistan defaults to PKR", () => {
    const res = visit({ "x-vercel-ip-country": "PK" });
    expect(res.cookies.get("jt_currency")?.value).toBe("PKR");
  });

  test("first visit from anywhere else defaults to USD", () => {
    expect(visit({ "x-vercel-ip-country": "GB" }).cookies.get("jt_currency")?.value).toBe("USD");
    expect(visit().cookies.get("jt_currency")?.value).toBe("USD");
  });

  test("the first page already renders in the chosen currency", () => {
    // Forwarded request cookie, so server components see it on this request.
    const res = visit({ "x-vercel-ip-country": "PK" });
    expect(res.headers.get("x-middleware-request-cookie")).toContain("jt_currency=PKR");
  });

  test("never overrides a visitor's own choice", () => {
    // A Pakistani visitor who switched to USD keeps USD.
    const res = visit({ "x-vercel-ip-country": "PK", cookie: "jt_currency=USD" });
    expect(res.cookies.get("jt_currency")).toBeUndefined();
  });
});
