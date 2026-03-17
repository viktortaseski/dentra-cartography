import { create } from 'zustand'

type Theme = 'light' | 'dark'
type Language = 'en' | 'mk' | 'sq'

interface UIState {
  theme: Theme
  language: Language
}
interface UIActions {
  setTheme: (theme: Theme) => void
  setLanguage: (language: Language) => void
}

export type UIStore = UIState & UIActions

const storedTheme = (localStorage.getItem('theme') as Theme | null) ?? 'light'
const storedLang = (localStorage.getItem('language') as Language | null) ?? 'en'

export const useUIStore = create<UIStore>((set) => ({
  theme: storedTheme,
  language: storedLang,
  setTheme: (theme) => {
    localStorage.setItem('theme', theme)
    set({ theme })
  },
  setLanguage: (language) => {
    localStorage.setItem('language', language)
    set({ language })
  },
}))
