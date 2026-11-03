export const DEFAULT_INDENT = 2

export interface ErrorLocation {
  line: number
  column: number
}

export interface FormatError {
  message: string
  location?: ErrorLocation
}

export type FormatResult =
  | { ok: true; formatted: string }
  | { ok: false; error: FormatError }

/**
 * Parses the input as JSON and returns it re-serialized with consistent indentation.
 * Never throws: invalid input is returned as a FormatError.
 */
export function formatJson(input: string, indent: number = DEFAULT_INDENT): FormatResult {
  if (input.trim() === '') {
    return { ok: false, error: { message: 'Please enter some JSON to format.' } }
  }

  try {
    const parsed: unknown = JSON.parse(input)
    return { ok: true, formatted: JSON.stringify(parsed, null, indent) }
  } catch (error) {
    return { ok: false, error: describeParseError(error, input) }
  }
}

function describeParseError(error: unknown, input: string): FormatError {
  const rawMessage = error instanceof Error ? error.message : ''
  const location = findErrorLocation(rawMessage, input)

  if (!location) {
    const unexpectedCharacter = findUnexpectedCharacter(rawMessage)
    const hint = unexpectedCharacter
      ? `Unexpected character "${unexpectedCharacter}".`
      : 'Check for missing quotes, commas or brackets.'
    return { message: `Invalid JSON. ${hint}` }
  }

  return {
    message: `Invalid JSON at line ${location.line}, column ${location.column}.`,
    location,
  }
}

/**
 * Browsers describe JSON.parse errors differently. Chrome/Node report a character
 * position ("at position 12"), Firefox reports "line 2 column 5".
 */
export function findErrorLocation(rawMessage: string, input: string): ErrorLocation | undefined {
  const lineColumnMatch = /line (\d+) column (\d+)/i.exec(rawMessage)
  if (lineColumnMatch) {
    return { line: Number(lineColumnMatch[1]), column: Number(lineColumnMatch[2]) }
  }

  const positionMatch = /position (\d+)/i.exec(rawMessage)
  if (positionMatch) {
    return positionToLineColumn(input, Number(positionMatch[1]))
  }

  return undefined
}

/** Chrome/Node omit the position for some errors but still name the offending character. */
export function findUnexpectedCharacter(rawMessage: string): string | undefined {
  return /Unexpected token '(.+?)'/.exec(rawMessage)?.[1]
}

/** Converts a zero-based character offset into a one-based line and column. */
export function positionToLineColumn(input: string, position: number): ErrorLocation {
  const textBefore = input.slice(0, position)
  const lines = textBefore.split('\n')
  const lastLine = lines[lines.length - 1]

  return { line: lines.length, column: lastLine.length + 1 }
}
