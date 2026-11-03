import { useState } from 'react'
import { formatJson, type FormatResult } from '../utils/formatJson.ts'

function JsonFormatter() {
  const [input, setInput] = useState('')
  const [result, setResult] = useState<FormatResult | null>(null)

  function handleFormat() {
    setResult(formatJson(input))
  }

  return (
    <div className="formatter">
      <section className="panel">
        <label htmlFor="json-input" className="panel-label">
          Input
        </label>
        <textarea
          id="json-input"
          className="editor"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder='{"paste": "your JSON here"}'
          spellCheck={false}
          aria-invalid={result?.ok === false}
          aria-describedby={result?.ok === false ? 'json-error' : undefined}
        />
        <button type="button" className="format-button" onClick={handleFormat}>
          Format
        </button>
      </section>

      <section className="panel">
        <label htmlFor="json-output" className="panel-label">
          Output
        </label>
        {result?.ok === false && (
          <p id="json-error" className="error" role="alert">
            {result.error.message}
          </p>
        )}
        <textarea
          id="json-output"
          className="editor"
          value={result?.ok ? result.formatted : ''}
          readOnly
          spellCheck={false}
        />
      </section>
    </div>
  )
}

export default JsonFormatter
