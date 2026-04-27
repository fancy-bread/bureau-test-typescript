import type { EventMap, Listener, ListenerEntry } from "./types.js";

type ListenerMap<TEvents extends EventMap> = {
  [K in keyof TEvents]?: Array<ListenerEntry<TEvents[K]>>;
};

export class TypedEmitter<TEvents extends EventMap> {
  private _listeners: ListenerMap<TEvents> = {};

  on<K extends keyof TEvents>(event: K, listener: Listener<TEvents[K]>): this {
    if (!this._listeners[event]) {
      this._listeners[event] = [];
    }
    this._listeners[event]!.push({ fn: listener, once: false });
    return this;
  }

  once<K extends keyof TEvents>(event: K, listener: Listener<TEvents[K]>): this {
    if (!this._listeners[event]) {
      this._listeners[event] = [];
    }
    this._listeners[event]!.push({ fn: listener, once: true });
    return this;
  }

  off<K extends keyof TEvents>(event: K, listener: Listener<TEvents[K]>): this {
    const entries = this._listeners[event];
    if (!entries) return this;
    const idx = entries.findIndex((e) => e.fn === listener);
    if (idx !== -1) {
      entries.splice(idx, 1);
    }
    return this;
  }

  emit<K extends keyof TEvents>(event: K, payload: TEvents[K]): this {
    const entries = this._listeners[event];
    if (!entries || entries.length === 0) return this;

    // Snapshot the list so mutations during iteration are safe
    const snapshot = entries.slice();
    // Remove once entries before invoking
    this._listeners[event] = entries.filter((e) => !e.once);

    for (const entry of snapshot) {
      entry.fn(payload);
    }
    return this;
  }

  listenerCount<K extends keyof TEvents>(event: K): number {
    return this._listeners[event]?.length ?? 0;
  }
}
