---
description: "Task list for 001-typed-emitter implementation"
---

# Tasks: Type-Safe Event Emitter

**Input**: Design documents from `specs/001-typed-emitter/`
**Prerequisites**: plan.md ✅, spec.md ✅, contracts/emitter-api.md ✅

**TDD enforcement**: Constitution Principle II is NON-NEGOTIABLE. Tests MUST be written (and
confirmed failing) before any implementation logic is added. The phase ordering below encodes
this: Phase 1 creates type scaffolding only, Phase 2 writes all tests (which fail), Phases 3-5
implement each user story to make those tests pass.

## Format: `[ID] [P?] [Story?] Description`

---

## Phase 1: Setup — Type Scaffolding

**Purpose**: Create the types and class skeleton that the test file needs to compile.
No implementation logic in this phase — method bodies throw `Error('not implemented')`.

- [ ] T001 Replace `src/index.ts` with a bare re-export stub: `export {}` (removes greet placeholder)
- [ ] T002 Create `src/types.ts` — define `EventMap`, `Listener<T>`, `ListenerEntry<T>` as documented in plan.md Data Model; do not export `ListenerEntry`
- [ ] T003 Create `src/emitter.ts` — define `TypedEmitter<TEvents extends EventMap>` class with all five method stubs (`.on`, `.once`, `.off`, `.emit`, `.listenerCount`) that satisfy `tsc --noEmit` but throw `Error('not implemented')` at runtime; import types from `./types.js`

**Checkpoint**: `tsc --noEmit` exits 0. No logic implemented yet.

---

## Phase 2: Foundational — Write All Tests (RED)

**Purpose**: Write the complete test suite covering US1–US3. Every test MUST fail at this point.
Do not proceed to Phase 3 until `vitest run` shows all tests failing.

- [ ] T004 Create `src/emitter.test.ts` — write test cases for all four US1 acceptance scenarios (subscribe/emit):
  - Emitting calls all listeners with correct payload
  - Emitting with no listeners does not throw
  - Two listeners are called in registration order
  - Emitting a different event does not invoke unrelated listeners
- [ ] T005 Extend `src/emitter.test.ts` — write test cases for all three US2 acceptance scenarios (`.once()`):
  - Once listener fires only on first emit
  - Once listener fires once; persistent listener fires every time
  - Once listener registered but event never emitted — no error
- [ ] T006 Extend `src/emitter.test.ts` — write test cases for all four US3 acceptance scenarios (`.off()` / `.listenerCount()`):
  - Removing one of two listeners; only remaining listener fires
  - `.off()` decrements `.listenerCount()`
  - `.off()` with unregistered reference — no error, existing listeners unaffected
  - `.off()` after a `.once()` has already fired — no error

**Checkpoint**: `vitest run` — ALL tests fail (red). `tsc --noEmit` still exits 0. Do not proceed until this is confirmed.

---

## Phase 3: User Story 1 — Subscribe and Emit (Priority: P1) 🎯 MVP

**Goal**: Persistent listener registration and typed event dispatch.
**Independent Test**: `vitest run --reporter=verbose` — US1 describe block passes, US2/US3 still fail.

- [ ] T007 [US1] Implement `.on()` in `src/emitter.ts` — append a `{ fn, once: false }` entry to `_listeners[event]`, initialising the array if absent; return `this`
- [ ] T008 [US1] Implement `.emit()` in `src/emitter.ts` — iterate entries for the event; remove entries where `once === true` before invoking; call `entry.fn(payload)` for each; no-op if no entries

**Checkpoint**: All US1 test cases pass. US2 and US3 tests still fail. `tsc --noEmit` exits 0.

---

## Phase 4: User Story 2 — Once Listeners (Priority: P2)

**Goal**: Auto-removing one-time listeners.
**Independent Test**: US1 and US2 describe blocks both pass; US3 still fails.

- [ ] T009 [US2] Implement `.once()` in `src/emitter.ts` — append `{ fn, once: true }` entry; `.emit()` already removes `once` entries before invoking (implemented in T008), so no additional logic is required here; return `this`

**Checkpoint**: All US1 and US2 test cases pass. US3 still fails. `tsc --noEmit` exits 0.

---

## Phase 5: User Story 3 — Unsubscribe and Listener Count (Priority: P3)

**Goal**: Reference-equality removal and active listener count.
**Independent Test**: All US1, US2, and US3 describe blocks pass.

- [ ] T010 [US3] Implement `.off()` in `src/emitter.ts` — find the first entry where `entry.fn === listener`; splice it out; no-op if not found
- [ ] T011 [US3] Implement `.listenerCount()` in `src/emitter.ts` — return `this._listeners[event]?.length ?? 0`

**Checkpoint**: All US1, US2, and US3 test cases pass. `vitest run` exits 0. `tsc --noEmit` exits 0.

---

## Phase 6: Polish & Quality Gates

**Purpose**: Wire up exports, add the compile-error assertion (SC-004), and confirm all gates.

- [ ] T012 Update `src/index.ts` — export `TypedEmitter` from `./emitter.js` and `EventMap`, `Listener` types from `./types.js`
- [ ] T013 Add `@ts-expect-error` assertion to `src/emitter.test.ts` (SC-004) — add a test or inline comment that calls `.emit()` with a payload of the wrong type; annotate with `// @ts-expect-error` and assert vitest still passes (the line is intentionally invalid TypeScript that the compiler should reject)
- [ ] T014 Run full quality gates and confirm all pass:
  - `vitest run` exits 0
  - `tsc --noEmit` exits 0
  - `eslint . --max-warnings 0` exits 0
  - Grep implementation files for `any`, `as any`, `@ts-ignore` — result MUST be empty

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (needs type definitions to compile) — BLOCKS all implementation
- **US1 (Phase 3)**: Depends on Phase 2 — no other story dependencies
- **US2 (Phase 4)**: Depends on Phase 3 (`.emit()` already handles `once` removal)
- **US3 (Phase 5)**: Depends on Phase 1; independent of US2
- **Polish (Phase 6)**: Depends on all stories complete

### Within Each Phase

- T002 and T003 can run in parallel (different files, no inter-dependency)
- T004, T005, T006 are written to the same file — write sequentially
- T007 and T008 must be sequential (`.emit()` calls listeners registered by `.on()`)
- T010 and T011 can run in parallel (different methods, different files — same file, different methods; write sequentially)

### Parallel Opportunities

```bash
# Phase 1 — T002 and T003 in parallel:
Task: "Create src/types.ts with type definitions"
Task: "Create src/emitter.ts class skeleton with method stubs"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T003)
2. Complete Phase 2: Write all tests — confirm red (T004–T006)
3. Complete Phase 3: Implement US1 — confirm US1 green (T007–T008)
4. **STOP and VALIDATE**: US1 independently functional (`vitest run` passes US1 block)
5. Continue to Phase 4+ for full feature

### Incremental Delivery

1. Phase 1 + Phase 2 → Scaffold ready, all tests red
2. Phase 3 → US1 green (subscribe/emit MVP)
3. Phase 4 → US2 green (once listeners)
4. Phase 5 → US3 green (unsubscribe)
5. Phase 6 → All gates green, feature complete

---

## Notes

- `[P]` tasks = different files, no dependency — safe to run in parallel
- NodeNext requires `.js` extensions on all imports in `.ts` files
- `_listeners` is private; never exposed in the public API
- The `@ts-expect-error` in T013 must be on a line that would otherwise be a type error — if TypeScript stops erroring on that line, the `@ts-expect-error` itself becomes an error, which is the desired self-validating behaviour
