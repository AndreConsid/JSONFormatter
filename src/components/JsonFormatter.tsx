import { useState } from 'react'
import {
  DEFAULT_INDENT,
  formatJson,
  minifyJson,
  type FormatResult,
  type Indent,
} from '../utils/formatJson.ts'
import CopyButton from './CopyButton.tsx'
import ErrorMessage from './ErrorMessage.tsx'
import FileLoader from './FileLoader.tsx'
import IndentSelect from './IndentSelect.tsx'

function JsonFormatter() {
  const [input, setInput] = useState('')
  const [indent, setIndent] = useState<Indent>(DEFAULT_INDENT)
  const [result, setResult] = useState<FormatResult | null>(null)

  const output = result?.ok ? result.formatted : ''
  const hasError = result?.ok === false

  function handleFileLoaded(text: string) {
    setInput(text)
    setResult(null)
  }

  function handleFileError(message: string) {
    setResult({ ok: false, error: { message } })
  }

  return (
    <div className="formatter">
      <section className="panel">
        <div className="panel-header">
          <label htmlFor="json-input" className="panel-label">
            Input
          </label>
          <FileLoader onLoad={handleFileLoaded} onError={handleFileError} />
        </div>
        <textarea
          id="json-input"
          className="editor"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder='{"paste": "your JSON here"}'
          spellCheck={false}
          aria-invalid={hasError}
          aria-describedby={hasError ? 'json-error' : undefined}
        />
        <div className="toolbar">
          <button
            type="button"
            className="button button-primary"
            onClick={() => setResult(formatJson(input, indent))}
          >
            Format
          </button>
          <button type="button" className="button" onClick={() => setResult(minifyJson(input))}>
            Minify
          </button>
          <IndentSelect value={indent} onChange={setIndent} />
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <label htmlFor="json-output" className="panel-label">
            Output
          </label>
          <CopyButton text={output} />
        </div>
        {/* The error covers the output box instead of pushing it down, so both panels keep the same size. */}
        <div className="output-area">
          <textarea
            id="json-output"
            className={hasError ? 'editor editor-covered' : 'editor'}
            value={output}
            readOnly
            spellCheck={false}
          />
          {hasError && <ErrorMessage id="json-error" error={result.error} className="error-overlay" />}
        </div>
      </section>
    </div>
  )
}

export default JsonFormatter
