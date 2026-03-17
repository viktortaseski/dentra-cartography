import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react'
import type { Patient, CreatePatientRequest, UpdatePatientRequest } from '@shared/types'
import { usePatientStore } from '@/store/patientStore'
import { useTranslation } from '@/lib/i18n'

interface PatientFormProps {
  /** Pass a patient to edit, or undefined to create a new one */
  patient?: Patient
  onClose: () => void
}

interface FormFields {
  fullName: string
  dateOfBirth: string
  sex: 'male' | 'female' | 'other'
  phone: string
  email: string
  medicalAlerts: string
  notes: string
}

const EMPTY_FIELDS: FormFields = {
  fullName: '',
  dateOfBirth: '',
  sex: 'other',
  phone: '',
  email: '',
  medicalAlerts: '',
  notes: '',
}

function patientToFields(p: Patient): FormFields {
  return {
    fullName: p.fullName,
    dateOfBirth: p.dateOfBirth,
    sex: p.sex,
    phone: p.phone ?? '',
    email: p.email ?? '',
    medicalAlerts: p.medicalAlerts ?? '',
    notes: p.notes ?? '',
  }
}

export function PatientForm({ patient, onClose }: PatientFormProps): JSX.Element {
  const t = useTranslation()
  const { createPatient, updatePatient, isLoading, error } = usePatientStore()

  const [fields, setFields] = useState<FormFields>(
    patient ? patientToFields(patient) : EMPTY_FIELDS
  )
  const [validationError, setValidationError] = useState<string | null>(null)

  // Reset form when the target patient changes
  useEffect(() => {
    setFields(patient ? patientToFields(patient) : EMPTY_FIELDS)
    setValidationError(null)
  }, [patient])

  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ): void {
    const { name, value } = e.target
    setFields((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()
    setValidationError(null)

    if (!fields.fullName.trim()) {
      setValidationError('Full name is required.')
      return
    }
    if (!fields.dateOfBirth) {
      setValidationError('Date of birth is required.')
      return
    }

    if (patient) {
      const data: UpdatePatientRequest = {
        fullName: fields.fullName.trim(),
        dateOfBirth: fields.dateOfBirth,
        sex: fields.sex,
        phone: fields.phone.trim() || null,
        email: fields.email.trim() || null,
        medicalAlerts: fields.medicalAlerts.trim() || null,
        notes: fields.notes.trim() || null,
      }
      await updatePatient(patient.id, data)
    } else {
      const data: CreatePatientRequest = {
        fullName: fields.fullName.trim(),
        dateOfBirth: fields.dateOfBirth,
        sex: fields.sex,
        phone: fields.phone.trim() || null,
        email: fields.email.trim() || null,
        address: null,
        insuranceProvider: null,
        insurancePolicy: null,
        medicalAlerts: fields.medicalAlerts.trim() || null,
        notes: fields.notes.trim() || null,
      }
      await createPatient(data)
    }

    // Close if the store didn't set an error
    if (!usePatientStore.getState().error) {
      onClose()
    }
  }

  const displayedError = validationError ?? error

  const inputClass =
    'w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="patient-form-title"
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h2 id="patient-form-title" className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {patient ? t.patientFormEdit : t.patientFormCreate}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Close form"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
            </svg>
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
            {displayedError && (
              <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2" role="alert">
                {displayedError}
              </p>
            )}

            {/* Full name */}
            <div>
              <label htmlFor="pf-fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t.fullName} <span className="text-red-500">*</span>
              </label>
              <input
                id="pf-fullName"
                name="fullName"
                type="text"
                value={fields.fullName}
                onChange={handleChange}
                autoComplete="name"
                required
                className={inputClass}
                placeholder="Jane Smith"
              />
            </div>

            {/* DOB + Sex row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="pf-dob" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.dateOfBirth} <span className="text-red-500">*</span>
                </label>
                <input
                  id="pf-dob"
                  name="dateOfBirth"
                  type="date"
                  value={fields.dateOfBirth}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="pf-sex" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.sex}
                </label>
                <select
                  id="pf-sex"
                  name="sex"
                  value={fields.sex}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="male">{t.sexMale}</option>
                  <option value="female">{t.sexFemale}</option>
                  <option value="other">{t.sexOther}</option>
                </select>
              </div>
            </div>

            {/* Phone + Email row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="pf-phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.phone}
                </label>
                <input
                  id="pf-phone"
                  name="phone"
                  type="tel"
                  value={fields.phone}
                  onChange={handleChange}
                  autoComplete="tel"
                  className={inputClass}
                  placeholder="+1 555 000 0000"
                />
              </div>
              <div>
                <label htmlFor="pf-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.email}
                </label>
                <input
                  id="pf-email"
                  name="email"
                  type="email"
                  value={fields.email}
                  onChange={handleChange}
                  autoComplete="email"
                  className={inputClass}
                  placeholder="jane@example.com"
                />
              </div>
            </div>

            {/* Medical alerts */}
            <div>
              <label htmlFor="pf-medicalAlerts" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t.medicalAlerts}
              </label>
              <textarea
                id="pf-medicalAlerts"
                name="medicalAlerts"
                value={fields.medicalAlerts}
                onChange={handleChange}
                rows={2}
                className={`${inputClass} resize-none`}
                placeholder="Allergies, conditions, medications..."
              />
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="pf-notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t.notes}
              </label>
              <textarea
                id="pf-notes"
                name="notes"
                value={fields.notes}
                onChange={handleChange}
                rows={3}
                className={`${inputClass} resize-none`}
                placeholder="General notes..."
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              {isLoading ? t.saving : patient ? t.save : t.patientFormCreate}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
