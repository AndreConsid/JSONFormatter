import { describe, expect, it } from 'vitest'
import {
  EMPTY_INPUT_MESSAGE,
  TOO_DEEP_MESSAGE,
  findErrorLocation,
  findUnexpectedCharacter,
  formatJson,
  getErrorSnippet,
  minifyJson,
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

  it('supports tab indentation', () => {
    expect(formatJson('{"a":[1]}', '\t')).toEqual({ ok: true, formatted: '{\n\t"a": [\n\t\t1\n\t]\n}' })
  })

  it('rejects empty and whitespace-only input with a friendly message', () => {
    const expected = { ok: false, error: { message: EMPTY_INPUT_MESSAGE } }

    expect(formatJson('')).toEqual(expected)
    expect(formatJson('   \n\t ')).toEqual(expected)
  })

  it('ignores a byte order mark at the start of the input', () => {
    expect(formatJson('\uFEFF{"a":1}')).toEqual({ ok: true, formatted: '{\n  "a": 1\n}' })
  })

  it('treats input that is only a byte order mark as empty', () => {
    expect(formatJson('\uFEFF')).toEqual({ ok: false, error: { message: EMPTY_INPUT_MESSAGE } })
  })

  it('does not call valid JSON invalid when it is nested too deeply to format', () => {
    const depth = 100_000
    const deeplyNested = '['.repeat(depth) + ']'.repeat(depth)

    expect(formatJson(deeplyNested)).toEqual({ ok: false, error: { message: TOO_DEEP_MESSAGE } })
    expect(minifyJson(deeplyNested)).toEqual({ ok: false, error: { message: TOO_DEEP_MESSAGE } })
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

  it('reports where a syntax error occurred and why', () => {
    const result = formatJson('{\n  "a": 1,\n  "b": 2,\n}')

    expect(result).toEqual({
      ok: false,
      error: {
        message:
          'Invalid JSON on line 3. Trailing commas are not allowed. Remove the comma before "}".',
        location: { line: 3, column: 9 },
        snippet: { text: '  "b": 2,', pointerIndex: 8 },
      },
    })
  })

  it('shows the faulty line with the error position marked', () => {
    const result = formatJson('{\n  "name": "Ada",\n  "age": 36 37\n}')

    expect(result).toMatchObject({
      ok: false,
      error: {
        message: expect.stringMatching(/^Invalid JSON on line 3\. .*Is a comma missing\?$/),
        snippet: { text: '  "age": 36 37', pointerIndex: 12 },
      },
    })
  })

  it('locates errors that the browser does not locate', () => {
    // Chrome and Node report "Unexpected token 'x'" here without any position.
    const result = formatJson('{"a": x}')

    expect(result).toMatchObject({
      ok: false,
      error: {
        message: expect.stringMatching(/^Invalid JSON on line 1\. Unexpected text/),
        location: { line: 1, column: 7 },
      },
    })
  })
})

describe('minifyJson', () => {
  it('removes all whitespace from formatted JSON', () => {
    const result = minifyJson('{\n  "name": "Ada",\n  "tags": [ 1, 2 ],\n  "nested": { "a": null }\n}')

    expect(result).toEqual({ ok: true, formatted: '{"name":"Ada","tags":[1,2],"nested":{"a":null}}' })
  })

  it('keeps whitespace inside strings', () => {
    expect(minifyJson('{ "text": "hello  world\\n" }')).toEqual({
      ok: true,
      formatted: '{"text":"hello  world\\n"}',
    })
  })

  it('accepts top-level primitives', () => {
    expect(minifyJson(' true ')).toEqual({ ok: true, formatted: 'true' })
  })

  it('rejects empty input with a friendly message', () => {
    expect(minifyJson('  ')).toEqual({ ok: false, error: { message: EMPTY_INPUT_MESSAGE } })
  })

  it('reports invalid JSON the same way as formatJson', () => {
    const input = '{\n  "a": 1,\n}'

    expect(minifyJson(input)).toEqual(formatJson(input))
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

describe('getErrorSnippet', () => {
  it('returns the whole line when it is short', () => {
    expect(getErrorSnippet('{\n  "a": x\n}', { line: 2, column: 8 })).toEqual({
      text: '  "a": x',
      pointerIndex: 7,
    })
  })

  it('shortens long lines around the error', () => {
    const line = `${'a'.repeat(100)}X${'b'.repeat(100)}`
    const snippet = getErrorSnippet(line, { line: 1, column: 101 })

    expect(snippet?.text).toBe(`…${'a'.repeat(30)}X${'b'.repeat(29)}…`)
    expect(snippet?.text[snippet.pointerIndex]).toBe('X')
  })

  it('replaces tabs so the pointer lines up', () => {
    expect(getErrorSnippet('\t\tx', { line: 1, column: 3 })).toEqual({ text: '  x', pointerIndex: 2 })
  })

  it('ignores Windows line endings', () => {
    expect(getErrorSnippet('{\r\n  x\r\n}', { line: 2, column: 3 })).toEqual({
      text: '  x',
      pointerIndex: 2,
    })
  })

  it('points just past the end when the error is at the end of a line', () => {
    expect(getErrorSnippet('[1,', { line: 1, column: 4 })).toEqual({ text: '[1,', pointerIndex: 3 })
  })

  it('returns undefined when the line does not exist', () => {
    expect(getErrorSnippet('{}', { line: 3, column: 1 })).toBeUndefined()
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
