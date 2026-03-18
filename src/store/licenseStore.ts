import { create } from 'zustand'
import type { LicenseStatus, ActivateResult } from '@shared/types'
import { getLicenseStatus, activateLicense } from '@/lib/ipc'

interface LicenseState {
  status: LicenseStatus | null
  isChecking: boolean
  isActivating: boolean
  activationError: string | null
}

interface LicenseActions {
  checkLicense: () => Promise<void>
  activate: (key: string) => Promise<ActivateResult>
}

export type LicenseStore = LicenseState & LicenseActions

export const useLicenseStore = create<LicenseStore>((set) => ({
  status: null,
  isChecking: false,
  isActivating: false,
  activationError: null,

  checkLicense: async () => {
    set({ isChecking: true })
    try {
      const status = await getLicenseStatus()
      set({ status, isChecking: false })
    } catch {
      set({ status: { activated: false }, isChecking: false })
    }
  },

  activate: async (key: string) => {
    set({ isActivating: true, activationError: null })
    try {
      const result = await activateLicense(key)
      if (result.success) {
        const status = await getLicenseStatus()
        set({ status, isActivating: false })
      } else {
        set({ isActivating: false, activationError: result.error ?? 'Activation failed' })
      }
      return result
    } catch {
      set({ isActivating: false, activationError: 'Activation failed' })
      return { success: false, error: 'Activation failed' }
    }
  },
}))
