# JSONFormatter

JSON Formatter is a web-based tool that helps users format, validate, and read JSON data more easily.

The tool solves the problem of working with poorly formatted or difficult-to-read JSON, which can be challenging to inspect and debug.

All processing happens locally in the browser. No JSON is sent to a server.

## Requirements

- Node.js 22.12 or later (the project uses Node 24, see `.nvmrc`)
- npm

If you use nvm, run `nvm use` in the project folder to select the right Node version.

## Getting started

```bash
npm install
npm run dev
```

The development server runs at http://localhost:5173.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Type-check and build for production into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run the tests once |
| `npm run test:watch` | Run the tests in watch mode |
| `npm run lint` | Lint the code with oxlint |

## Project structure

```text
src/
  App.tsx       Root component
  main.tsx      Application entry point
  index.css     Base styles
tests/          Automated tests (Vitest)
```

JSON processing logic will live in `src/utils/` and UI components in `src/components/` as they are added.
