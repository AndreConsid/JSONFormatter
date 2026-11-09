import { describe, expect, it } from 'vitest'
import {
  findErrorLocation,
  findUnexpectedCharacter,
  formatJson,
  positionToLineColumn,
} from '../src/utils/formatJson.ts'

describe('formatJson', () => {
  it('formats a compact object with two-space indentation', () => {
    const result = formatJson('{"name":"Ada","age":36}')

    expect(result).toEqual({ ok: true, formatted: '{\n  "name": "Ada",\n  "age": 36\n}' })
  })

  it('formats nested arrays and objects', () => {
    const result = formatJson('{"items":[1,{"a":true}],"empty":{}}')

    expect(result).toEqual({
      ok: true,
      formatted: '{\n  "items": [\n    1,\n    {\n      "a": true\n    }\n  ],\n  "empty": {}\n}',
    })
  })

  it('normalizes messy whitespace and existing indentation', () => {
    const result = formatJson('  {\n\t"a" :   1 ,\n        "b":[ ]  }  ')

    expect(result).toEqual({ ok: true, formatted: '{\n  "a": 1,\n  "b": []\n}' })
  })

  it('accepts top-level primitives', () => {
    expect(formatJson('42')).toEqual({ ok: true, formatted: '42' })
    expect(formatJson('"text"')).toEqual({ ok: true, formatted: '"text"' })
    expect(formatJson('null')).toEqual({ ok: true, formatted: 'null' })
  })

  it('preserves unicode and escaped characters', () => {
    const result = formatJson('{"city":"Göteborg","quote":"say \\"hi\\""}')

    expect(result).toEqual({
      ok: true,
      formatted: '{\n  "city": "Göteborg",\n  "quote": "say \\"hi\\""\n}',
    })
  })

  it('supports a custom indentation', () => {
    expect(formatJson('{"a":1}', 4)).toEqual({ ok: true, formatted: '{\n    "a": 1\n}' })
  })

  it('rejects empty and whitespace-only input with a friendly message', () => {
    const expected = { ok: false, error: { message: 'Please enter some JSON to format.' } }

    expect(formatJson('')).toEqual(expected)
    expect(formatJson('   \n\t ')).toEqual(expected)
  })

  it.each([
    ['trailing comma', '{"a":1,}'],
    ['single quotes', "{'a':1}"],
    ['unquoted key', '{a:1}'],
    ['missing closing brace', '{"a":1'],
    ['plain text', 'hello'],
    ['comment', '{"a":1 // note\n}'],
  ])('rejects invalid JSON: %s', (_description, input) => {
    const result = formatJson(input)

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.message).toMatch(/^Invalid JSON/)
    }
  })

  it('reports where a syntax error occurred', () => {
    const result = formatJson('{\n  "a": 1,\n  "b": 2,\n}')

    expect(result).toEqual({
      ok: false,
      error: {
        message: 'Invalid JSON at line 4, column 1.',
        location: { line: 4, column: 1 },
      },
    })
  })

  it('names the unexpected character when no location is available', () => {
    const result = formatJson('{"a": x}')

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.message).toMatch(/^Invalid JSON\. (Unexpected character "x"\.|.*line 1)/)
    }
  })
})

describe('findUnexpectedCharacter', () => {
  it('extracts the character from a Chrome-style message', () => {
    expect(findUnexpectedCharacter(`Unexpected token 'h', "hello" is not valid JSON`)).toBe('h')
  })

  it('returns undefined for other messages', () => {
    expect(findUnexpectedCharacter('Unexpected end of JSON input')).toBeUndefined()
  })
})

describe('findErrorLocation', () => {
  it('reads a Firefox-style line and column', () => {
    const message = 'JSON.parse: unexpected character at line 2 column 5 of the JSON data'

    expect(findErrorLocation(message, '')).toEqual({ line: 2, column: 5 })
  })

  it('converts a Chrome-style position', () => {
    const message = "Unexpected token 'x', ... is not valid JSON at position 4"

    expect(findErrorLocation(message, '{\n  x}')).toEqual({ line: 2, column: 3 })
  })

  it('returns undefined when the message has no location', () => {
    expect(findErrorLocation('Unexpected end of JSON input', '{')).toBeUndefined()
  })
})

describe('positionToLineColumn', () => {
  it('maps the first character to line 1, column 1', () => {
    expect(positionToLineColumn('{}', 0)).toEqual({ line: 1, column: 1 })
  })

  it('counts lines and columns after line breaks', () => {
    expect(positionToLineColumn('ab\ncd\nef', 7)).toEqual({ line: 3, column: 2 })
  })
})
