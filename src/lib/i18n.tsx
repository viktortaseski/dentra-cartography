import { createContext, useContext, type ReactNode } from 'react'
import type { Translations } from '@/locales'
import { en, mk, sq } from '@/locales'
import { useUIStore } from '@/store/uiStore'

const LOCALES: Record<string, Translations> = { en, mk, sq }

const I18nContext = createContext<Translations>(en)

export function I18nProvider({ children }: { children: ReactNode }): JSX.Element {
  const language = useUIStore((s) => s.language)
  const translations = LOCALES[language] ?? en
  return <I18nContext.Provider value={translations}>{children}</I18nContext.Provider>
}

export function useTranslation(): Translations {
  return useContext(I18nContext)
}
