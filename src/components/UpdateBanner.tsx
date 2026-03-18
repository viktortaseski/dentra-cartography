import { useEffect, useState } from 'react'
import { onUpdateStatus, quitAndInstall } from '@/lib/ipc'
import type { UpdateStatus } from '@shared/types'

export function UpdateBanner(): JSX.Element | null {
  const [status, setStatus] = useState<UpdateStatus | null>(null)
  const [errorDismissed, setErrorDismissed] = useState(false)

  useEffect(() => {
    const unsubscribe = onUpdateStatus((next) => {
      setStatus(next)
      // Reset dismiss state when a new error arrives
      if (next.kind === 'error') {
        setErrorDismissed(false)
      }
    })
    return unsubscribe
  }, [])

  if (status === null) return null

  if (status.kind === 'downloading') {
    const pct = Math.round(status.percent)
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label={`Downloading update ${pct}%`}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-blue-600 text-white rounded-lg shadow-lg px-4 py-2.5 min-w-64 max-w-sm"
      >
        <p className="text-sm font-medium mb-1.5">Downloading update {pct}%...</p>
        <div className="w-full h-1 bg-blue-400/50 rounded-full overflow-hidden">
          <div
            className="h-1 bg-white rounded-full transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    )
  }

  if (status.kind === 'downloaded') {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label={`Update version ${status.version} ready to install`}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-blue-600 text-white rounded-lg shadow-lg px-4 py-2.5 flex items-center gap-3"
      >
        <span className="text-sm font-medium">
          Update v{status.version} ready &mdash; Restart to install
        </span>
        <button
          type="button"
          onClick={() => void quitAndInstall()}
          className="text-sm font-semibold bg-blue-500 hover:bg-blue-400 px-3 py-1 rounded-md transition-colors whitespace-nowrap"
        >
          Restart now
        </button>
      </div>
    )
  }

  if (status.kind === 'error' && !errorDismissed) {
    return (
      <div
        role="alert"
        aria-live="assertive"
        aria-label="Update check failed"
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-300 rounded-lg shadow-md px-4 py-2 flex items-center gap-3 text-sm"
      >
        <span className="font-medium">Update check failed</span>
        <button
          type="button"
          aria-label="Dismiss update error"
          onClick={() => setErrorDismissed(true)}
          className="ml-auto text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 transition-colors leading-none"
        >
          &times;
        </button>
      </div>
    )
  }

  return null
}
