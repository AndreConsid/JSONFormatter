import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import JsonFormatter from '../src/components/JsonFormatter.tsx'

function getInput(): HTMLTextAreaElement {
  return screen.getByLabelText('Input') as HTMLTextAreaElement
}

function getOutput(): HTMLTextAreaElement {
  return screen.getByLabelText('Output') as HTMLTextAreaElement
}

function formatInput(value: string) {
  fireEvent.change(getInput(), { target: { value } })
  fireEvent.click(screen.getByRole('button', { name: 'Format' }))
}

describe('JsonFormatter', () => {
  afterEach(cleanup)

  it('shows formatted output for valid JSON', () => {
    render(<JsonFormatter />)

    formatInput('{"a":1,"b":[true]}')

    expect(getOutput().value).toBe('{\n  "a": 1,\n  "b": [\n    true\n  ]\n}')
    expect(screen.queryByRole('alert')).toBeNull()
    expect(getInput().getAttribute('aria-invalid')).toBe('false')
  })

  it('shows an error and clears the output for invalid JSON', () => {
    render(<JsonFormatter />)

    formatInput('{"a":1}')
    formatInput('{"a":1,}')

    expect(screen.getByRole('alert').textContent).toMatch(/^Invalid JSON/)
    expect(getOutput().value).toBe('')
    expect(getInput().getAttribute('aria-invalid')).toBe('true')
  })

  it('asks for input when formatting an empty editor', () => {
    render(<JsonFormatter />)

    formatInput('')

    expect(screen.getByRole('alert').textContent).toBe('Please enter some JSON to format.')
  })

  it('removes the error after a successful format', () => {
    render(<JsonFormatter />)

    formatInput('nope')
    formatInput('[]')

    expect(screen.queryByRole('alert')).toBeNull()
    expect(getOutput().value).toBe('[]')
  })
})
