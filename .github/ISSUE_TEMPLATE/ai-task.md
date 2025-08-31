---
name: AI Task
about: A focused, small change for the AI agent to implement
title: "[AI] <short summary>"
labels: ["ai-task"]
assignees: []
---

## Goal
<!-- One sentence outcome, user-facing. Example: "Add debounce to search to reduce renders." -->

## Context
<!-- Module, file paths, current behavior, why it matters. -->

## Constraints
- Edit only within `src/**` and test files under `test/**`.
- Keep changes minimal. No wide refactors.
- Follow ESLint and Prettier. Keep TypeScript strict.
- Do not edit `test/test-siri.ts`.

## Acceptance checks
- Lint, typecheck, and tests pass in CI.
- `test/todoiest-api-test.ts` passes and leaves Todoist clean after the run.
- If new logic is added, add a unit test that validates the produced JSON against our schema before calling external APIs.

## Test hints
<!-- Optional: reproduce steps, sample cases, fixtures. -->

## Notes for the agent
<!-- Optional: any special instructions or forbidden areas. -->
