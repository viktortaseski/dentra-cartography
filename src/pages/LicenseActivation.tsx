import { useState } from 'react'
import { useLicenseStore } from '@/store/licenseStore'

export function LicenseActivation(): JSX.Element {
  const { activate, isActivating, activationError } = useLicenseStore()
  const [key, setKey] = useState('')

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    await activate(key.trim())
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            Dental Cartography
          </h1>
          <h2 className="mt-1 text-lg font-semibold text-gray-700 dark:text-gray-200">
            License Activation
          </h2>
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            Enter your license key to activate the application.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="license-key"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              License Key
            </label>
            <textarea
              id="license-key"
              rows={4}
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="w-full font-mono text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 resize-none"
              placeholder="Paste your license key here..."
              spellCheck={false}
              autoComplete="off"
            />
          </div>

          {activationError !== null && (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {activationError}
            </p>
          )}

          <button
            type="submit"
            disabled={isActivating || key.trim().length === 0}
            className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 dark:disabled:bg-blue-800 text-white font-semibold py-2.5 px-4 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          >
            {isActivating ? 'Activating...' : 'Activate License'}
          </button>
        </form>
      </div>
    </div>
  )
}
