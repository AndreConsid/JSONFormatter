import type { ChangeEvent } from 'react'

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024

const BYTES_PER_MEGABYTE = 1024 * 1024

function formatMegabytes(bytes: number): string {
  return `${Number((bytes / BYTES_PER_MEGABYTE).toFixed(1))} MB`
}

interface FileLoaderProps {
  onLoad: (text: string) => void
  onError: (message: string) => void
}

/** Reads a local file in the browser. The file never leaves the user's machine. */
function FileLoader({ onLoad, onError }: FileLoaderProps) {
  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    // Reset so that choosing the same file again still triggers a change event.
    event.target.value = ''
    if (!file) return

    if (file.size > MAX_FILE_SIZE_BYTES) {
      onError(
        `"${file.name}" is too large (${formatMegabytes(file.size)}). ` +
          `The maximum size is ${formatMegabytes(MAX_FILE_SIZE_BYTES)}.`,
      )
      return
    }

    let text: string
    try {
      text = await file.text()
    } catch {
      onError(
        `"${file.name}" could not be read. Check that the file still exists and that you have ` +
          'permission to open it, or paste its contents instead.',
      )
      return
    }

    if (text.trim() === '') {
      onError(`"${file.name}" is empty.`)
      return
    }

    onLoad(text)
  }

  return (
    <label className="button file-loader">
      Load file
      <input
        type="file"
        className="visually-hidden"
        accept=".json,application/json,text/plain"
        onChange={handleChange}
      />
    </label>
  )
}

export default FileLoader
