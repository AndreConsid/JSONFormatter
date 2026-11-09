import type { FormatError } from '../utils/formatJson.ts'

interface ErrorMessageProps {
  id: string
  error: FormatError
  className?: string
}

/** Shows the error text and, when known, the faulty line with a pointer under the error. */
function ErrorMessage({ id, error, className = '' }: ErrorMessageProps) {
  const { location, snippet } = error

  return (
    <div id={id} className={`error ${className}`.trim()} role="alert">
      <p className="error-message">
        {error.message}
        {/* The pointer below is hidden from screen readers, so they get the position as text. */}
        {location && <span className="visually-hidden"> Character {location.column}.</span>}
      </p>
      {snippet && (
        <pre className="error-snippet" aria-hidden="true">
          {snippet.text}
          {'\n'}
          {' '.repeat(snippet.pointerIndex)}
          <span className="error-pointer">^</span>
        </pre>
      )}
    </div>
  )
}

export default ErrorMessage
