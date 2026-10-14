import { useState } from 'react'
import { Mic, Square, Info } from 'lucide-react'
import useSpeechRecognition from '../hooks/useSpeechRecognition'
import { useLanguage } from '../context/LanguageContext'

// Chrome recognises ur-PK well. Pakistani Punjabi is written in Shahmukhi and
// the browser engines only offer Punjabi in Gurmukhi (pa-IN), which would
// return the wrong script -- so it is deliberately not offered here.
const LANGUAGES = [
  { code: 'ur-PK', label: 'اردو', title: 'Urdu' },
  { code: 'en-PK', label: 'English', title: 'English' },
]

/**
 * Dictate text into a field instead of typing it.
 *
 * Renders nothing when the browser has no speech engine, so the surrounding
 * form keeps working exactly as before.
 */
export default function VoiceInput({ onTranscript, disabled = false }) {
  const { t } = useLanguage()
  const [lang, setLang] = useState(LANGUAGES[0].code)
  const { supported, listening, interim, error, start, stop } = useSpeechRecognition({ lang })

  if (!supported) {
    return (
      <p className="mb-3 flex items-center gap-2 text-xs text-neutral-500">
        <Info size={13} aria-hidden="true" />
        {t('voice_unsupported')}
      </p>
    )
  }

  const toggle = () => {
    if (listening) stop()
    else start((text) => onTranscript(text))
  }

  return (
    <div className="mb-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={toggle}
          disabled={disabled}
          aria-pressed={listening}
          className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50 ${
            listening
              ? 'bg-danger text-white hover:bg-danger-700'
              : 'border border-primary-500 text-primary-600 hover:bg-primary-50'
          }`}
        >
          {listening ? <Square size={15} aria-hidden="true" /> : <Mic size={15} aria-hidden="true" />}
          {listening ? t('voice_stop') : t('voice_speak')}
        </button>

        {/* Language choice matters more than usual here: the recogniser needs
            to be told which language it is listening for. */}
        <div className="flex overflow-hidden rounded-lg border border-neutral-200" role="group" aria-label={t('voice_language')}>
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => setLang(l.code)}
              disabled={listening}
              aria-pressed={lang === l.code}
              title={l.title}
              className={`px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                lang === l.code
                  ? 'bg-primary-50 text-primary-700'
                  : 'bg-white text-neutral-500 hover:bg-neutral-50'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>

        {listening && (
          <span className="inline-flex items-center gap-1.5 text-sm text-neutral-500">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-danger" />
            </span>
            {t('voice_listening')}
          </span>
        )}
      </div>

      {/* Announced so a screen-reader user knows dictation is running and what
          has been heard so far. */}
      <p aria-live="polite" className="sr-only">
        {listening ? t('voice_listening_sr') : ''}
      </p>

      {interim && (
        <p className="mt-2 text-sm italic text-neutral-500" aria-hidden="true">
          {interim}
        </p>
      )}

      {error && (
        <p role="alert" className="mt-2 text-sm text-danger-700">
          {t(error)}
        </p>
      )}
    </div>
  )
}
