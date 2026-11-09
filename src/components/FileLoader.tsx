import type { ChangeEvent } from 'react'

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024

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
      onError('The file is too large. The maximum size is 5 MB.')
      return
    }

    try {
      onLoad(await file.text())
    } catch {
      onError('The file could not be read.')
    }
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
