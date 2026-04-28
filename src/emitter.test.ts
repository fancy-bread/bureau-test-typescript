import { describe, it, expect, vi } from "vitest";
import { TypedEmitter } from "./emitter.js";

// ---------------------------------------------------------------------------
// User Story 1 — Subscribe and emit typed events
// ---------------------------------------------------------------------------

describe("TypedEmitter — on / emit (US1)", () => {
  it("US1-S1: listener receives correct payload", () => {
    const emitter = new TypedEmitter<{ ping: { id: number } }>();
    const listener = vi.fn();
    emitter.on("ping", listener);
    emitter.emit("ping", { id: 42 });
    expect(listener).toHaveBeenCalledOnce();
    expect(listener).toHaveBeenCalledWith({ id: 42 });
  });

  it("US1-S2: no error when emit called with no listeners", () => {
    const emitter = new TypedEmitter<{ ping: { id: number } }>();
    expect(() => emitter.emit("ping", { id: 1 })).not.toThrow();
  });

  it("US1-S3: two listeners on same event are both invoked in registration order", () => {
    const emitter = new TypedEmitter<{ ping: { id: number } }>();
    const order: number[] = [];
    emitter.on("ping", () => order.push(1));
    emitter.on("ping", () => order.push(2));
    emitter.emit("ping", { id: 0 });
    expect(order).toEqual([1, 2]);
  });

  it("US1-S4: listener for event A is not invoked when event B is emitted", () => {
    const emitter = new TypedEmitter<{ A: null; B: null }>();
    const listenerA = vi.fn();
    emitter.on("A", listenerA);
    emitter.emit("B", null);
    expect(listenerA).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// User Story 2 — One-time listeners
// ---------------------------------------------------------------------------

describe("TypedEmitter — once (US2)", () => {
  it("US2-S1: once listener fires only on first emit", () => {
    const emitter = new TypedEmitter<{ tick: number }>();
    const listener = vi.fn();
    emitter.once("tick", listener);
    emitter.emit("tick", 1);
    emitter.emit("tick", 2);
    expect(listener).toHaveBeenCalledOnce();
    expect(listener).toHaveBeenCalledWith(1);
  });

  it("US2-S2: once listener fires once; persistent on listener fires twice", () => {
    const emitter = new TypedEmitter<{ tick: number }>();
    const onceListener = vi.fn();
    const onListener = vi.fn();
    emitter.once("tick", onceListener);
    emitter.on("tick", onListener);
    emitter.emit("tick", 1);
    emitter.emit("tick", 2);
    expect(onceListener).toHaveBeenCalledOnce();
    expect(onListener).toHaveBeenCalledTimes(2);
  });

  it("US2-S3: once listener never fires if event is never emitted", () => {
    const emitter = new TypedEmitter<{ tick: number }>();
    const listener = vi.fn();
    emitter.once("tick", listener);
    expect(listener).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// User Story 3 — Unsubscribe and listener count
// ---------------------------------------------------------------------------

describe("TypedEmitter — off / listenerCount (US3)", () => {
  it("US3-S1: after off(listenerA), only listenerB fires on emit", () => {
    const emitter = new TypedEmitter<{ E: string }>();
    const listenerA = vi.fn();
    const listenerB = vi.fn();
    emitter.on("E", listenerA);
    emitter.on("E", listenerB);
    emitter.off("E", listenerA);
    emitter.emit("E", "hello");
    expect(listenerA).not.toHaveBeenCalled();
    expect(listenerB).toHaveBeenCalledOnce();
  });

  it("US3-S2: listenerCount decrements after off()", () => {
    const emitter = new TypedEmitter<{ E: string }>();
    const listener = vi.fn();
    emitter.on("E", listener);
    expect(emitter.listenerCount("E")).toBe(1);
    emitter.off("E", listener);
    expect(emitter.listenerCount("E")).toBe(0);
  });

  it("US3-S3: off() with unregistered function is a no-op", () => {
    const emitter = new TypedEmitter<{ E: string }>();
    const registered = vi.fn();
    const unregistered = vi.fn();
    emitter.on("E", registered);
    expect(() => emitter.off("E", unregistered)).not.toThrow();
    emitter.emit("E", "hi");
    expect(registered).toHaveBeenCalledOnce();
  });

  it("US3-S4: off() with already-fired once listener is a no-op", () => {
    const emitter = new TypedEmitter<{ E: string }>();
    const listener = vi.fn();
    emitter.once("E", listener);
    emitter.emit("E", "first");
    expect(() => emitter.off("E", listener)).not.toThrow();
  });

  it("listenerCount returns 0 before any listeners are registered", () => {
    const emitter = new TypedEmitter<{ E: string }>();
    expect(emitter.listenerCount("E")).toBe(0);
  });

  it("calling off() twice with same reference is a no-op on second call", () => {
    const emitter = new TypedEmitter<{ E: string }>();
    const listener = vi.fn();
    emitter.on("E", listener);
    emitter.off("E", listener);
    expect(() => emitter.off("E", listener)).not.toThrow();
    expect(emitter.listenerCount("E")).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// SC-004 — Type-safety: wrong payload shape must be a compile error
// ---------------------------------------------------------------------------

describe("TypedEmitter — type safety (SC-004)", () => {
  it("emitting correct payload compiles and works", () => {
    const emitter = new TypedEmitter<{ ping: { id: number } }>();
    const listener = vi.fn();
    emitter.on("ping", listener);
    // @ts-expect-error — payload 'id' must be number, not string
    emitter.emit("ping", { id: "not-a-number" });
    // Runtime still fires; the point is the compile-time rejection above
    expect(listener).toHaveBeenCalledOnce();
  });
});
