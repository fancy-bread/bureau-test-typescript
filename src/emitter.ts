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
    const index = entries.findIndex((entry) => entry.fn === listener);
    if (index !== -1) {
      entries.splice(index, 1);
    }
    return this;
  }

  emit<K extends keyof TEvents>(event: K, payload: TEvents[K]): void {
    const entries = this._listeners[event];
    if (entries === undefined) return;
    // Snapshot so that mutations during iteration don't affect current emit
    const snapshot = entries.slice();
    for (const entry of snapshot) {
      if (entry.once) {
        const idx = entries.indexOf(entry);
        if (idx !== -1) entries.splice(idx, 1);
      }
      entry.fn(payload);
    }
  }

  listenerCount<K extends keyof TEvents>(event: K): number {
    return this._listeners[event]?.length ?? 0;
  }
}
