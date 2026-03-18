import { useEffect } from 'react'
import { Dashboard } from '@/pages/Dashboard'
import { LicenseActivation } from '@/pages/LicenseActivation'
import { OnboardingWizard } from '@/pages/OnboardingWizard'
import { I18nProvider } from '@/lib/i18n'
import { useUIStore } from '@/store/uiStore'
import { useLicenseStore } from '@/store/licenseStore'

function App(): JSX.Element {
  const theme = useUIStore((s) => s.theme)
  const { status, isChecking, checkLicense, onboardingComplete, checkOnboarding } = useLicenseStore()

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  useEffect(() => {
    void checkLicense()
  }, [checkLicense])

  // Once license is confirmed activated, check onboarding status exactly once
  useEffect(() => {
    if (status?.activated === true && onboardingComplete === null) {
      void checkOnboarding()
    }
  }, [status, onboardingComplete, checkOnboarding])

  // Show spinner while license is being checked or while onboarding status is unknown
  // for an activated user (we need onboardingComplete before we can route)
  if (isChecking || status === null || (status.activated && onboardingComplete === null)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!status.activated) {
    return <LicenseActivation />
  }

  if (onboardingComplete === false) {
    return (
      <I18nProvider>
        <OnboardingWizard />
      </I18nProvider>
    )
  }

  return (
    <I18nProvider>
      <Dashboard />
    </I18nProvider>
  )
}

export default App
