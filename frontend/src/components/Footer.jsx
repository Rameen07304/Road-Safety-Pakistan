export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-[#173b2b] via-[#123124] to-[#0f281d] text-white mt-20 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* About */}
          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="text-2xl">🛣️</span>
              Road Safety Pakistan
            </h3>
            <p className="text-green-100/70 text-sm">
              AI-powered civic technology platform for reporting and tracking road hazards in Lahore, Pakistan.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-green-100/70 text-sm">
              <li><a href="/" className="hover:text-white transition">Home</a></li>
              <li><a href="/map" className="hover:text-white transition">Live Map</a></li>
              <li><a href="/track" className="hover:text-white transition">Track Complaint</a></li>
              <li><a href="/login" className="hover:text-white transition">Login</a></li>
            </ul>
          </div>

          {/* Features */}
          <div>
            <h4 className="text-lg font-bold mb-4">Features</h4>
            <ul className="space-y-2 text-green-100/70 text-sm">
              <li>AI Hazard Detection</li>
              <li>Live Map Visualization</li>
              <li>Complaint Tracking</li>
              <li>Ward Analytics</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-bold mb-4">Contact</h4>
            <p className="text-green-100/70 text-sm mb-2">Email: info@roadsafetypk.org</p>
            <p className="text-green-100/70 text-sm">Lahore, Pakistan</p>
            <div className="flex gap-4 mt-4">
              <a href="#" className="text-green-100/70 hover:text-white transition">Facebook</a>
              <a href="#" className="text-green-100/70 hover:text-white transition">Twitter</a>
              <a href="#" className="text-green-100/70 hover:text-white transition">Instagram</a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-green-100/70 text-sm">
            © 2026 Road Safety Pakistan. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-green-100/70 mt-4 md:mt-0">
            <a href="#" className="hover:text-white transition">Privacy Policy</a>
            <a href="#" className="hover:text-white transition">Terms of Service</a>
            <a href="#" className="hover:text-white transition">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
