/** Where the JSON stops being valid, and a short explanation of why. */
export interface SyntaxIssue {
  position: number
  reason: string
}

/**
 * Walks through the input following the JSON grammar and reports the first problem.
 *
 * Browsers describe JSON.parse errors differently and often leave out the position,
 * so this gives the same precise result everywhere. It is only meant to explain input
 * that JSON.parse has already rejected; it returns undefined for valid JSON.
 */
export function findSyntaxError(input: string): SyntaxIssue | undefined {
  try {
    new JsonScanner(input).scanDocument()
    return undefined
  } catch (error) {
    // Anything else (e.g. a stack overflow on extremely deep nesting) means we cannot tell.
    return error instanceof JsonSyntaxError ? { position: error.position, reason: error.reason } : undefined
  }
}

class JsonSyntaxError extends Error {
  readonly position: number
  readonly reason: string

  constructor(position: number, reason: string) {
    super(reason)
    this.position = position
    this.reason = reason
  }
}

const WHITESPACE = new Set([' ', '\t', '\n', '\r'])
const SIMPLE_ESCAPES = new Set(['"', '\\', '/', 'b', 'f', 'n', 'r', 't'])
const LITERALS = ['true', 'false', 'null']
const NUMBER_PATTERN = /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/y
const DIGIT_PATTERN = /[0-9]/
const WORD_PATTERN = /[A-Za-z_]/

class JsonScanner {
  private readonly input: string
  private position = 0

  constructor(input: string) {
    this.input = input
  }

  scanDocument(): void {
    this.skipWhitespace()
    this.scanValue()
    this.skipWhitespace()
    if (this.peek() !== undefined) {
      this.fail('Unexpected content after the end of the JSON data.')
    }
  }

  private scanValue(): void {
    const char = this.peek()

    if (char === '{') return this.scanObject()
    if (char === '[') return this.scanArray()
    if (char === '"') return this.scanString()
    if (char === '-' || (char !== undefined && DIGIT_PATTERN.test(char))) return this.scanNumber()

    const literal = LITERALS.find((word) => this.input.startsWith(word, this.position))
    if (literal) {
      this.position += literal.length
      return
    }

    this.failUnexpectedValue(char)
  }

  private scanObject(): void {
    this.position++ // {
    this.skipWhitespace()
    if (this.peek() === '}') {
      this.position++
      return
    }

    for (;;) {
      this.skipWhitespace()
      this.scanPropertyName()
      this.skipWhitespace()
      if (this.peek() !== ':') this.failExpected('":" after the property name')
      this.position++
      this.skipWhitespace()
      this.scanValue()
      this.skipWhitespace()

      if (!this.scanSeparator('}')) return
    }
  }

  private scanArray(): void {
    this.position++ // [
    this.skipWhitespace()
    if (this.peek() === ']') {
      this.position++
      return
    }

    for (;;) {
      this.skipWhitespace()
      this.scanValue()
      this.skipWhitespace()

      if (!this.scanSeparator(']')) return
    }
  }

  /** Handles what follows an item: returns true after a comma, false after the closing bracket. */
  private scanSeparator(closingBracket: '}' | ']'): boolean {
    const char = this.peek()

    if (char === closingBracket) {
      this.position++
      return false
    }

    if (char !== ',') {
      const item = closingBracket === '}' ? 'property' : 'item'
      this.failExpected(`"," or "${closingBracket}" after the ${item}. Is a comma missing?`)
    }

    const commaPosition = this.position
    this.position++
    this.skipWhitespace()
    if (this.peek() === closingBracket) {
      this.fail(`Trailing commas are not allowed. Remove the comma before "${closingBracket}".`, commaPosition)
    }
    return true
  }

  private scanPropertyName(): void {
    const char = this.peek()
    if (char === '"') return this.scanString()
    if (char === undefined) this.failExpected('a property name')
    if (char === "'") this.fail('Property names must use double quotes, not single quotes.')
    this.fail('Property names must be wrapped in double quotes.')
  }

  private scanString(): void {
    const start = this.position
    this.position++ // opening quote

    for (;;) {
      const char = this.peek()

      if (char === undefined) {
        this.fail('This string is missing its closing double quote.', start)
      }
      if (char === '"') {
        this.position++
        return
      }
      if (char === '\\') {
        this.scanEscape()
      } else if (char < ' ') {
        this.fail(
          char === '\n'
            ? 'Strings cannot span several lines. Close the string or write a line break as \\n.'
            : 'Control characters such as tabs must be escaped inside strings (e.g. \\t).',
        )
      } else {
        this.position++
      }
    }
  }

  private scanEscape(): void {
    const escaped = this.input[this.position + 1]

    if (escaped !== undefined && SIMPLE_ESCAPES.has(escaped)) {
      this.position += 2
      return
    }
    if (escaped === 'u' && /^[0-9a-fA-F]{4}$/.test(this.input.slice(this.position + 2, this.position + 6))) {
      this.position += 6
      return
    }
    this.fail('Invalid escape sequence. Allowed escapes are \\" \\\\ \\/ \\b \\f \\n \\r \\t and \\uXXXX.')
  }

  private scanNumber(): void {
    NUMBER_PATTERN.lastIndex = this.position
    const match = NUMBER_PATTERN.exec(this.input)
    if (!match) this.fail('Invalid number.')

    const number = match[0]
    this.position += number.length

    const next = this.peek()
    if ((number === '0' || number === '-0') && next !== undefined && DIGIT_PATTERN.test(next)) {
      this.fail('Numbers cannot start with a leading zero.', this.position - 1)
    }
    if (next === '.' || next === 'e' || next === 'E') {
      this.fail('Invalid number. A digit is missing.')
    }
  }

  private failUnexpectedValue(char: string | undefined): never {
    if (char === undefined) this.failExpected('a value')
    if (char === "'") this.fail('Strings must use double quotes, not single quotes.')
    if (WORD_PATTERN.test(char)) {
      this.fail('Unexpected text. Strings must be wrapped in double quotes; only true, false and null are allowed without them.')
    }
    this.fail(`Unexpected character "${char}".`)
  }

  private failExpected(expected: string): never {
    const prefix = this.peek() === undefined ? 'The JSON ends too early. Expected' : 'Expected'
    this.fail(`${prefix} ${expected}${expected.endsWith('?') ? '' : '.'}`)
  }

  private fail(reason: string, position: number = this.position): never {
    throw new JsonSyntaxError(position, reason)
  }

  private peek(): string | undefined {
    return this.input[this.position]
  }

  private skipWhitespace(): void {
    while (WHITESPACE.has(this.input[this.position] ?? '')) {
      this.position++
    }
  }
}
