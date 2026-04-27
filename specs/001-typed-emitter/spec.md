# Feature Specification: Type-Safe Event Emitter

**Feature Branch**: `001-typed-emitter`
**Created**: 2026-04-26
**Status**: Draft

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Subscribe and emit typed events (Priority: P1)

A developer defines an event map (a record of event names to payload shapes), creates an emitter typed to that map, registers a listener, and emits an event. The type system enforces the payload shape at the call site — a mismatched payload is a compile error, not a silent runtime bug.

**Why this priority**: Core capability. Nothing else works without it.

**Independent Test**: Construct an emitter, call `.on()` and `.emit()`, assert the listener receives the correct payload. No other user story is needed to verify this works.

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

**Why this priority**: Necessary for memory-safe usage in long-running programs; enables deterministic assertion in tests.

**Independent Test**: Register two listeners, call `.off()` on one, emit the event, assert only one listener fired. Assert `.listenerCount()` returns the expected number at each step.

**Acceptance Scenarios**:

1. **Given** two listeners on event `E`, **When** `.off(E, listenerA)` is called and `E` is emitted, **Then** only `listenerB` fires.
2. **Given** a listener registered via `.on()`, **When** `.off()` is called with a reference to that listener, **Then** `.listenerCount()` decrements by 1.
3. **Given** `.off()` called with a function not currently registered, **When** the event is emitted, **Then** no error is thrown and existing listeners are unaffected.
4. **Given** a `.once()` listener that has already fired, **When** `.off()` is called with its reference, **Then** no error is thrown.

---

### Edge Cases

- What happens when `.emit()` is called before any listeners are registered?
- What happens when the same listener function reference is passed to `.off()` multiple times?
- What happens when `.once()` fires and then `.off()` is called with its reference?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The emitter MUST be generic, parameterised by an event map that constrains which event names and payload shapes are valid.
- **FR-002**: `.on(event, listener)` MUST register a persistent listener; both the event name and listener payload MUST be type-checked against the event map.
- **FR-003**: `.once(event, listener)` MUST register a listener that auto-removes itself after its first invocation; same type constraints as `.on()`.
- **FR-004**: `.off(event, listener)` MUST remove the first matching listener reference; if the reference is not found, it MUST be a no-op.
- **FR-005**: `.emit(event, payload)` MUST invoke all currently registered listeners for `event` in registration order, synchronously.
- **FR-006**: `.listenerCount(event)` MUST return the count of currently active listeners (persistent + not-yet-fired once listeners) for `event`.
- **FR-007**: The implementation MUST compile without errors or type suppressions under strict compilation settings; no `any` escapes are permitted in implementation files.
- **FR-008**: The public API and any type utilities MUST be in separate, focused source files; implementation internals MUST NOT be exported.

### Key Entities

- **EventMap**: A record that maps event name strings to their corresponding payload types.
- **Listener**: A callback `(payload) => void` whose argument type is derived from the event map.
- **TypedEmitter**: The emitter class; owns the internal listener registry and enforces the event map contract.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All acceptance scenarios from User Stories 1–3 are covered by automated tests that pass when the test suite runs (`vitest run` exits 0).
- **SC-002**: The codebase compiles with zero type errors and zero type suppressions (`tsc --noEmit` exits 0; no `any`, `as any`, or `@ts-ignore` in implementation files).
- **SC-003**: Code style is consistent and passes automated linting with no warnings (`eslint . --max-warnings 0` exits 0).
- **SC-004**: Passing a payload of the wrong type at the call site produces a compile-time error — verified by a `@ts-expect-error` assertion in the test file confirming the type system actively rejects misuse.
- **SC-005**: The library has zero external runtime dependencies; only the test framework is a dev dependency.

## Assumptions

- Listeners are synchronous; async listeners are out of scope for this spec.
- No maximum-listener warning (unlike Node's built-in EventEmitter) — out of scope.
- An error thrown inside a listener propagates to the caller of `.emit()`; per-listener error isolation is out of scope.
- SC-001–SC-004 intentionally reference specific tooling commands. This is required by the project constitution (Principle V: Verifiable Outputs; Quality Gates), which supersedes the generic speckit guideline that success criteria be tool-agnostic.
