# AGENTS.md

This file defines how Codex should work in this repository.
- Prefer: propose a plan first, then apply changes.
- For risky changes, make one small PR-like step at a time.

## Project summary
- Vite + React + TypeScript learning platform focused on HTML and CSS.
- Users write HTML/CSS in a Monaco-based editor and complete ordered tasks.
- Prioritize clarity and teaching value in code and UI.
- The project will later support multiple users and backend persistence.

## Current project structure (important)
- This project does NOT use a `features/` folder.
- Keep the existing structure and avoid moving files unless explicitly requested.
- Key areas:
  - `src/components/CodeEditor/` — editor UI, tabs, run/format/clear actions, output rendering.
  - `src/utils/monacoSetup.ts` — Monaco language validation/lint configuration.
  - `src/utils/checkLesson.ts` + `src/utils/validateHtmlCss.ts` — task checking logic.
  - `src/store/slices/userCodeSlice.ts` — per-lesson code state (html/css).
  - `src/store/slices/progressSlice.ts` — lesson/task progress state.
  - `src/data/lessonData.ts` — static lesson/task definitions.

## Editor & validation rules
- Monaco Editor is used for editing HTML and CSS in separate tabs.
- Show validation feedback as the user types (diagnostics/markers) whenever possible.
- Prefer Monaco language services / markers for HTML/CSS errors.
- Avoid regex-based HTML parsing for "unclosed tags".
- If deeper HTML parsing is needed, prefer a real parser (e.g., parse5) ONLY with user approval to add dependencies.
- Validation must be fully client-side and must NOT rely on external services.
- Keep validation logic separate from lesson progress logic.

## Learning flow rules
- Lessons contain multiple ordered tasks.
- A task unlocks only after the previous task is completed.
- Tasks are validated automatically when the user clicks "Run Code".
- Completed tasks are marked automatically.
- The "Next lesson" navigation unlocks only after all tasks are complete.

## Task checking (current implementation constraints)
- Task validation currently renders user HTML/CSS into a hidden iframe and uses DOM queries + computed styles.
- Preserve this behavior unless explicitly asked to change it.
- Ensure the iframe is always cleaned up (no leaks on early returns).
- Do not introduce security-sensitive behavior (no network calls, no unsafe eval).

## State management & backend readiness
- Redux is the source of truth for:
  - code per lesson (`userCodeSlice`)
  - progress (`progressSlice`)
- Prepare code for future multi-user + backend by:
  - keeping state shapes serializable
  - avoiding DOM objects in Redux
  - designing progress/code models so they can be saved/loaded per `userId`
- Do not implement backend or auth unless explicitly requested.
- If adding persistence, propose an abstraction layer (e.g., `storage/` with interface) that can later be swapped to API.

## Coding rules
- Use TypeScript for all new code; avoid `any` unless explicitly required.
- Prefer functional components and React hooks.
- Keep changes minimal and focused; avoid refactors unless requested.
- Do not add new dependencies without user approval.
- Match existing styling approach (SCSS modules are used in this repo).
- Keep exports consistent with existing files (default exports are used in components).

## UI/UX guidance
- UI should feel instructional and supportive.
- Keep layouts responsive and simple.
- User-facing text should be in Ukrainian (unless the file already uses another language).

## Testing
- This repository currently has no automated tests.
- Do NOT introduce test frameworks (Vitest/Jest/Playwright/Cypress) unless explicitly asked.
- Provide manual verification steps for any change.

## How Codex should work
- Before editing, scan relevant files to match existing patterns.
- Prefer small diffs; do not rewrite whole files unless necessary.
- Explain what changed and why, referencing the affected files.
- If behavior may change, call it out and suggest how to verify.
- Do not run networked commands or install packages without approval.
