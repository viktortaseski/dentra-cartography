import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react'
import type { ClinicSettings } from '@shared/types'
import { getClinicSettings, updateClinicSettings } from '@/lib/ipc'

type Tab = 'clinic' | 'appearance'

const EMPTY_SETTINGS: ClinicSettings = {
  clinicName: '',
  clinicAddress: '',
  clinicPhone: '',
  clinicEmail: '',
  clinicWebsite: '',
  dentistName: '',
}

export function Settings(): JSX.Element {
  const [activeTab, setActiveTab] = useState<Tab>('clinic')
  const [fields, setFields] = useState<ClinicSettings>(EMPTY_SETTINGS)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    async function load(): Promise<void> {
      setIsLoading(true)
      setError(null)
      try {
        const settings = await getClinicSettings()
        setFields(settings)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load settings')
      } finally {
        setIsLoading(false)
      }
    }
    void load()
  }, [])

  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void {
    const { name, value } = e.target
    setFields((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()
    if (!fields.clinicName.trim()) {
      setError('Clinic name is required.')
      return
    }
    setIsSaving(true)
    setError(null)
    setSuccessMessage(null)
    try {
      const updated = await updateClinicSettings(fields)
      setFields(updated)
      setSuccessMessage('Settings saved')
      setTimeout(() => setSuccessMessage(null), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
      <div className="max-w-2xl w-full mx-auto px-6 py-8">
        <h1 className="text-xl font-semibold text-gray-900 mb-6">Settings</h1>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('clinic')}
            className={[
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
              activeTab === 'clinic'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700',
            ].join(' ')}
          >
            Clinic Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('appearance')}
            className={[
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
              activeTab === 'appearance'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700',
            ].join(' ')}
          >
            Appearance
          </button>
        </div>

        {/* Clinic Details tab */}
        {activeTab === 'clinic' && (
          <>
            {isLoading ? (
              <p className="text-sm text-gray-400">Loading…</p>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                {error && (
                  <p
                    className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2"
                    role="alert"
                  >
                    {error}
                  </p>
                )}
                {successMessage && (
                  <p
                    className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2"
                    role="status"
                  >
                    {successMessage}
                  </p>
                )}

                {/* Clinic Name */}
                <div>
                  <label
                    htmlFor="cs-clinicName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Clinic Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="cs-clinicName"
                    name="clinicName"
                    type="text"
                    value={fields.clinicName}
                    onChange={handleChange}
                    required
                    className={inputClass}
                    placeholder="Smile Dental Clinic"
                  />
                </div>

                {/* Dentist Name */}
                <div>
                  <label
                    htmlFor="cs-dentistName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Dentist Name
                  </label>
                  <input
                    id="cs-dentistName"
                    name="dentistName"
                    type="text"
                    value={fields.dentistName}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Dr. Jane Smith"
                  />
                </div>

                {/* Address */}
                <div>
                  <label
                    htmlFor="cs-clinicAddress"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Address
                  </label>
                  <textarea
                    id="cs-clinicAddress"
                    name="clinicAddress"
                    value={fields.clinicAddress}
                    onChange={handleChange}
                    rows={2}
                    className={`${inputClass} resize-none`}
                    placeholder="123 Main Street, Suite 1, City, State 00000"
                  />
                </div>

                {/* Phone + Email row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="cs-clinicPhone"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Phone
                    </label>
                    <input
                      id="cs-clinicPhone"
                      name="clinicPhone"
                      type="tel"
                      value={fields.clinicPhone}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="+1 555 000 0000"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="cs-clinicEmail"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Email
                    </label>
                    <input
                      id="cs-clinicEmail"
                      name="clinicEmail"
                      type="email"
                      value={fields.clinicEmail}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="info@clinic.com"
                    />
                  </div>
                </div>

                {/* Website */}
                <div>
                  <label
                    htmlFor="cs-clinicWebsite"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Website
                  </label>
                  <input
                    id="cs-clinicWebsite"
                    name="clinicWebsite"
                    type="text"
                    value={fields.clinicWebsite}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="https://www.clinic.com"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    {isSaving ? 'Saving…' : 'Save Settings'}
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        {/* Appearance tab */}
        {activeTab === 'appearance' && (
          <div className="text-sm text-gray-400">Coming soon</div>
        )}
      </div>
    </div>
  )
}
