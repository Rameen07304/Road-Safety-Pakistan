import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react'
import { translate, translateValue } from '../translations/translations'

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

  const t = useCallback((key, vars) => translate(language, key, vars), [language])
  // Labels for values that come from the server: status, urgency, ward, ...
  const tv = useCallback((prefix, value) => translateValue(language, prefix, value), [language])
  // Same, for a list of values (e.g. detected hazard classes), joined with the
  // script's own comma.
  const tvList = useCallback(
    (prefix, values) => (values || []).map((v) => translateValue(language, prefix, v)).join(language === 'ur' ? '، ' : ', '),
    [language],
  )

  return (
    <LanguageContext.Provider value={{
      language,
      setLanguage,
      toggleLanguage,
      isUrdu: language === 'ur',
      // Locale for Date#toLocale*String, so dates follow the UI language.
      locale: language === 'ur' ? 'ur-PK' : 'en-PK',
      t,
      tv,
      tvList,
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
