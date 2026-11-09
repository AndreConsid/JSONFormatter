import { describe, expect, it } from 'vitest'
import { findSyntaxError } from '../src/utils/findSyntaxError.ts'

describe('findSyntaxError', () => {
  it.each([
    ['empty object', '{}'],
    ['empty array', ' [ ] '],
    ['nested data', '{"a":[1,{"b":null}],"c":{"d":[true,false]}}'],
    ['numbers', '[0,-0,1,-12.5,3e10,4E-2,5.0e+3]'],
    ['escapes', '"quote \\" slash \\\\ \\/ \\b\\f\\n\\r\\t \\u00e5"'],
    ['unicode', '{"stad":"Göteborg 🌍"}'],
    ['whitespace everywhere', '\r\n\t{ "a" : [ 1 , 2 ] }\n'],
    ['top-level literal', 'null'],
  ])('accepts valid JSON: %s', (_description, input) => {
    expect(() => JSON.parse(input)).not.toThrow()
    expect(findSyntaxError(input)).toBeUndefined()
  })

  it.each([
    ['unquoted text value', '{\n  "a": 1,\n  "b": x\n}', 19, /Unexpected text/],
    ['misspelled literal', '{"a": tru}', 6, /Unexpected text/],
    ['missing comma', '{\n  "a": 1\n  "b": 2\n}', 13, /Is a comma missing\?/],
    ['missing comma in array', '[1 2]', 3, /"," or "\]"/],
    ['trailing comma in object', '{"a":1,}', 6, /Trailing commas/],
    ['trailing comma in array', '[1,2, ]', 4, /Trailing commas/],
    ['unquoted property name', '{a:1}', 1, /wrapped in double quotes/],
    ['single-quoted property name', "{'a':1}", 1, /not single quotes/],
    ['single-quoted value', "{\"a\":'x'}", 5, /not single quotes/],
    ['missing colon', '{"a" 1}', 5, /":" after the property name/],
    ['unclosed object', '{"a":1', 6, /ends too early/],
    ['unclosed array', '[1,2', 4, /ends too early/],
    ['missing value', '{"a":}', 5, /Unexpected character "}"/],
    ['unclosed string', '{"a":"text}', 5, /missing its closing double quote/],
    ['line break in string', '{"a":"one\ntwo"}', 9, /cannot span several lines/],
    ['tab in string', '"a\tb"', 2, /must be escaped/],
    ['invalid escape', '"bad \\x"', 5, /Invalid escape sequence/],
    ['short unicode escape', '"\\u12"', 1, /Invalid escape sequence/],
    ['leading zero', '[01]', 1, /leading zero/],
    ['missing decimals', '[1.]', 2, /digit is missing/],
    ['lone minus', '[-]', 1, /Invalid number/],
    ['extra closing brace', '{"a":1}}', 7, /after the end of the JSON data/],
    ['two values', '1 2', 2, /after the end of the JSON data/],
    ['comment', '{"a":1 // note\n}', 7, /Is a comma missing\?/],
    ['only whitespace', '   ', 3, /ends too early/],
  ])('finds the problem: %s', (_description, input, position, reason) => {
    expect(() => JSON.parse(input)).toThrow()

    const issue = findSyntaxError(input)

    expect(issue?.position).toBe(position)
    expect(issue?.reason).toMatch(reason)
  })

  it('returns undefined instead of crashing on extremely deep nesting', () => {
    const deep = '['.repeat(200_000)

    expect(findSyntaxError(deep)).toBeUndefined()
  })
})
