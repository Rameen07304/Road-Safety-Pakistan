import { Link } from 'react-router-dom'
import { Mail, MapPin } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { LogoMark } from './UI'

// Only working destinations: the old social icons and policy links all
// pointed at "#" and went nowhere.
export default function Footer() {
  const { t } = useLanguage()
  const linkClass = 'text-neutral-300 hover:text-white hover:underline'

  return (
    <footer className="mt-16 bg-neutral-900 text-neutral-300">
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 py-12 md:grid-cols-12">
          <div className="md:col-span-6">
            <div className="flex items-center gap-2.5">
              <LogoMark size={28} />
              <span className="font-heading text-base font-bold text-white">{t('app_name')}</span>
            </div>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-neutral-400">{t('footer_about')}</p>
          </div>

          <nav aria-label={t('footer_quick_links')} className="md:col-span-3">
            <h2 className="label !text-neutral-400">{t('footer_quick_links')}</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link to="/" className={linkClass}>{t('nav_home')}</Link></li>
              <li><Link to="/map" className={linkClass}>{t('footer_live_map')}</Link></li>
              <li><Link to="/track" className={linkClass}>{t('footer_track_complaint')}</Link></li>
              <li><Link to="/login" className={linkClass}>{t('nav_login')}</Link></li>
            </ul>
          </nav>

          <div className="md:col-span-3">
            <h2 className="label !text-neutral-400">{t('footer_contact')}</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li className="flex items-center gap-2" dir="ltr">
                <Mail size={14} className="shrink-0 text-neutral-500" aria-hidden="true" />
                <a href="mailto:info@roadsafetypk.org" className={linkClass}>info@roadsafetypk.org</a>
              </li>
              <li className="flex items-center gap-2">
                <MapPin size={14} className="shrink-0 text-neutral-500" aria-hidden="true" />
                {t('footer_location')}
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-neutral-800 py-5 text-xs text-neutral-400">
          {t('footer_rights')}
        </div>
      </div>
    </footer>
  )
}
