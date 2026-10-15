import { useEffect, useRef, useState } from 'react'
import { Camera, RefreshCw, X } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

/**
 * Full-screen camera with a front/back switch. Works on laptops too, where a
 * file input with `capture` only opens the file picker. Calls onCapture(File)
 * with a JPEG, or onUnavailable() when there is no camera or permission was
 * refused, so the caller can fall back to the phone's own camera/file picker.
 */
export default function CameraCapture({ onCapture, onClose, onUnavailable }) {
  const { t } = useLanguage()
  const videoRef = useRef(null)
  const [facing, setFacing] = useState('environment')
  const [ready, setReady] = useState(false)
  const [canSwitch, setCanSwitch] = useState(false)

  useEffect(() => {
    let stream
    let cancelled = false
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: facing }, width: { ideal: 1920 } }, audio: false })
      .then(async (s) => {
        if (cancelled) return s.getTracks().forEach((track) => track.stop())
        stream = s
        videoRef.current.srcObject = s
        await videoRef.current.play().catch(() => {})
        setReady(true)
        const devices = await navigator.mediaDevices.enumerateDevices()
        setCanSwitch(devices.filter((d) => d.kind === 'videoinput').length > 1)
      })
      .catch(() => { if (!cancelled) onUnavailable() })
    return () => {
      cancelled = true
      stream?.getTracks().forEach((track) => track.stop())
    }
  }, [facing, onUnavailable])

  // Escape closes, as with any dialog.
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const takePhoto = () => {
    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    canvas.toBlob(
      (blob) => blob && onCapture(new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' })),
      'image/jpeg',
      0.9,
    )
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black" role="dialog" aria-modal="true" aria-label={t('camera_title')}>
      <video
        ref={videoRef}
        playsInline
        muted
        className={`min-h-0 flex-1 object-contain ${facing === 'user' ? '-scale-x-100' : ''}`}
      />
      {!ready && <p className="absolute inset-x-0 top-1/2 text-center text-base text-white" role="status">{t('camera_starting')}</p>}

      <div className="flex items-center justify-between gap-4 bg-black px-6 py-5" dir="ltr">
        <button
          type="button"
          onClick={onClose}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
          aria-label={t('camera_close')}
        >
          <X size={26} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={takePhoto}
          disabled={!ready}
          className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-white/20 text-white disabled:opacity-40"
          aria-label={t('camera_take')}
        >
          <Camera size={30} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => { setReady(false); setFacing((f) => (f === 'environment' ? 'user' : 'environment')) }}
          disabled={!canSwitch}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 disabled:invisible"
          aria-label={t('camera_switch')}
        >
          <RefreshCw size={24} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
