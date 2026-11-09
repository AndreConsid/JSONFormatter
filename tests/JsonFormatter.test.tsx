import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import JsonFormatter from '../src/components/JsonFormatter.tsx'
import { MAX_FILE_SIZE_BYTES } from '../src/components/FileLoader.tsx'
import { EMPTY_INPUT_MESSAGE } from '../src/utils/formatJson.ts'

function getInput(): HTMLTextAreaElement {
  return screen.getByLabelText('Input') as HTMLTextAreaElement
}

function getOutput(): HTMLTextAreaElement {
  return screen.getByLabelText('Output') as HTMLTextAreaElement
}

function getFileInput(): HTMLInputElement {
  return screen.getByLabelText('Load file') as HTMLInputElement
}

function typeInput(value: string) {
  fireEvent.change(getInput(), { target: { value } })
}

function clickButton(name: string) {
  fireEvent.click(screen.getByRole('button', { name }))
}

function formatInput(value: string) {
  typeInput(value)
  clickButton('Format')
}

function selectIndentation(optionValue: string) {
  fireEvent.change(screen.getByLabelText('Indentation'), { target: { value: optionValue } })
}

function chooseFile(file: File) {
  fireEvent.change(getFileInput(), { target: { files: [file] } })
}

function mockClipboard(writeText: (text: string) => Promise<void>) {
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
}

describe('JsonFormatter', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  describe('formatting', () => {
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

    it('shows the faulty line with a pointer under the error', () => {
      render(<JsonFormatter />)

      formatInput('{\n  "a": 1,\n  "b": x\n}')

      expect(screen.getByRole('alert').querySelector('pre')?.textContent).toBe(
        '  "b": x\n       ^',
      )
    })

    it('names the line in the message and gives screen readers the exact character', () => {
      render(<JsonFormatter />)

      formatInput('{\n  "a": 1,\n  "b": x\n}')

      expect(screen.getByRole('alert').querySelector('p')?.textContent).toMatch(
        /^Invalid JSON on line 3\. .* Character 8\.$/,
      )
    })

    it('covers the output box with the error instead of pushing it down', () => {
      render(<JsonFormatter />)

      formatInput('nope')

      expect(getOutput().classList.contains('editor-covered')).toBe(true)
      expect(getOutput().parentElement?.contains(screen.getByRole('alert'))).toBe(true)

      formatInput('[]')

      expect(getOutput().classList.contains('editor-covered')).toBe(false)
    })

    it('asks for input when formatting an empty editor', () => {
      render(<JsonFormatter />)

      formatInput('')

      expect(screen.getByRole('alert').textContent).toBe(EMPTY_INPUT_MESSAGE)
    })

    it('removes the error after a successful format', () => {
      render(<JsonFormatter />)

      formatInput('nope')
      formatInput('[]')

      expect(screen.queryByRole('alert')).toBeNull()
      expect(getOutput().value).toBe('[]')
    })
  })

  describe('indentation', () => {
    it('uses 2 spaces by default', () => {
      render(<JsonFormatter />)

      expect((screen.getByLabelText('Indentation') as HTMLSelectElement).value).toBe('2')
    })

    it('formats with 4 spaces when selected', () => {
      render(<JsonFormatter />)

      selectIndentation('4')
      formatInput('{"a":1}')

      expect(getOutput().value).toBe('{\n    "a": 1\n}')
    })

    it('formats with tabs when selected', () => {
      render(<JsonFormatter />)

      selectIndentation('tab')
      formatInput('{"a":1}')

      expect(getOutput().value).toBe('{\n\t"a": 1\n}')
    })
  })

  describe('minifying', () => {
    it('shows minified output for valid JSON', () => {
      render(<JsonFormatter />)

      typeInput('{\n  "a": 1,\n  "b": [ true ]\n}')
      clickButton('Minify')

      expect(getOutput().value).toBe('{"a":1,"b":[true]}')
    })

    it('shows an error for invalid JSON', () => {
      render(<JsonFormatter />)

      typeInput('{"a":')
      clickButton('Minify')

      expect(screen.getByRole('alert').textContent).toMatch(/^Invalid JSON/)
      expect(getOutput().value).toBe('')
    })
  })

  describe('copying', () => {
    it('is disabled while there is no output', () => {
      render(<JsonFormatter />)

      expect((screen.getByRole('button', { name: 'Copy' }) as HTMLButtonElement).disabled).toBe(true)
    })

    it('copies the output and confirms it', async () => {
      const writeText = vi.fn(() => Promise.resolve())
      mockClipboard(writeText)
      render(<JsonFormatter />)

      formatInput('{"a":1}')
      clickButton('Copy')

      expect(writeText).toHaveBeenCalledWith('{\n  "a": 1\n}')
      await waitFor(() => expect(screen.getByRole('status').textContent).toBe('Copied!'))
    })

    it('tells the user when copying fails', async () => {
      mockClipboard(() => Promise.reject(new Error('Permission denied')))
      render(<JsonFormatter />)

      formatInput('[]')
      clickButton('Copy')

      await waitFor(() => expect(screen.getByRole('status').textContent).toMatch(/^Could not copy/))
    })
  })

  describe('loading a file', () => {
    it('puts the file contents in the input and clears earlier results', async () => {
      render(<JsonFormatter />)

      formatInput('[1]')
      chooseFile(new File(['{"fromFile":true}'], 'data.json', { type: 'application/json' }))

      await waitFor(() => expect(getInput().value).toBe('{"fromFile":true}'))
      expect(getOutput().value).toBe('')
    })

    it('rejects files that are too large', async () => {
      render(<JsonFormatter />)
      const largeFile = new File(['{}'], 'large.json', { type: 'application/json' })
      Object.defineProperty(largeFile, 'size', { value: MAX_FILE_SIZE_BYTES * 1.5 })

      chooseFile(largeFile)

      await waitFor(() => expect(screen.getByRole('alert').textContent).toBe(
        '"large.json" is too large (7.5 MB). The maximum size is 5 MB.',
      ))
      expect(getInput().value).toBe('')
    })

    it('tells the user when the file is empty', async () => {
      render(<JsonFormatter />)

      chooseFile(new File(['  \n'], 'empty.json', { type: 'application/json' }))

      await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('"empty.json" is empty.'))
      expect(getInput().value).toBe('')
    })

    it('shows an error when the file cannot be read', async () => {
      render(<JsonFormatter />)
      const brokenFile = new File(['{}'], 'broken.json')
      vi.spyOn(brokenFile, 'text').mockRejectedValue(new Error('Read failed'))

      chooseFile(brokenFile)

      await waitFor(() =>
        expect(screen.getByRole('alert').textContent).toMatch(/^"broken\.json" could not be read\./),
      )
    })
  })
})
