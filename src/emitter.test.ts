import { describe, it, expect, vi } from "vitest";
import { TypedEmitter } from "./emitter.js";
import type { EventMap } from "./types.js";

// ---------------------------------------------------------------------------
// User Story 1 — Subscribe and emit typed events
// ---------------------------------------------------------------------------

describe("US1 — on() / emit()", () => {
  it("US1-S1: listener receives the correct payload", () => {
    type Events = { ping: { id: number } };
    const emitter = new TypedEmitter<Events>();
    const listener = vi.fn();
    emitter.on("ping", listener);
    emitter.emit("ping", { id: 42 });
    expect(listener).toHaveBeenCalledOnce();
    expect(listener).toHaveBeenCalledWith({ id: 42 });
  });

  it("US1-S2: no error when emit() is called with no listeners registered", () => {
    type Events = { ping: { id: number } };
    const emitter = new TypedEmitter<Events>();
    expect(() => emitter.emit("ping", { id: 1 })).not.toThrow();
  });

  it("US1-S3: two listeners on same event are both invoked in registration order", () => {
    type Events = { click: { x: number } };
    const emitter = new TypedEmitter<Events>();
    const order: number[] = [];
    emitter.on("click", () => order.push(1));
    emitter.on("click", () => order.push(2));
    emitter.emit("click", { x: 0 });
    expect(order).toEqual([1, 2]);
  });

  it("US1-S4: listener for event A is not invoked when event B is emitted", () => {
    type Events = { a: { v: string }; b: { v: string } };
    const emitter = new TypedEmitter<Events>();
    const listenerA = vi.fn();
    emitter.on("a", listenerA);
    emitter.emit("b", { v: "hello" });
    expect(listenerA).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// User Story 2 — One-time listeners
// ---------------------------------------------------------------------------

describe("US2 — once()", () => {
  it("US2-S1: once() listener fires on first emit only", () => {
    type Events = { tick: undefined };
    const emitter = new TypedEmitter<Events>();
    const listener = vi.fn();
    emitter.once("tick", listener);
    emitter.emit("tick", undefined);
    emitter.emit("tick", undefined);
    expect(listener).toHaveBeenCalledOnce();
  });

  it("US2-S2: once() fires once while on() fires each time", () => {
    type Events = { tick: undefined };
    const emitter = new TypedEmitter<Events>();
    const onceListener = vi.fn();
    const onListener = vi.fn();
    emitter.once("tick", onceListener);
    emitter.on("tick", onListener);
    emitter.emit("tick", undefined);
    emitter.emit("tick", undefined);
    expect(onceListener).toHaveBeenCalledOnce();
    expect(onListener).toHaveBeenCalledTimes(2);
  });

  it("US2-S3: once() listener that is never emitted is never called and no error occurs", () => {
    type Events = { tick: undefined };
    const emitter = new TypedEmitter<Events>();
    const listener = vi.fn();
    expect(() => emitter.once("tick", listener)).not.toThrow();
    expect(listener).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// User Story 3 — Unsubscribe and listener count
// ---------------------------------------------------------------------------

describe("US3 — off() / listenerCount()", () => {
  it("US3-S1: off() removes listener; only remaining listener fires", () => {
    type Events = { data: number };
    const emitter = new TypedEmitter<Events>();
    const listenerA = vi.fn();
    const listenerB = vi.fn();
    emitter.on("data", listenerA);
    emitter.on("data", listenerB);
    emitter.off("data", listenerA);
    emitter.emit("data", 99);
    expect(listenerA).not.toHaveBeenCalled();
    expect(listenerB).toHaveBeenCalledOnce();
  });

  it("US3-S2: listenerCount() decrements after off()", () => {
    type Events = { data: number };
    const emitter = new TypedEmitter<Events>();
    const listener = vi.fn();
    emitter.on("data", listener);
    expect(emitter.listenerCount("data")).toBe(1);
    emitter.off("data", listener);
    expect(emitter.listenerCount("data")).toBe(0);
  });

  it("US3-S3: off() with unregistered function is a no-op; existing listeners unaffected", () => {
    type Events = { data: number };
    const emitter = new TypedEmitter<Events>();
    const registered = vi.fn();
    const unregistered = vi.fn();
    emitter.on("data", registered);
    expect(() => emitter.off("data", unregistered)).not.toThrow();
    emitter.emit("data", 1);
    expect(registered).toHaveBeenCalledOnce();
  });

  it("US3-S4: off() on an already-fired once() listener is a no-op", () => {
    type Events = { data: number };
    const emitter = new TypedEmitter<Events>();
    const listener = vi.fn();
    emitter.once("data", listener);
    emitter.emit("data", 1); // fires and auto-removes
    expect(() => emitter.off("data", listener)).not.toThrow();
  });

  it("listenerCount() returns 0 for an event with no listeners", () => {
    type Events = { data: number };
    const emitter = new TypedEmitter<Events>();
    expect(emitter.listenerCount("data")).toBe(0);
  });

  it("calling off() multiple times with the same reference only removes one entry", () => {
    type Events = { data: number };
    const emitter = new TypedEmitter<Events>();
    const listener = vi.fn();
    emitter.on("data", listener);
    emitter.on("data", listener); // registered twice
    emitter.off("data", listener); // removes only first match
    expect(emitter.listenerCount("data")).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// SC-004 — Type-safety: wrong payload type is a compile-time error
// ---------------------------------------------------------------------------

describe("SC-004 — compile-time type enforcement", () => {
  it("passing the wrong payload type is rejected by the type system", () => {
    type Events = { ping: { id: number } };
    const emitter = new TypedEmitter<Events>();

    // @ts-expect-error — string is not assignable to { id: number }
    emitter.emit("ping", "wrong-type");

    // The directive above must suppress a real error. If TypeScript stops rejecting
    // that line, the directive becomes unused and tsc --noEmit will fail.
    expect(true).toBe(true); // vitest still passes at runtime
  });

  it("registering a listener with a mismatched payload property is rejected", () => {
    type Events = { ping: { id: number } };
    const emitter = new TypedEmitter<Events>();

    // @ts-expect-error — { name: string } is not assignable to { id: number }
    emitter.emit("ping", { name: "wrong" });

    expect(true).toBe(true);
  });
});

// Verify EventMap is usable as a generic constraint from the public API
function acceptsEventMap<T extends EventMap>(emitter: TypedEmitter<T>): TypedEmitter<T> {
  return emitter;
}
acceptsEventMap(new TypedEmitter<{ x: number }>());
