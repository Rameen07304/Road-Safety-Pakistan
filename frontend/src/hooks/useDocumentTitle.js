import { useEffect } from 'react'
import { useLanguage } from '../context/LanguageContext'

/**
 * Set the document title for a route.
 *
 * Every route previously shared the single <title> from index.html, which
 * left browser tabs, history entries and screen-reader announcements
 * indistinguishable from one another.
 *
 * Pass the translation key of the page-specific part only -- the site name
 * is appended here, and both follow the current UI language.
 */
export default function useDocumentTitle(titleKey) {
  const { t } = useLanguage()
  const title = titleKey ? t(titleKey) : ''
  const suffix = t('app_name')

  useEffect(() => {
    const previous = document.title
    document.title = title ? `${title} | ${suffix}` : suffix
    return () => {
      document.title = previous
    }
  }, [title, suffix])
}
