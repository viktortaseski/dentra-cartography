import { useEffect } from 'react'
import { Dashboard } from '@/pages/Dashboard'
import { I18nProvider } from '@/lib/i18n'
import { useUIStore } from '@/store/uiStore'

function App(): JSX.Element {
  const theme = useUIStore((s) => s.theme)

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  return (
    <I18nProvider>
      <Dashboard />
    </I18nProvider>
  )
}

export default App
