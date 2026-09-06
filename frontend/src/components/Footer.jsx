import { Route, Mail, MapPin, Globe, MessageCircle, Camera } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-primary-800 via-primary-900 to-primary-900 text-white mt-20 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* About */}
          <div>
            <h3 className="text-lg font-heading font-bold mb-4 flex items-center gap-2.5">
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                <Route size={16} className="text-primary-200" />
              </div>
              Road Safety Pakistan
            </h3>
            <p className="text-primary-200/70 text-sm leading-relaxed">
              AI-powered civic technology platform for reporting and tracking road hazards in Lahore, Pakistan.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-heading font-bold mb-4 uppercase tracking-wider text-primary-300">Quick Links</h4>
            <ul className="space-y-2.5 text-primary-200/70 text-sm">
              <li><a href="/" className="hover:text-white transition">Home</a></li>
              <li><a href="/map" className="hover:text-white transition">Live Map</a></li>
              <li><a href="/track" className="hover:text-white transition">Track Complaint</a></li>
              <li><a href="/login" className="hover:text-white transition">Login</a></li>
            </ul>
          </div>

          {/* Features */}
          <div>
            <h4 className="text-sm font-heading font-bold mb-4 uppercase tracking-wider text-primary-300">Features</h4>
            <ul className="space-y-2.5 text-primary-200/70 text-sm">
              <li>AI Hazard Detection</li>
              <li>Live Map Visualization</li>
              <li>Complaint Tracking</li>
              <li>Ward Analytics</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-heading font-bold mb-4 uppercase tracking-wider text-primary-300">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-primary-200/70">
                <Mail size={14} className="text-primary-300 flex-shrink-0" />
                info@roadsafetypk.org
              </li>
              <li className="flex items-center gap-2 text-primary-200/70">
                <MapPin size={14} className="text-primary-300 flex-shrink-0" />
                Lahore, Pakistan
              </li>
            </ul>
            <div className="flex gap-3 mt-4">
              <a href="#" aria-label="Facebook" className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition">
                <Globe size={14} className="text-primary-200" />
              </a>
              <a href="#" aria-label="Twitter" className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition">
                <MessageCircle size={14} className="text-primary-200" />
              </a>
              <a href="#" aria-label="Instagram" className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition">
                <Camera size={14} className="text-primary-200" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-primary-200/50 text-sm">
            © 2026 Road Safety Pakistan. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-primary-200/50 mt-4 md:mt-0">
            <a href="#" className="hover:text-white transition">Privacy Policy</a>
            <a href="#" className="hover:text-white transition">Terms of Service</a>
            <a href="#" className="hover:text-white transition">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
