# JSON Formatter

[![CI/CD](https://github.com/AndreConsid/JSONFormatter/actions/workflows/deploy.yml/badge.svg?branch=main)](https://github.com/AndreConsid/JSONFormatter/actions/workflows/deploy.yml)

A browser-based tool that formats, validates and minifies JSON, so messy or broken JSON becomes easy to read and debug.

**Live:** https://andreconsid.github.io/JSONFormatter/

## What it does

You paste JSON into an editor (or load a local `.json` file) and the tool formats it with 2 spaces, 4 spaces or tabs, or minifies it to a single line. If the JSON is invalid, you get a clear error message with line and column when available. The result can be copied to the clipboard with one click. Everything runs locally in the browser: no JSON is sent to a server.

Features:

- **Format** JSON with 2 spaces, 4 spaces or tabs
- **Minify** JSON by removing all whitespace
- **Validate** JSON with clear error messages, including line and column when available
- **Copy** the result to the clipboard
- **Load** a local `.json` file (up to 5 MB) into the editor

## Getting started

### Requirements

- Node.js 22.12 or later (the project uses Node 24, see `.nvmrc`)
- npm (comes with Node.js)
- No external services, API keys or accounts are required

If you use nvm, run `nvm use` in the project folder to select the right Node version.

### Installation

```bash
git clone https://github.com/AndreConsid/JSONFormatter.git
cd JSONFormatter
npm install
```

### Configuration

No configuration is needed. The app has no backend, no database and no environment variables, so there is no `.env` file.

The only setting you may want to change is the base path used for production builds. It is set to `/JSONFormatter/` in `vite.config.ts` so the app works on GitHub Pages. If you host the app somewhere else (for example at the root of a domain), change `githubPagesBase` to match.

### Run the project

```bash
npm run dev
```

The development server runs at http://localhost:5173.

Other scripts:

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Type-check and build for production into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run the tests once |
| `npm run test:watch` | Run the tests in watch mode |
| `npm run lint` | Lint the code with oxlint |

## Architecture

The app is a single-page React application with no backend. JSON logic is kept apart from the UI: `src/utils/` holds pure functions for formatting, minifying and finding syntax errors, built on the native `JSON.parse` and `JSON.stringify`. The components in `src/components/` only handle input, display and user actions, and call those functions. Because the core logic has no side effects, it is tested directly with Vitest, and the components are tested with React Testing Library.

```text
JSONFormatter/
├── .github/workflows/   # CI/CD pipeline: lint, test, build and deploy to GitHub Pages
├── src/
│   ├── components/      # UI components (editor, copy button, file loader, indentation picker, error message)
│   ├── utils/           # JSON formatting, minifying and validation logic
│   ├── App.tsx          # Root component
│   ├── main.tsx         # Application entry point
│   └── index.css        # Base styles
├── tests/               # Automated tests (Vitest)
├── index.html           # HTML entry for Vite
└── vite.config.ts       # Build, base path and test configuration
```

### CI/CD

A GitHub Actions workflow (`.github/workflows/deploy.yml`) runs on every push and pull request to `main`:

1. Installs dependencies with `npm ci`
2. Runs the linter, the tests and the production build. Any failure stops the pipeline.
3. On push to `main` only: deploys `dist/` to GitHub Pages

No custom secrets are needed. Deployment uses the automatic `GITHUB_TOKEN`.

## Tech stack

| Component | Choice | Reason |
|---|---|---|
| UI | React | Component model fits a small interactive tool well |
| Language | TypeScript | Type safety and easier maintenance |
| Build tool | Vite | Fast dev server and simple production builds |
| JSON handling | Native `JSON.parse` / `JSON.stringify` | Reliable, no extra dependencies, and user JSON is never executed as code |
| Tests | Vitest + React Testing Library | Integrates with Vite, fast to run |
| Linting | oxlint | Fast linting with little configuration |
| Hosting | GitHub Pages | Free static hosting; no server is needed |
| CI/CD | GitHub Actions | Runs checks on every PR and deploys automatically |

## Limitations

- Numbers beyond JavaScript's safe integer range (e.g. `12345678901234567890`) lose precision when formatted, because parsing uses the native `JSON.parse`.
- Duplicate keys in an object are collapsed to the last value.
- Only strict JSON is supported. Comments, trailing commas and other JSON5 syntax are reported as errors.
- Files larger than 5 MB cannot be loaded, and very large inputs may make the editor slow.
- There is no tree view, search, or schema validation. The tool only formats, minifies and checks syntax.

## Built with

Claude Code (agent-driven development) as part of the course Next-Generation Software Development with AI.
