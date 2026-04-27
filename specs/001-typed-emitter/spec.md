# Feature Specification: Type-Safe Event Emitter

**Feature Branch**: `001-typed-emitter`
**Created**: 2026-04-26
**Status**: Draft

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Subscribe and emit typed events (Priority: P1)

A developer defines an event map (record of event names to payload types), creates an emitter typed to that map, registers a listener, and emits an event. TypeScript enforces the payload shape at the call site — wrong payload types are compile errors, not runtime errors.

**Why this priority**: Core capability. Nothing else works without it.

**Independent Test**: Construct a `TypedEmitter`, call `.on()` and `.emit()`, and assert the listener receives the correct payload. No other user story needed.

**Acceptance Scenarios**:

1. **Given** an emitter typed to `{ ping: { id: number } }`, **When** `.emit('ping', { id: 42 })` is called, **Then** every registered `ping` listener is called exactly once with `{ id: 42 }`.
2. **Given** no listeners registered for an event, **When** `.emit()` is called, **Then** no error is thrown.
3. **Given** two listeners registered for the same event, **When** `.emit()` is called, **Then** both listeners are invoked in registration order.
4. **Given** a listener registered for event `A`, **When** `.emit('B', ...)` is called, **Then** the `A` listener is not invoked.

---

### User Story 2 — One-time listeners (Priority: P2)

A developer registers a listener that fires exactly once and then removes itself automatically, regardless of how many times the event is subsequently emitted.

**Why this priority**: Common pattern; exercises internal listener lifecycle management.

**Independent Test**: Call `.once()`, emit the event twice, assert the listener was invoked exactly once.

**Acceptance Scenarios**:

1. **Given** a `.once()` listener on event `E`, **When** `E` is emitted twice, **Then** the listener fires on the first emit only.
2. **Given** a `.once()` listener and a persistent `.on()` listener on the same event, **When** the event is emitted twice, **Then** the `once` listener fires once and the `on` listener fires twice.
3. **Given** a `.once()` listener, **When** the event is never emitted, **Then** the listener is never called and no error occurs.

---

### User Story 3 — Unsubscribe and listener count (Priority: P3)

A developer removes a previously registered listener and can query how many listeners are currently registered for a given event.

**Why this priority**: Necessary for memory-safe usage in long-running programs; enables assertion in tests.

**Independent Test**: Register two listeners, call `.off()` on one, emit the event, assert only one listener fired. Assert `.listenerCount()` returns the expected number at each step.

**Acceptance Scenarios**:

1. **Given** two listeners on event `E`, **When** `.off(E, listenerA)` is called and `E` is emitted, **Then** only `listenerB` fires.
2. **Given** a listener registered via `.on()`, **When** `.off()` is called with a reference to that listener, **Then** `.listenerCount()` decrements by 1.
3. **Given** `.off()` called with a function not currently registered, **When** the event is emitted, **Then** no error is thrown and existing listeners are unaffected.
4. **Given** a `.once()` listener that has already fired, **When** `.off()` is called with its reference, **Then** no error is thrown.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `TypedEmitter<TEvents>` MUST be a generic class where `TEvents` extends `Record<string, unknown>`.
- **FR-002**: `.on(event, listener)` MUST register a persistent listener; `event` MUST be constrained to `keyof TEvents` and `listener` payload MUST be typed as `TEvents[typeof event]`.
- **FR-003**: `.once(event, listener)` MUST register a listener that auto-removes after first invocation; same type constraints as `.on()`.
- **FR-004**: `.off(event, listener)` MUST remove the first matching listener reference; if the reference is not found, MUST be a no-op.
- **FR-005**: `.emit(event, payload)` MUST invoke all currently registered listeners for `event` in registration order, synchronously.
- **FR-006**: `.listenerCount(event)` MUST return the number of currently active listeners (persistent + not-yet-fired once listeners) for `event`.
- **FR-007**: The implementation MUST compile under `strict: true` and `moduleResolution: NodeNext` with zero `any` escapes.
- **FR-008**: The public API MUST be exported from `src/emitter.ts`; event-map type utilities (if any) MUST be co-located in `src/types.ts`.

### Key Entities

- **`EventMap`**: A `Record<string, unknown>` that maps event name strings to their payload types.
- **`Listener<T>`**: `(payload: T) => void` — the callback signature for a single event.
- **`TypedEmitter<TEvents>`**: The emitter class. Owns the internal listener registry.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `vitest run` exits 0 with all scenarios from User Stories 1–3 covered by test cases.
- **SC-002**: `tsc --noEmit` exits 0 — no type errors, no suppressions.
- **SC-003**: `eslint . --max-warnings 0` exits 0.
- **SC-004**: Intentionally passing a wrong payload type (e.g., `emit('ping', { id: 'notanumber' })`) produces a TypeScript compile error — verified by a `@ts-expect-error` assertion in the test file.
- **SC-005**: No `any`, `as any`, or `@ts-ignore` appears in implementation files.

## Assumptions

- No external runtime dependencies. Only `vitest` (already installed) for tests.
- Listeners are synchronous; async listeners are out of scope.
- No maximum listener warning (unlike Node's `EventEmitter`) — out of scope.
- Error thrown inside a listener propagates to the caller of `.emit()` — no swallowing, no isolation. Out-of-scope to handle per-listener errors.
