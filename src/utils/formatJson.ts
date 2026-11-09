import { findSyntaxError } from './findSyntaxError.ts'

/** Number of spaces, or a tab character. */
export type Indent = number | '\t'

export const DEFAULT_INDENT: Indent = 2

export const EMPTY_INPUT_MESSAGE = 'Please enter some JSON first.'

export interface ErrorLocation {
  line: number
  column: number
}

/** An excerpt of the line containing an error, and where in the excerpt the error is. */
export interface ErrorSnippet {
  text: string
  pointerIndex: number
}

export interface FormatError {
  message: string
  location?: ErrorLocation
  snippet?: ErrorSnippet
}

/** Characters shown on each side of the error, so long (e.g. minified) lines stay readable. */
const SNIPPET_CONTEXT_LENGTH = 30

export type FormatResult =
  | { ok: true; formatted: string }
  | { ok: false; error: FormatError }

/**
 * Parses the input as JSON and returns it re-serialized with consistent indentation.
 * Never throws: invalid input is returned as a FormatError.
 */
export function formatJson(input: string, indent: Indent = DEFAULT_INDENT): FormatResult {
  return transformJson(input, (parsed) => JSON.stringify(parsed, null, indent))
}

/**
 * Parses the input as JSON and returns it re-serialized without any whitespace.
 * Never throws: invalid input is returned as a FormatError.
 */
export function minifyJson(input: string): FormatResult {
  return transformJson(input, (parsed) => JSON.stringify(parsed))
}

function transformJson(input: string, serialize: (parsed: unknown) => string): FormatResult {
  if (input.trim() === '') {
    return { ok: false, error: { message: EMPTY_INPUT_MESSAGE } }
  }

  try {
    const parsed: unknown = JSON.parse(input)
    return { ok: true, formatted: serialize(parsed) }
  } catch (error) {
    return { ok: false, error: describeParseError(error, input) }
  }
}

function describeParseError(error: unknown, input: string): FormatError {
  const issue = findSyntaxError(input)
  if (issue) {
    const location = positionToLineColumn(input, issue.position)
    return {
      message: `Invalid JSON on line ${location.line}. ${issue.reason}`,
      location,
      snippet: getErrorSnippet(input, location),
    }
  }

  // Fallback: use whatever the browser's own error message tells us.
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
    message: `Invalid JSON on line ${location.line}.`,
    location,
    snippet: getErrorSnippet(input, location),
  }
}

/**
 * Returns the part of the line around the error. Tabs become single spaces so that
 * a pointer placed underneath lines up with the right character.
 */
export function getErrorSnippet(input: string, location: ErrorLocation): ErrorSnippet | undefined {
  const line = input.split('\n')[location.line - 1]
  if (line === undefined) return undefined

  const text = line.replace(/\r$/, '').replace(/\t/g, ' ')
  const errorIndex = Math.min(Math.max(location.column - 1, 0), text.length)
  const start = Math.max(0, errorIndex - SNIPPET_CONTEXT_LENGTH)
  const end = Math.min(text.length, errorIndex + SNIPPET_CONTEXT_LENGTH)
  const prefix = start > 0 ? '…' : ''
  const suffix = end < text.length ? '…' : ''

  return {
    text: prefix + text.slice(start, end) + suffix,
    pointerIndex: prefix.length + errorIndex - start,
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
