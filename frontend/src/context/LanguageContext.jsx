import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react'
import { translate } from '../translations/translations'

/* eslint-disable react-refresh/only-export-components */

const LanguageContext = createContext(null)

const STORAGE_KEY = 'language'
const VALID_LANGUAGES = ['en', 'ur']

function getInitialLanguage() {
  const stored = localStorage.getItem(STORAGE_KEY)
  return VALID_LANGUAGES.includes(stored) ? stored : 'en'
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(getInitialLanguage)

  useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir = language === 'ur' ? 'rtl' : 'ltr'
  }, [language])

  const setLanguage = useCallback((next) => {
    if (!VALID_LANGUAGES.includes(next)) return
    localStorage.setItem(STORAGE_KEY, next)
    setLanguageState(next)
  }, [])

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'en' ? 'ur' : 'en')
  }, [language, setLanguage])

  const t = useCallback((key) => translate(language, key), [language])

  return (
    <LanguageContext.Provider value={{
      language,
      setLanguage,
      toggleLanguage,
      isUrdu: language === 'ur',
      t,
    }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}

export default LanguageContext
