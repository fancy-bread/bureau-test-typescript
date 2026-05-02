// All feature tests are in emitter.test.ts
// This file intentionally left empty — vitest requires at least one suite.
import { describe, it } from "vitest";

describe("index re-exports", () => {
  it("exports TypedEmitter", async () => {
    const mod = await import("./index.js");
    // TypedEmitter must be exported
    if (typeof mod.TypedEmitter !== "function") {
      throw new Error("TypedEmitter not exported");
    }
  });
});

