import { useState, useEffect, type ChangeEvent } from 'react'
import type { ClinicSettings } from '@shared/types'
import { getClinicSettings, updateClinicSettings } from '@/lib/ipc'
import { useUIStore } from '@/store/uiStore'
import { useLicenseStore } from '@/store/licenseStore'

const TOTAL_STEPS = 4

const EMPTY_SETTINGS: ClinicSettings = {
  clinicName: '',
  clinicAddress: '',
  clinicPhone: '',
  clinicEmail: '',
  clinicWebsite: '',
  dentistName: '',
}

// ── Step progress indicator ───────────────────────────────────────────────────

interface StepDotsProps {
  current: number
  total: number
}

function StepDots({ current, total }: StepDotsProps): JSX.Element {
  return (
    <div className="flex items-center justify-center gap-2 mb-8" aria-label={`Step ${current + 1} of ${total}`}>
      {Array.from({ length: total }).map((_, i) => {
        const isPast = i < current
        const isCurrent = i === current
        return (
          <span
            key={i}
            className={[
              'w-2.5 h-2.5 rounded-full transition-all',
              isCurrent
                ? 'bg-blue-600'
                : isPast
                  ? 'bg-white border-2 border-blue-600 dark:bg-gray-800'
                  : 'bg-gray-300 dark:bg-gray-600',
            ].join(' ')}
          />
        )
      })}
    </div>
  )
}

// ── Shared button styles ──────────────────────────────────────────────────────

const btnPrimary =
  'px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 dark:disabled:bg-blue-800 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500'

const btnSecondary =
  'px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500'

const inputClass =
  'w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'

// ── Step 1 — Welcome ──────────────────────────────────────────────────────────

interface Step1Props {
  licensee: string | undefined
  onNext: () => void
}

function StepWelcome({ licensee, onNext }: Step1Props): JSX.Element {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center mb-6">
        <svg
          className="w-8 h-8 text-blue-600 dark:text-blue-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
          />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        Welcome to Dental Cartography
      </h1>

      {licensee !== undefined && licensee.length > 0 && (
        <p className="text-base font-medium text-blue-600 dark:text-blue-400 mb-3">
          Hello, {licensee}!
        </p>
      )}

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 max-w-sm">
        Let's take a few moments to set up your clinic. You can change these settings later.
      </p>

      <button type="button" onClick={onNext} className={btnPrimary}>
        Get Started &rarr;
      </button>
    </div>
  )
}

// ── Step 2 — Clinic Details ───────────────────────────────────────────────────

interface Step2Props {
  fields: ClinicSettings
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  error: string | null
  isLoading: boolean
  onBack: () => void
  onNext: () => void
}

