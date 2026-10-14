import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Thin wrapper around the browser's Web Speech API.
 *
 * Literacy is a real barrier for many of the citizens this platform serves, so
 * being able to speak a hazard description instead of typing it keeps the core
 * action reachable. This uses the browser engine rather than a hosted model:
 * no API key, no cost, and nothing leaves the device beyond what the browser
 * itself sends.
 *
 * Availability is not guaranteed -- the API is unimplemented in some browsers
 * and requires a secure context (HTTPS, or localhost in development) -- so
 * callers must treat `supported` as false-able and keep typing available.
 */
export default function useSpeechRecognition({ lang = 'ur-PK' } = {}) {
  const SpeechRecognition =
    typeof window !== 'undefined' &&
    (window.SpeechRecognition || window.webkitSpeechRecognition)

  const supported = Boolean(SpeechRecognition)

  const [listening, setListening] = useState(false)
  const [interim, setInterim] = useState('')
  const [error, setError] = useState(null)

  const recognitionRef = useRef(null)
  // Held in a ref so the recognition callbacks always reach the current
  // handler without tearing down and rebuilding the recogniser on each render.
  const onResultRef = useRef(null)

  useEffect(() => {
    if (!supported) return undefined

    const recognition = new SpeechRecognition()
    recognition.lang = lang
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (event) => {
      let finalChunk = ''
      let pending = ''
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i]
        if (result.isFinal) finalChunk += result[0].transcript
        else pending += result[0].transcript
      }
      setInterim(pending)
      if (finalChunk.trim() && onResultRef.current) {
        onResultRef.current(finalChunk.trim())
      }
    }

    recognition.onerror = (event) => {
      // "aborted" and "no-speech" are ordinary outcomes, not failures worth
      // showing to someone who simply stopped talking.
      if (event.error === 'aborted' || event.error === 'no-speech') return
      // A translation key, so the message follows the UI language.
      setError(event.error === 'not-allowed' ? 'voice_error_denied' : 'voice_error_unavailable')
      setListening(false)
    }

    recognition.onend = () => {
      setListening(false)
      setInterim('')
    }

    recognitionRef.current = recognition
    return () => {
      recognition.onresult = null
      recognition.onerror = null
      recognition.onend = null
      try {
        recognition.abort()
      } catch {
        // Aborting an inactive recogniser throws in some browsers; harmless.
      }
      recognitionRef.current = null
    }
  }, [SpeechRecognition, supported, lang])

  const start = useCallback((onResult) => {
    if (!recognitionRef.current || listening) return
    onResultRef.current = onResult
    setError(null)
    setInterim('')
    try {
      recognitionRef.current.start()
      setListening(true)
    } catch {
      // start() throws if the recogniser is already running.
      setListening(false)
    }
  }, [listening])

  const stop = useCallback(() => {
    if (!recognitionRef.current) return
    try {
      recognitionRef.current.stop()
    } catch {
      // Stopping an inactive recogniser is a no-op we do not need to surface.
    }
    setListening(false)
  }, [])

  return { supported, listening, interim, error, start, stop }
}
