import { describe, it, expect } from "vitest";
import { TypedEmitter } from "./index.js";

describe("index re-exports", () => {
  it("exports TypedEmitter", () => {
    expect(TypedEmitter).toBeDefined();
    const emitter = new TypedEmitter<{ test: string }>();
    expect(emitter).toBeInstanceOf(TypedEmitter);
  });
});
