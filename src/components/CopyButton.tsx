import { useEffect, useState } from 'react'

type CopyStatus = 'idle' | 'copied' | 'failed'

const STATUS_MESSAGES: Record<CopyStatus, string> = {
  idle: '',
  copied: 'Copied!',
  failed: 'Could not copy. Select the text and copy it manually.',
}

const STATUS_RESET_DELAY_MS = 2500

interface CopyButtonProps {
  text: string
}

function CopyButton({ text }: CopyButtonProps) {
  const [status, setStatus] = useState<CopyStatus>('idle')

  useEffect(() => {
    if (status === 'idle') return
    const timer = setTimeout(() => setStatus('idle'), STATUS_RESET_DELAY_MS)
    return () => clearTimeout(timer)
  }, [status])

  async function handleCopy() {
    try {
      // The Clipboard API is missing in insecure contexts, which throws here and is handled below.
      await navigator.clipboard.writeText(text)
      setStatus('copied')
    } catch {
      setStatus('failed')
    }
  }

  return (
    <div className="copy">
      <span role="status" className={`copy-status copy-status-${status}`}>
        {STATUS_MESSAGES[status]}
      </span>
      <button type="button" className="button" onClick={handleCopy} disabled={text === ''}>
        Copy
      </button>
    </div>
  )
}

export default CopyButton
