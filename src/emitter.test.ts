import { describe, it, expect, vi } from "vitest";
import { TypedEmitter } from "./emitter.js";

// ---------------------------------------------------------------------------
// User Story 1 — Subscribe and emit typed events
// ---------------------------------------------------------------------------

describe("US1: subscribe and emit", () => {
  it("US1-S1: listener is called once with the correct payload", () => {
    const emitter = new TypedEmitter<{ ping: { id: number } }>();
    const listener = vi.fn();
    emitter.on("ping", listener);
    emitter.emit("ping", { id: 42 });
    expect(listener).toHaveBeenCalledOnce();
    expect(listener).toHaveBeenCalledWith({ id: 42 });
  });

  it("US1-S2: no error thrown when no listeners are registered", () => {
    const emitter = new TypedEmitter<{ ping: { id: number } }>();
    expect(() => emitter.emit("ping", { id: 1 })).not.toThrow();
  });

  it("US1-S3: two listeners are both invoked in registration order", () => {
    const emitter = new TypedEmitter<{ ping: { id: number } }>();
    const order: number[] = [];
    emitter.on("ping", () => order.push(1));
    emitter.on("ping", () => order.push(2));
    emitter.emit("ping", { id: 0 });
    expect(order).toEqual([1, 2]);
  });

  it("US1-S4: listener for event A is not invoked when event B is emitted", () => {
    const emitter = new TypedEmitter<{ A: { v: string }; B: { v: string } }>();
    const listenerA = vi.fn();
    emitter.on("A", listenerA);
    emitter.emit("B", { v: "hello" });
    expect(listenerA).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// User Story 2 — One-time listeners
// ---------------------------------------------------------------------------

describe("US2: once listeners", () => {
  it("US2-S1: once listener fires on first emit only", () => {
    const emitter = new TypedEmitter<{ E: null }>();
    const listener = vi.fn();
    emitter.once("E", listener);
    emitter.emit("E", null);
    emitter.emit("E", null);
    expect(listener).toHaveBeenCalledOnce();
  });

  it("US2-S2: once listener fires once; persistent on listener fires twice", () => {
    const emitter = new TypedEmitter<{ E: null }>();
    const onceFn = vi.fn();
    const onFn = vi.fn();
    emitter.once("E", onceFn);
    emitter.on("E", onFn);
    emitter.emit("E", null);
    emitter.emit("E", null);
    expect(onceFn).toHaveBeenCalledOnce();
    expect(onFn).toHaveBeenCalledTimes(2);
  });

  it("US2-S3: once listener never called when event never emitted", () => {
    const emitter = new TypedEmitter<{ E: null }>();
    const listener = vi.fn();
    expect(() => emitter.once("E", listener)).not.toThrow();
    expect(listener).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// User Story 3 — Unsubscribe and listener count
// ---------------------------------------------------------------------------

describe("US3: off and listenerCount", () => {
  it("US3-S1: off removes the specified listener; remaining listener still fires", () => {
    const emitter = new TypedEmitter<{ E: null }>();
    const listenerA = vi.fn();
    const listenerB = vi.fn();
    emitter.on("E", listenerA);
    emitter.on("E", listenerB);
    emitter.off("E", listenerA);
    emitter.emit("E", null);
    expect(listenerA).not.toHaveBeenCalled();
    expect(listenerB).toHaveBeenCalledOnce();
  });

  it("US3-S2: listenerCount decrements after off", () => {
    const emitter = new TypedEmitter<{ E: null }>();
    const listener = vi.fn();
    emitter.on("E", listener);
    expect(emitter.listenerCount("E")).toBe(1);
    emitter.off("E", listener);
    expect(emitter.listenerCount("E")).toBe(0);
  });

  it("US3-S3: off with unregistered function is a no-op", () => {
    const emitter = new TypedEmitter<{ E: null }>();
    const registered = vi.fn();
    const unregistered = vi.fn();
    emitter.on("E", registered);
    expect(() => emitter.off("E", unregistered)).not.toThrow();
    emitter.emit("E", null);
    expect(registered).toHaveBeenCalledOnce();
  });

  it("US3-S4: off called after once has fired is a no-op", () => {
    const emitter = new TypedEmitter<{ E: null }>();
    const listener = vi.fn();
    emitter.once("E", listener);
    emitter.emit("E", null); // fires and auto-removes
    expect(() => emitter.off("E", listener)).not.toThrow();
  });

  it("US3 edge: listenerCount is 0 before any listeners registered", () => {
    const emitter = new TypedEmitter<{ E: null }>();
    expect(emitter.listenerCount("E")).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// SC-004 — Type-safety: wrong payload shape must be a compile error
// ---------------------------------------------------------------------------

describe("SC-004: type-safety at call site", () => {
  it("correct payload compiles and runs", () => {
    const emitter = new TypedEmitter<{ ping: { id: number } }>();
    const listener = vi.fn();
    emitter.on("ping", listener);
    // @ts-expect-error — wrong payload type: string instead of { id: number }
    emitter.emit("ping", "wrong");
    // The line above is rejected by the compiler; the test verifies the annotation works
    expect(listener).toHaveBeenCalledWith("wrong"); // runtime still calls through
  });
});