function StepClinicDetails({ fields, onChange, error, isLoading, onBack, onNext }: Step2Props): JSX.Element {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Your Clinic</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        These details will appear on reports and exports.
      </p>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {error !== null && (
            <p
              className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2"
              role="alert"
            >
              {error}
            </p>
          )}

          {/* Clinic Name (required) */}
          <div>
            <label
              htmlFor="ow-clinicName"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Clinic Name <span className="text-red-500">*</span>
            </label>
            <input
              id="ow-clinicName"
              name="clinicName"
              type="text"
              value={fields.clinicName}
              onChange={onChange}
              required
              className={inputClass}
              placeholder="Smile Dental Clinic"
              autoFocus
            />
          </div>

          {/* Dentist Name */}
          <div>
            <label
              htmlFor="ow-dentistName"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Dentist Name
            </label>
            <input
              id="ow-dentistName"
              name="dentistName"
              type="text"
              value={fields.dentistName}
              onChange={onChange}
              className={inputClass}
              placeholder="Dr. Jane Smith"
            />
          </div>

          {/* Address */}
          <div>
            <label
              htmlFor="ow-clinicAddress"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Address
            </label>
            <input
              id="ow-clinicAddress"
              name="clinicAddress"
              type="text"
              value={fields.clinicAddress}
              onChange={onChange}
              className={inputClass}
              placeholder="123 Main Street, City, State 00000"
            />
          </div>

          {/* Phone */}
          <div>
            <label
              htmlFor="ow-clinicPhone"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Phone
            </label>
            <input
              id="ow-clinicPhone"
              name="clinicPhone"
              type="text"
              value={fields.clinicPhone}
              onChange={onChange}
              className={inputClass}
              placeholder="+1 555 000 0000"
            />
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="ow-clinicEmail"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Email
            </label>
            <input
              id="ow-clinicEmail"
              name="clinicEmail"
              type="email"
              value={fields.clinicEmail}
              onChange={onChange}
              className={inputClass}
              placeholder="info@clinic.com"
            />
          </div>

          {/* Website */}
          <div>
            <label
              htmlFor="ow-clinicWebsite"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Website
            </label>
            <input
              id="ow-clinicWebsite"
              name="clinicWebsite"
              type="url"
              value={fields.clinicWebsite}
              onChange={onChange}
              className={inputClass}
              placeholder="https://www.clinic.com"
            />
          </div>
        </div>
      )}

      <div className="flex justify-between mt-8">
        <button type="button" onClick={onBack} className={btnSecondary}>
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={fields.clinicName.trim().length === 0}
          className={btnPrimary}
        >
          Next &rarr;
        </button>
      </div>
    </div>
  )
}

// ── Step 3 — Preferences ──────────────────────────────────────────────────────

interface Step3Props {
  onBack: () => void
  onNext: () => void
}

