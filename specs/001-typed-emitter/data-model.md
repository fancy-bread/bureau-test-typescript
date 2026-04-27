# Data Model: Type-Safe Event Emitter

**Feature**: 001-typed-emitter

## Entities

### EventMap

**Definition**: `Record<string, unknown>`

A developer-supplied type alias that maps event name strings to their payload types. Used as the type parameter constraint on `TypedEmitter<TEvents>`.

```typescript
// Example supplied by a consumer — not defined in the library
type AppEvents = {
  'user:login':  { userId: string }
  'data:update': { key: string; value: unknown }
  'shutdown':    undefined
}
```

**Validation rules**: No runtime validation — enforced entirely at compile time via TypeScript generics.

---

### Listener\<T\>

**Definition**: `(payload: T) => void`

The callback signature for a single event. `T` is derived from the event map at the call site (`TEvents[K]`), so the argument type is always exact — no narrowing required inside the callback.

**State transitions**: None. A `Listener` is a pure function reference.

---

### ListenerEntry\<T\>

**Definition**: `{ fn: Listener<T>; once: boolean }`

An internal registry entry wrapping a listener function alongside metadata about its lifecycle.

| Field | Type | Description |
|-------|------|-------------|
| `fn` | `Listener<T>` | The original listener reference, preserved for `.off()` matching |
| `once` | `boolean` | `true` if the entry should be removed on first invocation |

**Not exported.** Consumers never interact with `ListenerEntry` directly.

**State transitions**:
- Created by `.on()` with `once: false`
- Created by `.once()` with `once: true`
- Removed by `.emit()` (if `once: true`, before invocation)
- Removed by `.off()` (reference equality on `fn`)

---

### TypedEmitter\<TEvents extends EventMap\>

**Definition**: Class

The root aggregate. Owns the listener registry and enforces the event map contract across all operations.

| Field | Type | Visibility |
|-------|------|------------|
| `_listeners` | `ListenerMap<TEvents>` | Private |

Where `ListenerMap` is:

```typescript
type ListenerMap<TEvents extends EventMap> = {
  [K in keyof TEvents]?: Array<ListenerEntry<TEvents[K]>>
}
```

This partial mapped type is the key design decision: each key `K` maps to an array typed to `TEvents[K]`, preserving payload types per event without any `as` cast or `any` escape.

**Relationships**: Owns zero or more `ListenerEntry` values per event key. No relationship to external entities.

## Entity Relationships

```
TypedEmitter<TEvents>
  └── _listeners: ListenerMap<TEvents>
        └── [K in keyof TEvents]?: ListenerEntry<TEvents[K]>[]
              └── fn: Listener<TEvents[K]>
                  once: boolean
```

## Source File Mapping

| Entity | Source file | Exported |
|--------|------------|---------|
| `EventMap` | `src/types.ts` | Yes (public API) |
| `Listener<T>` | `src/types.ts` | Yes (public API) |
| `ListenerEntry<T>` | `src/types.ts` | No (internal) |
| `ListenerMap<TEvents>` | `src/types.ts` | No (internal) |
| `TypedEmitter<TEvents>` | `src/emitter.ts` | Yes (public API) |
