import { expect, test } from "vitest";
import { parseReviewsWidget, parseStarRating } from "./reviewsWidget";

test("extracts Trustindex and Elfsight ids from pasted embed code or bare ids", () => {
  expect(
    parseReviewsWidget(`<script defer async src='https://cdn.trustindex.io/loader.js?a1b2c3d4e5f6a7b8c9d0e1f2a3'></script>`),
  ).toEqual({ provider: "trustindex", id: "a1b2c3d4e5f6a7b8c9d0e1f2a3" });
  expect(
    parseReviewsWidget(
      `<script src="https://elfsightcdn.com/platform.js" async></script>\n<div class="elfsight-app-1234ABCD-1234-1234-1234-1234567890AB" data-elfsight-app-lazy></div>`,
    ),
  ).toEqual({ provider: "elfsight", id: "1234abcd-1234-1234-1234-1234567890ab" });
  expect(parseReviewsWidget("1234abcd-1234-1234-1234-1234567890ab")?.provider).toBe("elfsight");
  expect(parseReviewsWidget("a1b2c3d4e5f6a7b8c9d0")?.provider).toBe("trustindex");
});

test("rejects empty or unrelated input — never passes HTML through", () => {
  expect(parseReviewsWidget("")).toBeNull();
  expect(parseReviewsWidget(undefined)).toBeNull();
  expect(parseReviewsWidget("<script>alert(1)</script>")).toBeNull();
  expect(parseReviewsWidget("https://example.com/widget.js")).toBeNull();
});

test("star rating parsing", () => {
  expect(parseStarRating("4.9")).toBe(4.9);
  expect(parseStarRating("4,8")).toBe(4.8);
  expect(parseStarRating("")).toBeNull();
  expect(parseStarRating("7")).toBeNull();
});
