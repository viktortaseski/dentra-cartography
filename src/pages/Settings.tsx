import { useState, useEffect, useRef, type FormEvent, type ChangeEvent } from 'react'
import type { ClinicSettings, CsvImportResult } from '@shared/types'
import { getClinicSettings, updateClinicSettings, exportPatientsCsv, importPatientsCsv } from '@/lib/ipc'
import { useUIStore } from '@/store/uiStore'
import { useTranslation } from '@/lib/i18n'
import { usePatientStore } from '@/store/patientStore'

type Tab = 'clinic' | 'appearance' | 'data'

const EMPTY_SETTINGS: ClinicSettings = {
  clinicName: '',
  clinicAddress: '',
  clinicPhone: '',
  clinicEmail: '',
  clinicWebsite: '',
  dentistName: '',
}

export function Settings(): JSX.Element {
  const t = useTranslation()
  const { theme, language, setTheme, setLanguage, fontSize, setFontSize } = useUIStore()
  const loadPatients = usePatientStore((s) => s.loadPatients)

  const [activeTab, setActiveTab] = useState<Tab>('clinic')
  const [fields, setFields] = useState<ClinicSettings>(EMPTY_SETTINGS)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [importResult, setImportResult] = useState<CsvImportResult | null>(null)

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
      setSuccessMessage(t.settingsSaved)
      setTimeout(() => setSuccessMessage(null), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleExport(): Promise<void> {
    setIsExporting(true)
    setExportError(null)
    try {
      const csv = await exportPatientsCsv()
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const dateStr = new Date().toISOString().split('T')[0]
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `patients-export-${dateStr}.csv`
      anchor.click()
      setTimeout(() => URL.revokeObjectURL(url), 10_000)
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setIsExporting(false)
    }
  }

  async function handleImportFileChange(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0]
    if (!file) return
    setIsImporting(true)
    setImportError(null)
    setImportResult(null)
    try {
      const text = await file.text()
      const result = await importPatientsCsv(text)
      setImportResult(result)
      if (result.errors.length > 0) console.error('CSV import errors:', result.errors)
      if (result.patientsCreated > 0) await loadPatients()
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setIsImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const inputClass =
    'w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'

  const tabClass = (tab: Tab): string =>
    [
      'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
      activeTab === tab
        ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200',
    ].join(' ')

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
      <div className="max-w-2xl w-full mx-auto px-6 py-8">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">{t.settingsTitle}</h1>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('clinic')}
            className={tabClass('clinic')}
          >
            {t.clinicDetails}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('appearance')}
            className={tabClass('appearance')}
          >
            {t.appearance}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('data')}
            className={tabClass('data')}
          >
            Data
          </button>
        </div>

        {/* Clinic Details tab */}
        {activeTab === 'clinic' && (
          <>
            {isLoading ? (
              <p className="text-sm text-gray-400 dark:text-gray-500">{t.loading}</p>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                {error && (
                  <p
                    className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2"
                    role="alert"
                  >
                    {error}
                  </p>
                )}
                {successMessage && (
                  <p
                    className="text-sm text-green-700 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2"
                    role="status"
                  >
                    {successMessage}
                  </p>
                )}

                {/* Clinic Name */}
                <div>
                  <label
                    htmlFor="cs-clinicName"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    {t.clinicName} <span className="text-red-500">*</span>
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
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    {t.dentistName}
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
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    {t.address}
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
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      {t.phone}
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
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      {t.email}
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
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    {t.website}
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
                    {isSaving ? t.saving : t.saveSettings}
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        {/* Data tab */}
        {activeTab === 'data' && (
          <div className="space-y-6 max-w-lg">
            {/* Export card */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Export Patients</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Download all patients and their treatment history as a CSV file.
              </p>
              <button
                type="button"
                onClick={handleExport}
                disabled={isExporting}
                className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                {isExporting ? 'Exporting\u2026' : 'Export CSV'}
              </button>
              {exportError && <p className="text-xs text-red-600 mt-2">{exportError}</p>}
            </div>

            {/* Import card */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Import Patients</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Import patients and treatments from a CSV file. Existing patients (matched by name + date of birth) will be skipped.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleImportFileChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                {isImporting ? 'Importing\u2026' : 'Import CSV'}
              </button>
              {importResult && (
                <div className="mt-3 text-xs space-y-1">
                  <p className="text-green-600 dark:text-green-400">
                    {importResult.patientsCreated} patients created · {importResult.treatmentsAdded} treatments added
                  </p>
                  {importResult.patientsSkipped > 0 && (
                    <p className="text-gray-500">{importResult.patientsSkipped} patients already existed (skipped)</p>
                  )}
                  {importResult.errors.length > 0 && (
                    <p className="text-red-600">{importResult.errors.length} errors — check console</p>
                  )}
                </div>
              )}
              {importError && <p className="text-xs text-red-600 mt-2">{importError}</p>}
            </div>

            {/* CSV format reference */}
            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">CSV Column Order</h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 font-mono leading-relaxed break-all">
                full_name, date_of_birth, sex, phone, email, address, insurance_provider, insurance_policy, medical_alerts, notes, tooth_fdi, surface, condition_type, treatment_status, date_performed, performed_by, treatment_notes, price
              </p>
            </div>
          </div>
        )}

        {/* Appearance tab */}
        {activeTab === 'appearance' && (
          <div className="space-y-8">
            {/* Dark Mode */}
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
                {t.darkMode}
              </h2>
              <div className="flex items-center gap-4">
                {/* Light option */}
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={[
                    'flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                    theme === 'light'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700',
                  ].join(' ')}
                  aria-pressed={theme === 'light'}
                >
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Light
                </button>

                {/* Toggle switch */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={theme === 'dark'}
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className={[
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
                    theme === 'dark' ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600',
                  ].join(' ')}
                  aria-label="Toggle dark mode"
                >
                  <span
                    className={[
                      'inline-block h-4 w-4 rounded-full bg-white transition-transform',
                      theme === 'dark' ? 'translate-x-6' : 'translate-x-1',
                    ].join(' ')}
                  />
                </button>

                {/* Dark option */}
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={[
                    'flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                    theme === 'dark'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700',
                  ].join(' ')}
                  aria-pressed={theme === 'dark'}
                >
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                  Dark
                </button>
              </div>
            </div>

            {/* Language */}
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
                {t.language}
              </h2>
              <div className="space-y-2">
                {(
                  [
                    { code: 'en', label: t.languageEn },
                    { code: 'mk', label: t.languageMk },
                    { code: 'sq', label: t.languageSq },
                  ] as const
                ).map(({ code, label }) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setLanguage(code)}
                    className={[
                      'w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 text-left',
                      language === code
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700',
                    ].join(' ')}
                    aria-pressed={language === code}
                  >
                    {/* Radio indicator */}
                    <span
                      className={[
                        'w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                        language === code
                          ? 'border-blue-600'
                          : 'border-gray-300 dark:border-gray-600',
                      ].join(' ')}
                    >
                      {language === code && (
                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                      )}
                    </span>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size */}
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                {t.fontSize}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                {t.fontSizeDesc}
              </p>
              <div className="flex gap-3">
                {([
                  { value: 'normal', label: t.fontSizeNormal, desc: t.fontSizeNormalDesc },
                  { value: 'large',  label: t.fontSizeLarge,  desc: t.fontSizeLargeDesc },
                ] as const).map(({ value, label, desc }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFontSize(value)}
                    className={[
                      'flex-1 flex flex-col items-center gap-1 px-4 py-3 rounded-lg border text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                      fontSize === value
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700',
                    ].join(' ')}
                    aria-pressed={fontSize === value}
                  >
                    <span className={value === 'large' ? 'text-base font-semibold' : 'text-sm'}>{label}</span>
                    <span className="text-xs font-normal text-gray-400 dark:text-gray-500">{desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
