# JSONFormatter

JSON Formatter is a web-based tool that helps users format, validate, and read JSON data more easily.

The tool solves the problem of working with poorly formatted or difficult-to-read JSON, which can be challenging to inspect and debug.

All processing happens locally in the browser. No JSON is sent to a server.

## Features

- **Format** JSON with 2 spaces, 4 spaces or tabs
- **Minify** JSON by removing all whitespace
- **Validate** JSON with clear error messages, including line and column when available
- **Copy** the result to the clipboard
- **Load** a local `.json` file (up to 5 MB) into the editor

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
  components/   UI components (editor, copy button, file loader, indentation picker)
  utils/        JSON formatting, minifying and validation logic
  App.tsx       Root component
  main.tsx      Application entry point
  index.css     Base styles
tests/          Automated tests (Vitest)
```

## Known limitations

- Numbers beyond JavaScript's safe integer range (e.g. `12345678901234567890`) lose precision when formatted, because parsing uses the native `JSON.parse`.
- Duplicate keys in an object are collapsed to the last value.
