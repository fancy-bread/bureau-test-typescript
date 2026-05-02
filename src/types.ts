export type EventMap = Record<string, unknown>;

export type Listener<T> = (payload: T) => void;

// Internal — not exported from the public API
export type ListenerEntry<T> = { fn: Listener<T>; once: boolean };
