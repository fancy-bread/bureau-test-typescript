import { describe, it, expect } from "vitest";
import { TypedEmitter } from "./index.js";
import type { EventMap, Listener } from "./index.js";

describe("index re-exports", () => {
  it("TypedEmitter is exported from index", () => {
    type Events = { test: { value: string } };
    const emitter = new TypedEmitter<Events>();
    expect(emitter).toBeInstanceOf(TypedEmitter);
  });

  it("EventMap and Listener types are usable from index", () => {
    // Type-level check: ensure EventMap and Listener are importable and usable as constraints
    type MyListener = Listener<string>;
    const fn: MyListener = (s) => s.toUpperCase();
    expect(fn("hello")).toBe("HELLO");

    // EventMap used as a type constraint — verify the emitter accepts it
    const emitter = new TypedEmitter<EventMap>();
    expect(emitter).toBeInstanceOf(TypedEmitter);
  });
});