function StepPreferences({ onBack, onNext }: Step3Props): JSX.Element {
  const { theme, language, setTheme, setLanguage } = useUIStore()

  const LANGUAGES = [
    { code: 'en' as const, label: 'English' },
    { code: 'mk' as const, label: 'Македонски' },
    { code: 'sq' as const, label: 'Shqip' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
        Appearance &amp; Language
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Choose how Dental Cartography looks and feels.
      </p>

      {/* Theme cards */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Theme</h2>
        <div className="grid grid-cols-2 gap-3">
          {/* Light card */}
          <button
            type="button"
            onClick={() => setTheme('light')}
            aria-pressed={theme === 'light'}
            className={[
              'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
              theme === 'light'
                ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
            ].join(' ')}
          >
            {/* Miniature light mode preview */}
            <div className="w-full h-12 rounded-lg bg-white border border-gray-200 flex items-start p-1.5 gap-1">
              <div className="w-6 h-full rounded bg-gray-100 flex-shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="h-1.5 rounded bg-gray-200 w-3/4" />
                <div className="h-1.5 rounded bg-gray-200 w-1/2" />
              </div>
            </div>
            <span
              className={[
                'text-sm font-medium',
                theme === 'light'
                  ? 'text-blue-700 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400',
              ].join(' ')}
            >
              Light
            </span>
          </button>

          {/* Dark card */}
          <button
            type="button"
            onClick={() => setTheme('dark')}
            aria-pressed={theme === 'dark'}
            className={[
              'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
              theme === 'dark'
                ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
            ].join(' ')}
          >
            {/* Miniature dark mode preview */}
            <div className="w-full h-12 rounded-lg bg-gray-900 border border-gray-700 flex items-start p-1.5 gap-1">
              <div className="w-6 h-full rounded bg-gray-700 flex-shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="h-1.5 rounded bg-gray-600 w-3/4" />
                <div className="h-1.5 rounded bg-gray-600 w-1/2" />
              </div>
            </div>
            <span
              className={[
                'text-sm font-medium',
                theme === 'dark'
                  ? 'text-blue-700 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400',
              ].join(' ')}
            >
              Dark
            </span>
          </button>
        </div>
      </div>

      {/* Language pills */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Language</h2>
        <div className="flex gap-2 flex-wrap">
          {LANGUAGES.map(({ code, label }) => (
            <button
              key={code}
              type="button"
              onClick={() => setLanguage(code)}
              aria-pressed={language === code}
              className={[
                'px-4 py-2 rounded-full text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                language === code
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <button type="button" onClick={onBack} className={btnSecondary}>
          Back
        </button>
        <button type="button" onClick={onNext} className={btnPrimary}>
          Next &rarr;
        </button>
      </div>
    </div>
  )
}

// ── Step 4 — Done ─────────────────────────────────────────────────────────────

interface Step4Props {
  onBack: () => void
  onFinish: () => Promise<void>
  isSaving: boolean
}

function StepDone({ onBack, onFinish, isSaving }: Step4Props): JSX.Element {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center mb-6">
        <svg
          className="w-8 h-8 text-green-600 dark:text-green-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">You're all set!</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 max-w-sm">
        Dental Cartography is ready. Start by adding your first patient.
      </p>

      <div className="flex flex-col items-center gap-3 w-full">
        <button
          type="button"
          onClick={() => void onFinish()}
          disabled={isSaving}
          className={btnPrimary}
        >
          {isSaving ? 'Opening...' : 'Open Dental Cartography \u2192'}
        </button>
        <button type="button" onClick={onBack} className={btnSecondary}>
          Back
        </button>
      </div>
    </div>
  )
}

// ── Main Wizard ───────────────────────────────────────────────────────────────

export function OnboardingWizard(): JSX.Element {
  const licensee = useLicenseStore((s) => s.status?.licensee)
  const markOnboardingComplete = useLicenseStore((s) => s.markOnboardingComplete)

  const [currentStep, setCurrentStep] = useState(0)
  const [fields, setFields] = useState<ClinicSettings>(EMPTY_SETTINGS)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isLoadingSettings, setIsLoadingSettings] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Pre-populate clinic fields when wizard mounts
  useEffect(() => {
    async function loadSettings(): Promise<void> {
      setIsLoadingSettings(true)
      setLoadError(null)
      try {
        const settings = await getClinicSettings()
        setFields(settings)
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Failed to load clinic settings')
      } finally {
        setIsLoadingSettings(false)
      }
    }
    void loadSettings()
  }, [])

  function handleFieldChange(e: ChangeEvent<HTMLInputElement>): void {
    const { name, value } = e.target
    setFields((prev) => ({ ...prev, [name]: value }))
  }

  async function handleFinish(): Promise<void> {
    setIsSaving(true)
    setSaveError(null)
    try {
      await updateClinicSettings(fields)
    } catch (err) {
      // Show error but do not block progression
      setSaveError(err instanceof Error ? err.message : 'Failed to save clinic settings')
    }
    try {
      await markOnboardingComplete()
    } catch {
      // markOnboardingComplete already handles errors internally
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
        <StepDots current={currentStep} total={TOTAL_STEPS} />

        {saveError !== null && currentStep === 3 && (
          <p
            className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2 mb-4"
            role="alert"
          >
            {saveError}
          </p>
        )}

        {currentStep === 0 && (
          <StepWelcome
            licensee={licensee}
            onNext={() => setCurrentStep(1)}
          />
        )}

        {currentStep === 1 && (
          <StepClinicDetails
            fields={fields}
            onChange={handleFieldChange}
            error={loadError}
            isLoading={isLoadingSettings}
            onBack={() => setCurrentStep(0)}
            onNext={() => setCurrentStep(2)}
          />
        )}

        {currentStep === 2 && (
          <StepPreferences
            onBack={() => setCurrentStep(1)}
            onNext={() => setCurrentStep(3)}
          />
        )}

        {currentStep === 3 && (
          <StepDone
            onBack={() => setCurrentStep(2)}
            onFinish={handleFinish}
            isSaving={isSaving}
          />
        )}
      </div>
    </div>
  )
}
