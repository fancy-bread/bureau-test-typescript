import type { EventMap, Listener, ListenerEntry } from "./types.js";

type ListenerMap<TEvents extends EventMap> = {
  [K in keyof TEvents]?: Array<ListenerEntry<TEvents[K]>>;
};

export class TypedEmitter<TEvents extends EventMap> {
  private _listeners: ListenerMap<TEvents> = {};

  on<K extends keyof TEvents>(event: K, listener: Listener<TEvents[K]>): this {
    const entries = this._listeners[event];
    if (entries === undefined) {
      this._listeners[event] = [{ fn: listener, once: false }];
    } else {
      entries.push({ fn: listener, once: false });
    }
    return this;
  }

  once<K extends keyof TEvents>(event: K, listener: Listener<TEvents[K]>): this {
    const entries = this._listeners[event];
    if (entries === undefined) {
      this._listeners[event] = [{ fn: listener, once: true }];
    } else {
      entries.push({ fn: listener, once: true });
    }
    return this;
  }

  off<K extends keyof TEvents>(event: K, listener: Listener<TEvents[K]>): this {
    const entries = this._listeners[event];
    if (entries === undefined) return this;
    const idx = entries.findIndex((e) => e.fn === listener);
    if (idx !== -1) {
      entries.splice(idx, 1);
    }
    return this;
  }

  emit<K extends keyof TEvents>(event: K, payload: TEvents[K]): this {
    const entries = this._listeners[event];
    if (entries === undefined) return this;
    // Snapshot and filter out once-entries before invoking
    const toCall = entries.slice();
    this._listeners[event] = entries.filter((e) => !e.once);
    for (const entry of toCall) {
      entry.fn(payload);
    }
    return this;
  }

  listenerCount<K extends keyof TEvents>(event: K): number {
    return this._listeners[event]?.length ?? 0;
  }
}
