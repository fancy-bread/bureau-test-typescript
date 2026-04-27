# Contract: TypedEmitter Public API

**Feature**: 001-typed-emitter
**File**: `src/emitter.ts` (exported), `src/types.ts` (type definitions)

## Type Parameters

```typescript
type EventMap = Record<string, unknown>

class TypedEmitter<TEvents extends EventMap>
```

## Methods

### `.on<K extends keyof TEvents>(event: K, listener: Listener<TEvents[K]>): this`

Registers a persistent listener for `event`. Returns `this` for chaining.

- Listener is called on every subsequent `.emit(event, ...)`.
- Multiple listeners for the same event are stored and called in registration order.
- Registering the same function reference more than once adds duplicate entries.

### `.once<K extends keyof TEvents>(event: K, listener: Listener<TEvents[K]>): this`

Registers a listener that fires at most once, then removes itself. Returns `this` for chaining.

- The listener is invoked on the next `.emit(event, ...)` and then removed before control returns.
- If `.off()` is called before the event fires, the listener is removed immediately and never invoked.

### `.off<K extends keyof TEvents>(event: K, listener: Listener<TEvents[K]>): void`

Removes the first listener entry whose `.fn` equals `listener` by reference.

- No-op if the reference is not found.
- No-op if called after a `.once()` listener has already fired (entry was already removed).

### `.emit<K extends keyof TEvents>(event: K, payload: TEvents[K]): void`

Calls all currently registered listeners for `event` with `payload`, in registration order, synchronously.

- Removes `once` entries before invoking them (so re-entrant emits during the listener do not re-invoke).
- Does not catch errors thrown by listeners; exceptions propagate to the caller.

### `.listenerCount<K extends keyof TEvents>(event: K): number`

Returns the count of currently active listeners for `event` (persistent + not-yet-fired once listeners).

Returns `0` if no listeners are registered for the event.

## Exports from `src/index.ts`

```typescript
export { TypedEmitter } from './emitter.js'
export type { EventMap, Listener } from './types.js'
```

## Usage Example

```typescript
import { TypedEmitter } from './index.js'

type AppEvents = {
  'user:login': { userId: string }
  'data:update': { key: string; value: unknown }
}

const emitter = new TypedEmitter<AppEvents>()

emitter.on('user:login', ({ userId }) => console.log(userId))
emitter.once('data:update', ({ key }) => console.log(key))
emitter.emit('user:login', { userId: '42' })

// Compile error (verified by @ts-expect-error in tests):
// emitter.emit('user:login', { userId: 99 })  ← number is not string
```
