import { describe, expect, it } from "vitest";

import { findAllStrings } from "./json-utils";

describe("findAllStrings", () => {
  it("finds strings recursively and includes their paths", () => {
    const input = {
      title: "Root",
      media: {
        hero: "https://example.com/hero.jpg",
      },
      tags: ["alpha", { nested: "beta" }],
      count: 10,
    };

    const result = findAllStrings(input);

    expect(result).toEqual(
      expect.arrayContaining([
        { path: "$.title", value: "Root" },
        { path: "$.media.hero", value: "https://example.com/hero.jpg" },
        { path: "$.tags[0]", value: "alpha" },
        { path: "$.tags[1].nested", value: "beta" },
      ]),
    );
  });

  it("returns an empty array for non-objects without strings", () => {
    expect(findAllStrings(42)).toEqual([]);
    expect(findAllStrings(null)).toEqual([]);
  });
});
