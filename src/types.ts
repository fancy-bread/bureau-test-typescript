/**
 * A record mapping event name strings to their payload types.
 */
export type EventMap = Record<string, unknown>;

/**
 * A callback invoked when an event fires.
 */
export type Listener<T> = (payload: T) => void;

/**
 * Internal registry entry — not exported from the public API.
 */
export type ListenerEntry<T> = {
  fn: Listener<T>;
  once: boolean;
};
