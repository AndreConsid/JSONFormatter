# CLAUDE.md

## Project

JSON Formatter is a web-based tool that helps users format, validate, and read JSON data more easily.

The tool solves the problem of working with poorly formatted or difficult-to-read JSON, which can be challenging to inspect and debug.

Users should be able to paste JSON into an editor, format it with consistent indentation, and receive clear error messages when the input is invalid.

The goal is to build a simple, reliable, and user-friendly application that works directly in the browser.

## Tech stack

- React for building the user interface.
- TypeScript for type safety and maintainable code.
- Vite for development and production builds.
- Vitest for automated tests.
- Git and GitHub for version control and source code hosting.

Use native JavaScript JSON functionality where possible, including `JSON.parse()` and `JSON.stringify()`, rather than introducing unnecessary libraries.

The application should run entirely in the browser. No backend or database is required for the initial version.

## Code conventions

- Use TypeScript for application code.
- Use clear and descriptive names for variables, functions, and components.
- Prefer small functions with a single responsibility.
- Keep components focused on one purpose.
- Use consistent formatting and follow the conventions already established in the project.
- Add type annotations where they improve clarity and type safety.
- Handle invalid JSON and unexpected input gracefully.
- Write automated tests for core functionality and important edge cases.
- Keep the code simple and readable. Avoid premature abstraction.

## Architecture

- Separate JSON processing logic from UI components.
- Keep formatting and validation logic in independently testable functions.
- Keep the application client-side for the initial version.
- Avoid global variables and global mutable state.
- Pass data explicitly between functions and components.
- Keep side effects separate from core JSON processing logic.
- Functions should do one thing and have a clear responsibility.
- Provide useful error messages without exposing unnecessary technical details to users.
- Do not send user-provided JSON to external services. All processing should happen locally in the browser.
- Avoid duplicating logic across components.
- Prefer straightforward solutions over unnecessary architectural complexity.

## Rules

- Do not add or replace dependencies without asking for approval.
- Do not introduce a backend, database, authentication, or external API without explicit approval.
- Do not add features outside the agreed project scope without discussing them first.
- Do not rewrite existing code or change the architecture unnecessarily.
- Do not remove existing functionality or tests to simplify implementation.
- Do not ignore TypeScript errors, failing tests, or build errors.
- Do not claim that functionality works without running the relevant tests or checks when possible.
- Do not execute user-provided JSON as code.
- Do not store or transmit user-provided JSON outside the browser.
- Do not commit directly to the main branch unless explicitly instructed.
- Ask before making significant architectural changes.

## Project structure

Keep the project structure simple and follow the existing repository layout. A possible structure is:

```text
/
├── CLAUDE.md
├── src/
│   ├── components/       # UI components
│   ├── utils/            # JSON formatting and validation logic
│   ├── App.tsx           # Main application component
│   └── main.tsx          # Application entry point
├── tests/                # Automated tests
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

Adapt this structure to the existing repository rather than moving files unnecessarily.

## Development workflow

- Inspect the existing codebase before making changes.
- Explain the proposed approach before implementing substantial changes.
- Make changes in small, manageable steps.
- Add or update tests when changing core functionality.
- Run relevant tests and build checks after implementation.
- Summarize changes, tests performed, and known limitations.

## Scope and priorities

Prioritize the following features for the initial version:

1. Accept JSON input from the user.
2. Format valid JSON with consistent indentation.
3. Validate JSON and display helpful error messages.
4. Provide a clear and responsive user interface.
5. Include automated tests for formatting and validation.

Potential future enhancements include minifying JSON, copying formatted output, loading JSON files, and configurable indentation.

Do not implement future enhancements until the core functionality is complete and tested.
