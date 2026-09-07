import { useEffect } from 'react'

const SUFFIX = 'Road Safety Pakistan'

/**
 * Set the document title for a route.
 *
 * Every route previously shared the single <title> from index.html, which
 * left browser tabs, history entries and screen-reader announcements
 * indistinguishable from one another.
 *
 * Pass the page-specific part only -- the site name is appended here.
 */
export default function useDocumentTitle(title) {
  useEffect(() => {
    const previous = document.title
    document.title = title ? `${title} — ${SUFFIX}` : SUFFIX
    return () => {
      document.title = previous
    }
  }, [title])
}
