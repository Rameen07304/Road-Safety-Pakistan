import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { Card } from '../../components/UI'
import { useState, useEffect } from 'react'
import { api } from '../../services/api'

const heroIllustration = encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520" role="img" aria-label="Road safety illustration">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#06351f"/>
      <stop offset="55%" stop-color="#0d5a2f"/>
      <stop offset="100%" stop-color="#1b7a3d"/>
    </linearGradient>
    <linearGradient id="road" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0%" stop-color="#2d3f35"/>
      <stop offset="100%" stop-color="#18251d"/>
    </linearGradient>
  </defs>
  <rect width="800" height="520" fill="url(#bg)"/>
  <circle cx="650" cy="105" r="56" fill="#f4f1d5" opacity="0.25"/>
  <rect x="120" y="70" width="120" height="210" rx="14" fill="#0a2417" opacity="0.72"/>
  <rect x="260" y="40" width="100" height="255" rx="14" fill="#0b2a1a" opacity="0.8"/>
  <rect x="380" y="88" width="170" height="220" rx="14" fill="#0d311f" opacity="0.84"/>
  <rect x="150" y="300" width="500" height="118" rx="20" fill="url(#road)"/>
  <path d="M400 300v118" stroke="#f6e27a" stroke-width="10" stroke-dasharray="38 24" stroke-linecap="round"/>
  <path d="M200 414c80-34 320-34 400 0" fill="none" stroke="#1e8b47" stroke-width="10" opacity="0.35"/>
  <rect x="610" y="330" width="90" height="38" rx="10" fill="#1f5630"/>
  <rect x="190" y="340" width="85" height="38" rx="10" fill="#245d36"/>
  <circle cx="645" cy="360" r="10" fill="#9ef0a4"/>
  <circle cx="230" cy="360" r="10" fill="#9ef0a4"/>
