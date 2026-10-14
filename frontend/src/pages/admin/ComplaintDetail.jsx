import { useState, useEffect, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, complaintService } from '../../services/api'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { Badge, Button, Alert, PageTitle, UrgencyMark, FormField } from '../../components/UI'
import { statusClasses } from '../../utils/urgencyHelpers'
import Toast from '../../components/Toast'
import { Loader2, ArrowLeft, Camera, CheckCircle2 } from 'lucide-react'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { useLanguage } from '../../context/LanguageContext'

/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

export default function ComplaintDetail() {
  useDocumentTitle('title_complaint_detail')
  const { t, tv, tvList, locale, isUrdu } = useLanguage()
  const { id } = useParams()
  const [complaint, setComplaint] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)
  const [status, setStatus] = useState('')
  const [notes, setNotes] = useState('')
  const [resolvedFile, setResolvedFile] = useState(null)
  const [resolvedPreview, setResolvedPreview] = useState('')
  const [uploadingResolved, setUploadingResolved] = useState(false)
  const [resolvedUploadError, setResolvedUploadError] = useState('')
  const resolvedFileInputRef = useRef(null)

  const fetchComplaint = async () => {
    try {
      const response = await api.get(`/api/complaints/${id}/`)
      setComplaint(response.data)
      setStatus(response.data.status)
      setNotes(response.data.admin_notes || '')
    } catch {
      setError('cd_load_failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchComplaint()
  }, [id])

  const handleResolvedFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setResolvedUploadError('')

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setResolvedUploadError(t('cd_invalid_type'))
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setResolvedUploadError(t('cd_too_large'))
      return
    }

    setResolvedFile(file)
    const reader = new FileReader()
    reader.onload = (event) => setResolvedPreview(event.target.result)
    reader.readAsDataURL(file)
  }

  const handleUpdate = async () => {
    setUpdating(true)
    setResolvedUploadError('')
    try {
      let resolvedImageUrl = complaint.resolved_image_url

      if (status === 'resolved' && resolvedFile) {
        setUploadingResolved(true)
        const fd = new FormData()
        fd.append('image', resolvedFile)
        try {
          const uploadRes = await complaintService.uploadImage(fd)
          resolvedImageUrl = uploadRes.data.image_url
        } catch (uploadErr) {
          const message = uploadErr.response?.data?.detail || t('cd_upload_failed')
          setResolvedUploadError(message)
          setToast({ message, type: 'error' })
          setUpdating(false)
          setUploadingResolved(false)
          return
        } finally {
          setUploadingResolved(false)
        }
      }

      const payload = { status, admin_notes: notes }
      if (status === 'resolved' && resolvedImageUrl) {
        payload.resolved_image_url = resolvedImageUrl
      }

      const response = await api.patch(`/api/admin/complaints/${id}/status/`, payload)
      setComplaint(response.data)
      setResolvedFile(null)
      setResolvedPreview('')
      setToast({ message: t('cd_updated'), type: 'success' })
    } catch {
      setError('cd_update_failed')
      setToast({ message: t('cd_update_failed'), type: 'error' })
    } finally {
      setUpdating(false)
    }
  }

  const backAction = (
    <Link to="/admin/dashboard" className="inline-flex h-10 items-center gap-2 rounded-sm border border-white/40 px-4 text-sm font-semibold text-white hover:bg-white/10">
      <ArrowLeft size={15} aria-hidden="true" className="rtl:-scale-x-100" /> {t('common_back_to_dashboard')}
    </Link>
  )

  if (loading) {
    return (
      <>
        <Header />
        <PageTitle titleKey="title_complaint_detail" actions={backAction} />
        <div className="flex h-72 items-center justify-center" role="status">
          <Loader2 size={28} className="animate-spin text-neutral-500" aria-hidden="true" />
        </div>
        <Footer />
      </>
    )
  }

  if (error) {
    return (
      <>
        <Header />
        <PageTitle titleKey="title_complaint_detail" actions={backAction} />
        <div className="mx-auto max-w-page px-4 py-8 sm:px-6 lg:px-8">
          <Alert message={t(error)} type="error" />
        </div>
        <Footer />
      </>
    )
  }

  const section = 'border-t border-neutral-200 p-5 first:border-t-0 sm:p-6'
  const sentimentTone = {
    emergency: 'danger', frustrated: 'warning', concerned: 'info', neutral: 'default',
  }[String(complaint.sentiment || '').toLowerCase()] || 'default'

  return (
    <>
      <Header />
      <PageTitle titleKey="title_complaint_detail" actions={backAction} />

      <main className="mx-auto max-w-page px-4 py-8 sm:px-6 lg:px-8">
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}

        {/* Identity strip, the same pass treatment as the public Track page. */}
        <div className="mb-6 grid grid-cols-2 gap-px border border-neutral-300 bg-neutral-200 lg:grid-cols-4">
          <div className="bg-white px-4 py-3">
            <div className="label">{t('th_id')}</div>
            <div className="mt-1 text-lg font-bold tnum" dir="ltr">{complaint.complaint_id}</div>
          </div>
          <div className="bg-white px-4 py-3">
            <div className="label">{t('th_urgency')}</div>
            <div className="mt-1 flex items-center gap-2 text-[15px] font-semibold">
              <UrgencyMark level={complaint.urgency_level} size={12} />
              {tv('urgency', complaint.urgency_level)}
              <span className="font-normal text-neutral-500 tnum">{complaint.urgency_score}/100</span>
            </div>
          </div>
          <div className="bg-white px-4 py-3">
            <div className="label">{t('th_status')}</div>
            <div className="mt-1">
              <span className={`rounded-sm px-2 py-0.5 text-sm font-semibold ${statusClasses[complaint.status] || 'bg-neutral-100 text-neutral-700'}`}>
                {tv('status', complaint.status)}
              </span>
            </div>
          </div>
          <div className="bg-white px-4 py-3">
            <div className="label">{t('cd_reporter')}</div>
            <div className="mt-1 truncate text-[15px] font-semibold">{complaint.citizen_name || t('cd_citizen')}</div>
          </div>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-12">
          <div className="border border-neutral-200 bg-white lg:col-span-8">
            {(complaint.image_url || complaint.annotated_image_url || complaint.annotated_image_base64) && (
              <section className={section}>
                <h2 className="label">{t('track_image_comparison')}</h2>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  {complaint.image_url && (
                    <figure>
                      <img src={complaint.image_url} alt={t('track_original_photo')} className="max-h-80 w-full border border-neutral-200 bg-neutral-50 object-contain" />
                      <figcaption className="mt-1.5 text-[13px] text-neutral-500">{t('track_original_photo')}</figcaption>
                    </figure>
                  )}
                  {(complaint.annotated_image_url || complaint.annotated_image_base64) && (
                    <figure>
                      <img
                        src={complaint.annotated_image_url || `data:image/jpeg;base64,${complaint.annotated_image_base64}`}
                        alt={t('track_annotated_photo')}
                        className="max-h-80 w-full border border-neutral-200 bg-neutral-50 object-contain"
                      />
                      <figcaption className="mt-1.5 text-[13px] text-neutral-500">{t('track_annotated_photo')}</figcaption>
                    </figure>
                  )}
                </div>
              </section>
            )}

            <section className={section}>
              <h2 className="label">{t('cd_hazard_analysis')}</h2>
              <dl className="mt-3 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-neutral-500">{t('cd_detected_classes')}</dt>
                  <dd className="mt-0.5 font-medium">{tvList('hazard', complaint.detected_classes) || t('common_na')}</dd>
                </div>
                <div>
                  <dt className="text-neutral-500">{t('cd_confidence')}</dt>
                  <dd className="mt-0.5 font-medium tnum">
                    {Object.entries(complaint.confidence_scores || {}).map(([k, v]) => `${tv('hazard', k)}: ${(Number(v) * 100).toFixed(1)}%`).join(isUrdu ? '، ' : ', ') || t('common_na')}
                  </dd>
                </div>
              </dl>
            </section>

            <section className={section}>
              <h2 className="label">{t('cd_description_sentiment')}</h2>
              <p className="mt-2 max-w-[65ch] text-[15px] leading-relaxed text-neutral-800">{complaint.description}</p>
              <dl className="mt-4 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-neutral-500">{t('cd_sentiment')}</dt>
                  <dd className="mt-1"><Badge variant={sentimentTone}>{tv('sentiment', complaint.sentiment)}</Badge></dd>
                </div>
                <div>
                  <dt className="text-neutral-500">{t('cd_keywords')}</dt>
                  <dd className="mt-1 flex flex-wrap gap-1.5">
                    {complaint.sentiment_keywords?.length
                      ? complaint.sentiment_keywords.map(kw => <Badge key={kw}>{kw}</Badge>)
                      : <span className="text-neutral-500">{t('common_na')}</span>}
                  </dd>
                </div>
              </dl>
            </section>

            <section className={section}>
              <h2 className="label">{t('cd_location_details')}</h2>
              <dl className="mt-3 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-neutral-500">{t('report_address')}</dt>
                  <dd className="mt-0.5 font-medium">{complaint.address || t('common_na')}</dd>
                </div>
                <div>
                  <dt className="text-neutral-500">{t('track_ward_label')}</dt>
                  <dd className="mt-0.5 font-medium">{tv('ward', complaint.ward)}</dd>
                </div>
                <div>
                  <dt className="text-neutral-500">{t('cd_coordinates')}</dt>
                  <dd className="mt-0.5 font-medium tnum" dir="ltr">
                    <Link to={`/map?focus=${complaint.complaint_id}`} className="text-primary-600 hover:underline">
                      {Number(complaint.latitude).toFixed(4)}, {Number(complaint.longitude).toFixed(4)}
                    </Link>
                  </dd>
                </div>
              </dl>
            </section>
          </div>

          <aside className="border border-neutral-200 bg-white lg:sticky lg:top-20 lg:col-span-4">
            <section className={section}>
              <h2 className="text-[17px] font-semibold">{t('cd_update_status')}</h2>
              <div className="mt-4 space-y-4">
                <FormField id="cd-status" labelKey="th_status">
                  <select id="cd-status" value={status} onChange={(e) => setStatus(e.target.value)} className="field">
                    <option value="submitted">{t('status_submitted')}</option>
                    <option value="verified">{t('status_verified')}</option>
                    <option value="in_progress">{t('status_in_progress')}</option>
                    <option value="resolved">{t('status_resolved')}</option>
                    <option value="rejected">{t('status_rejected')}</option>
                  </select>
                </FormField>

                {status === 'resolved' && (
                  <div className="border border-neutral-200 bg-neutral-50 p-3">
                    <p className="text-sm font-semibold text-neutral-800">{t('cd_after_prompt')}</p>
                    {complaint.resolved_image_url && !resolvedPreview && (
                      <div className="mt-2">
                        <p className="mb-1 text-[13px] text-neutral-500">{t('cd_current_after')}</p>
                        <img src={complaint.resolved_image_url} alt={t('track_after')} className="h-24 border border-neutral-200 object-cover" />
                      </div>
                    )}
                    {resolvedPreview ? (
                      <div className="mt-2">
                        <img src={resolvedPreview} alt={t('track_after')} className="h-24 border border-neutral-200 object-cover" />
                        <p className="mt-1 flex items-center gap-1 text-[13px] font-semibold text-success-700">
                          <CheckCircle2 size={12} aria-hidden="true" /> {t('common_photo_selected')}
                        </p>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="mt-2 flex w-full flex-col items-center gap-1 border-2 border-dashed border-neutral-300 bg-white p-4 text-sm text-neutral-600 transition-colors hover:border-neutral-500"
                        onClick={() => resolvedFileInputRef.current?.click()}
                      >
                        <Camera size={20} className="text-neutral-500" aria-hidden="true" />
                        {t('cd_select_after')}
                      </button>
                    )}
                    <input
                      ref={resolvedFileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleResolvedFileChange}
                      className="hidden"
                    />
                    {resolvedUploadError && <p className="mt-2 text-[13px] text-danger-700">{resolvedUploadError}</p>}
                    {uploadingResolved && <p className="mt-2 text-[13px] text-neutral-600">{t('cd_uploading_after')}</p>}
                    <p className="mt-2 text-[13px] text-neutral-500">{t('cd_after_optional')}</p>
                  </div>
                )}

                <FormField id="cd-notes" labelKey="cd_notes">
                  <textarea
                    id="cd-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="field resize-y"
                    rows="4"
                  />
                </FormField>

                <Button className="w-full" loading={updating} onClick={handleUpdate}>
                  {uploadingResolved ? t('cd_uploading_photo') : t('cd_save')}
                </Button>
              </div>
            </section>

            <section className={section}>
              <h2 className="label">{t('cd_metadata')}</h2>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-neutral-500">{t('cd_reported')}</dt>
                  <dd className="font-medium tnum">{new Date(complaint.submitted_at).toLocaleDateString(locale)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-neutral-500">{t('cd_reporter')}</dt>
                  <dd className="font-medium">{complaint.citizen_name || t('cd_citizen')}</dd>
                </div>
              </dl>
            </section>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  )
}
