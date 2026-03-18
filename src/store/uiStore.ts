import { create } from 'zustand'

type Theme = 'light' | 'dark'
type Language = 'en' | 'mk' | 'sq'
export type FontSize = 'normal' | 'large'

interface UIState {
  theme: Theme
  language: Language
  fontSize: FontSize
}
interface UIActions {
  setTheme: (theme: Theme) => void
  setLanguage: (language: Language) => void
  setFontSize: (size: FontSize) => void
}

export type UIStore = UIState & UIActions

const storedTheme = (localStorage.getItem('theme') as Theme | null) ?? 'light'
const storedLang = (localStorage.getItem('language') as Language | null) ?? 'en'
const storedFontSize = (localStorage.getItem('fontSize') as FontSize | null) ?? 'normal'

export const useUIStore = create<UIStore>((set) => ({
  theme: storedTheme,
  language: storedLang,
  fontSize: storedFontSize,
  setTheme: (theme) => {
    localStorage.setItem('theme', theme)
    set({ theme })
  },
  setLanguage: (language) => {
    localStorage.setItem('language', language)
    set({ language })
  },
  setFontSize: (fontSize) => {
    localStorage.setItem('fontSize', fontSize)
    set({ fontSize })
  },
}))