</svg>
`)

export default function Home() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalComplaints: 0,
    resolvedComplaints: 0,
    pendingComplaints: 0,
    avgResolutionTime: 0,
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/api/complaints/map/')
        const complaints = response.data.complaints || response.data.results || response.data || []
        const resolved = complaints.filter(c => c.status === 'resolved').length
        const pending = complaints.filter(c => c.status !== 'resolved').length
        
        setStats({
          totalComplaints: complaints.length,
          resolvedComplaints: resolved,
          pendingComplaints: pending,
          avgResolutionTime: '2.4 days',
        })
      } catch (err) {
        console.error('Failed to fetch stats:', err)
      }
    }

    fetchStats()
  }, [])

  return (
    <>
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-600 to-green-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl font-bold mb-6">
                Make Our Roads Safer, Together.
              </h1>
              <p className="text-xl text-green-100 mb-8">
                Road Safety Pakistan uses AI to detect hazards and empower citizens to report dangerous road conditions instantly. Track every complaint. Hold authorities accountable.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/map" className="bg-white text-green-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition">
                  View Live Map
                </Link>
                {!user && (
                  <Link to="/register" className="border-2 border-white text-white px-8 py-3 rounded-lg font-bold hover:bg-white hover:text-green-600 transition">
                    Report Now
                  </Link>
                )}
                {user && user.role === 'citizen' && (
                  <Link to="/report" className="border-2 border-white text-white px-8 py-3 rounded-lg font-bold hover:bg-white hover:text-green-600 transition">
                    Report Now
                  </Link>
                )}
              </div>
            </div>
            <div className="hidden md:block">
              <div className="bg-white rounded-2xl p-4 shadow-2xl border border-white/30">
                <img
                  src={`data:image/svg+xml;charset=UTF-8,${heroIllustration}`}
                  alt="Road safety illustration"
                  className="w-full rounded-xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">Our Impact</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <Card className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">{stats.totalComplaints}</div>
              <div className="text-gray-600">Total Complaints</div>
            </Card>
            <Card className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">{stats.resolvedComplaints}</div>
              <div className="text-gray-600">Resolved</div>
            </Card>
            <Card className="text-center">
              <div className="text-4xl font-bold text-orange-600 mb-2">{stats.pendingComplaints}</div>
              <div className="text-gray-600">Pending</div>
            </Card>
            <Card className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">{stats.avgResolutionTime}</div>
              <div className="text-gray-600">Avg. Resolution</div>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">Key Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <div className="text-5xl mb-4">📸</div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">AI Hazard Detection</h3>
              <p className="text-gray-600">Our YOLOv8 model automatically detects potholes, open manholes, broken speed bumps, and garbage with 80.8% accuracy.</p>
            </Card>
            <Card>
              <div className="text-5xl mb-4">🗺️</div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Live Interactive Map</h3>
              <p className="text-gray-600">View all reported hazards on a real-time map of Lahore. Color-coded pins show urgency levels at a glance.</p>
            </Card>
            <Card>
              <div className="text-5xl mb-4">📊</div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Ward Analytics</h3>
              <p className="text-gray-600">Track complaint volumes and resolution times by ward. Hold authorities accountable with transparent performance data.</p>
            </Card>
            <Card>
              <div className="text-5xl mb-4">🧠</div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Sentiment Analysis</h3>
              <p className="text-gray-600">Our system analyzes your complaint description in Urdu or English to boost urgency scores automatically.</p>
            </Card>
            <Card>
              <div className="text-5xl mb-4">⚡</div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Auto Urgency Scoring</h3>
              <p className="text-gray-600">Hazard type, sentiment, and keywords combine to generate urgent prioritization for admins.</p>
            </Card>
            <Card>
              <div className="text-5xl mb-4">🔐</div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Secure & Private</h3>
              <p className="text-gray-600">JWT-based authentication and encrypted data storage protect your personal information.</p>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="bg-green-600 text-white text-3xl font-bold rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Upload Photo</h3>
              <p className="text-gray-600">Take a photo of the road hazard and provide a description in Urdu or English.</p>
            </div>
            <div className="text-center">
              <div className="bg-green-600 text-white text-3xl font-bold rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">AI Analysis</h3>
              <p className="text-gray-600">Our YOLOv8 model analyzes the image and identifies the hazard type with confidence scores.</p>
            </div>
            <div className="text-center">
              <div className="bg-green-600 text-white text-3xl font-bold rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Get Priority</h3>
              <p className="text-gray-600">Your complaint gets an urgency score and appears on the live map for admin review.</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <h3 className="text-2xl font-bold mb-6 text-gray-900">5 Hazard Types Detected</h3>
            <div className="grid md:grid-cols-5 gap-4">
              <div className="text-center p-4 border rounded-lg hover:border-green-600 transition">
                <div className="text-4xl mb-2">🕳️</div>
                <p className="font-semibold text-gray-900">Pothole</p>
                <p className="text-sm text-gray-600 mt-1">mAP50: 0.837</p>
              </div>
              <div className="text-center p-4 border rounded-lg hover:border-green-600 transition">
                <div className="text-4xl mb-2">🔓</div>
                <p className="font-semibold text-gray-900">Open Manhole</p>
                <p className="text-sm text-gray-600 mt-1">mAP50: 0.895</p>
              </div>
              <div className="text-center p-4 border rounded-lg hover:border-green-600 transition">
                <div className="text-4xl mb-2">⚠️</div>
                <p className="font-semibold text-gray-900">Broken Manhole</p>
                <p className="text-sm text-gray-600 mt-1">mAP50: 0.921</p>
              </div>
              <div className="text-center p-4 border rounded-lg hover:border-green-600 transition">
                <div className="text-4xl mb-2">🏁</div>
                <p className="font-semibold text-gray-900">Speed Bump</p>
                <p className="text-sm text-gray-600 mt-1">mAP50: 0.978</p>
              </div>
              <div className="text-center p-4 border rounded-lg hover:border-green-600 transition">
                <div className="text-4xl mb-2">🗑️</div>
                <p className="font-semibold text-gray-900">Garbage</p>
                <p className="text-sm text-gray-600 mt-1">mAP50: 0.409</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-green-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Make a Difference?</h2>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            Join thousands of citizens helping make Lahore's roads safer. Report hazards, track progress, and hold authorities accountable.
          </p>
          {!user ? (
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/register" className="bg-white text-green-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition">
                Register Now
              </Link>
              <Link to="/login" className="border-2 border-white text-white px-8 py-3 rounded-lg font-bold hover:bg-white hover:text-green-600 transition">
                Login
              </Link>
            </div>
          ) : user.role === 'citizen' ? (
            <Link to="/report" className="inline-block bg-white text-green-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition">
              Report a Hazard
            </Link>
          ) : null}
        </div>
      </section>

      <Footer />
    </>
  )
}
