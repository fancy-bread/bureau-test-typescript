export type EventMap = Record<string, unknown>;

export type Listener<T> = (payload: T) => void;

// Internal only — not exported from index
export type ListenerEntry<T> = { fn: Listener<T>; once: boolean };
