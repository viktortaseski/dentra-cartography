import { create } from 'zustand'
import type { LicenseStatus, ActivateResult } from '@shared/types'
import {
  getLicenseStatus,
  activateLicense,
  getLicenseMachineCode,
  getOnboardingStatus,
  completeOnboarding,
} from '@/lib/ipc'

interface LicenseState {
  status: LicenseStatus | null
  isChecking: boolean
  isActivating: boolean
  activationError: string | null
  machineCode: string | null
  isLoadingMachineCode: boolean
  onboardingComplete: boolean | null
}

interface LicenseActions {
  checkLicense: () => Promise<void>
  activate: (key: string) => Promise<ActivateResult>
  loadMachineCode: () => Promise<void>
  checkOnboarding: () => Promise<void>
  markOnboardingComplete: () => Promise<void>
}

export type LicenseStore = LicenseState & LicenseActions

export const useLicenseStore = create<LicenseStore>((set) => ({
  status: null,
  isChecking: false,
  isActivating: false,
  activationError: null,
  machineCode: null,
  isLoadingMachineCode: false,
  onboardingComplete: null,

  checkLicense: async () => {
    set({ isChecking: true })
    try {
      const status = await getLicenseStatus()
      set({
        status,
        isChecking: false,
        activationError: status.activated ? null : (status.error ?? null),
      })
    } catch {
      set({
        status: { activated: false },
        isChecking: false,
        activationError: 'Failed to check license status',
      })
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

  loadMachineCode: async () => {
    set({ isLoadingMachineCode: true })
    try {
      const result = await getLicenseMachineCode()
      set({ machineCode: result.machineCode, isLoadingMachineCode: false })
    } catch {
      set({ machineCode: null, isLoadingMachineCode: false })
    }
  },

  checkOnboarding: async () => {
    try {
      const complete = await getOnboardingStatus()
      set({ onboardingComplete: complete })
    } catch {
      set({ onboardingComplete: false })
    }
  },

  markOnboardingComplete: async () => {
    try {
      await completeOnboarding()
      set({ onboardingComplete: true })
    } catch {
      set({ onboardingComplete: true })
    }
  },
}))
