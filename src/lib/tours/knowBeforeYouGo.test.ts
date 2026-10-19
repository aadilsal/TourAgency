import { expect, test } from "vitest";
import { parseKnowBeforeYouGo } from "./knowBeforeYouGo";

test("groups bullets, numbered points, headings and paragraphs", () => {
  const blocks = parseKnowBeforeYouGo(
    [
      "Documents:",
      "- Carry your passport",
      "• Keep copies of your visa",
      "",
      "Fitness",
      "1. Short hikes most days",
      "2) One long walk at Jaulian",
      "* Back to bullets",
    ].join("\r\n"),
  );
  expect(blocks).toEqual([
    { type: "heading", text: "Documents" },
    { type: "list", ordered: false, items: ["Carry your passport", "Keep copies of your visa"] },
    { type: "paragraph", text: "Fitness" },
    { type: "list", ordered: true, items: ["Short hikes most days", "One long walk at Jaulian"] },
    { type: "list", ordered: false, items: ["Back to bullets"] },
  ]);
});

test("empty or missing text gives no blocks; lone markers are plain text", () => {
  expect(parseKnowBeforeYouGo(undefined)).toEqual([]);
  expect(parseKnowBeforeYouGo("  \n \n")).toEqual([]);
  expect(parseKnowBeforeYouGo("-")).toEqual([{ type: "paragraph", text: "-" }]);
  expect(parseKnowBeforeYouGo("2024 was busy")).toEqual([
    { type: "paragraph", text: "2024 was busy" },
  ]);
});
