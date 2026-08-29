// Flat key -> { en, ur } translation dictionary.
// Keep keys grouped by the page/component they belong to.
export const translations = {
  // Header / navigation
  nav_home: { en: 'Home', ur: 'ہوم' },
  nav_map: { en: 'Map', ur: 'نقشہ' },
  nav_track: { en: 'Track', ur: 'ٹریک کریں' },
  nav_report: { en: 'Report', ur: 'اطلاع دیں' },
  nav_my_issues: { en: 'My Issues', ur: 'میری شکایات' },
  nav_my_dashboard: { en: 'My Dashboard', ur: 'میرا ڈیش بورڈ' },
  nav_dashboard: { en: 'Dashboard', ur: 'ڈیش بورڈ' },
  nav_analytics: { en: 'Analytics', ur: 'تجزیات' },
  nav_login: { en: 'Login', ur: 'لاگ اِن' },
  nav_register: { en: 'Register', ur: 'رجسٹر کریں' },
  nav_logout: { en: 'Logout', ur: 'لاگ آؤٹ' },
  nav_report_hazard: { en: 'Report Hazard', ur: 'خطرے کی اطلاع دیں' },
  nav_my_complaints: { en: 'My Complaints', ur: 'میری شکایات' },
  app_name: { en: 'Road Safety Pakistan', ur: 'روڈ سیفٹی پاکستان' },

  // Home page
  home_hero_title: { en: 'Make Our Roads Safer, Together.', ur: 'آئیے مل کر اپنی سڑکیں محفوظ بنائیں۔' },
  home_hero_subtitle: {
    en: 'Road Safety Pakistan uses AI to detect hazards and empower citizens to report dangerous road conditions instantly. Track every complaint. Hold authorities accountable.',
    ur: 'روڈ سیفٹی پاکستان مصنوعی ذہانت کی مدد سے خطرات کی نشاندہی کرتا ہے اور شہریوں کو سڑکوں کی خطرناک صورتحال فوری رپورٹ کرنے کے قابل بناتا ہے۔ ہر شکایت کو ٹریک کریں اور اداروں کو جوابدہ بنائیں۔',
  },
  home_view_live_map: { en: 'View Live Map', ur: 'لائیو نقشہ دیکھیں' },
  home_report_now: { en: 'Report Now', ur: 'ابھی اطلاع دیں' },
  home_our_impact: { en: 'Our Impact', ur: 'ہمارا اثر' },
  home_total_complaints: { en: 'Total Complaints', ur: 'کل شکایات' },
  home_resolved: { en: 'Resolved', ur: 'حل شدہ' },
  home_pending: { en: 'Pending', ur: 'زیرِ التوا' },
  home_avg_resolution: { en: 'Avg. Resolution', ur: 'اوسط حل کا وقت' },
  home_key_features: { en: 'Key Features', ur: 'اہم خصوصیات' },
  home_how_it_works: { en: 'How It Works', ur: 'یہ کیسے کام کرتا ہے' },
  home_ready_title: { en: 'Ready to Make a Difference?', ur: 'تبدیلی لانے کے لیے تیار ہیں؟' },
  home_ready_subtitle: {
    en: "Join thousands of citizens helping make Lahore's roads safer. Report hazards, track progress, and hold authorities accountable.",
    ur: 'لاہور کی سڑکوں کو محفوظ بنانے میں مدد کرنے والے ہزاروں شہریوں کے ساتھ شامل ہوں۔ خطرات کی اطلاع دیں، پیش رفت دیکھیں، اور اداروں کو جوابدہ بنائیں۔',
  },
  home_register_now: { en: 'Register Now', ur: 'ابھی رجسٹر کریں' },
  home_report_a_hazard: { en: 'Report a Hazard', ur: 'خطرے کی اطلاع دیں' },

  // Login page
  login_welcome_back: { en: 'Welcome Back', ur: 'خوش آمدید' },
  login_subtitle: { en: 'Enter your credentials to access your dashboard.', ur: 'اپنے ڈیش بورڈ تک رسائی کے لیے اپنی معلومات درج کریں۔' },
  login_email_tab: { en: 'Email', ur: 'ای میل' },
  login_phone_tab: { en: 'Phone', ur: 'فون' },
  login_email_label: { en: 'Email Address', ur: 'ای میل ایڈریس' },
  login_phone_label: { en: 'Phone Number', ur: 'فون نمبر' },
  login_password_label: { en: 'Password', ur: 'پاس ورڈ' },
  login_remember_me: { en: 'Remember me', ur: 'مجھے یاد رکھیں' },
  login_forgot_password: { en: 'Forgot Password?', ur: 'پاس ورڈ بھول گئے؟' },
  login_button: { en: 'Login', ur: 'لاگ اِن کریں' },
  login_button_loading: { en: 'Logging in...', ur: 'لاگ اِن ہو رہا ہے...' },
  login_new_here: { en: 'New to Road Safety Pakistan?', ur: 'روڈ سیفٹی پاکستان میں نئے ہیں؟' },
  login_create_account: { en: 'Create Account', ur: 'اکاؤنٹ بنائیں' },

  // Register page
  register_title: { en: 'Create Account', ur: 'نیا اکاؤنٹ بنائیں' },
  register_subtitle: { en: 'Join the community-led initiative for safer roads.', ur: 'محفوظ سڑکوں کی اس شہری مہم میں شامل ہوں۔' },
  register_full_name: { en: 'Full Name', ur: 'پورا نام' },
  register_email: { en: 'Email Address', ur: 'ای میل ایڈریس' },
  register_phone: { en: 'Phone Number', ur: 'فون نمبر' },
  register_id_type: { en: 'ID Type', ur: 'شناختی دستاویز کی قسم' },
  register_cnic_number: { en: 'CNIC Number', ur: 'شناختی کارڈ نمبر' },
  register_password: { en: 'Password', ur: 'پاس ورڈ' },
  register_confirm_password: { en: 'Confirm Password', ur: 'پاس ورڈ کی تصدیق کریں' },
  register_submit: { en: 'Create Account', ur: 'اکاؤنٹ بنائیں' },
  register_submit_loading: { en: 'Creating account...', ur: 'اکاؤنٹ بن رہا ہے...' },
  register_already_have: { en: 'Already have an account?', ur: 'پہلے سے اکاؤنٹ ہے؟' },

  // Track Complaint page
  track_title: { en: 'Track Your Complaint', ur: 'اپنی شکایت ٹریک کریں' },
  track_subtitle: { en: 'Search by Complaint ID or registered phone number', ur: 'شکایت نمبر یا رجسٹرڈ فون نمبر سے تلاش کریں' },
  track_id_placeholder: { en: 'Enter Complaint ID (e.g., RSP-2026-0001)', ur: 'شکایت نمبر درج کریں (مثال: RSP-2026-0001)' },
  track_phone_placeholder: { en: 'Or enter phone number', ur: 'یا فون نمبر درج کریں' },
  track_search_button: { en: 'Search', ur: 'تلاش کریں' },
  track_searching: { en: 'Searching...', ur: 'تلاش جاری ہے...' },
  track_status_timeline: { en: 'Status Timeline', ur: 'صورتحال کی ٹائم لائن' },
  track_submitted: { en: 'Submitted', ur: 'جمع کروائی گئی' },
  track_hazard_details: { en: 'Hazard Details', ur: 'خطرے کی تفصیلات' },
  track_current_status: { en: 'Current Status', ur: 'موجودہ صورتحال' },
  track_description: { en: 'Description', ur: 'تفصیل' },
  track_type_label: { en: 'Type', ur: 'قسم' },
  track_location_label: { en: 'Location', ur: 'مقام' },
  track_ward_label: { en: 'Ward', ur: 'وارڈ' },

  // Live Map page
  map_title: { en: 'Live Hazard Map', ur: 'براہِ راست خطرات کا نقشہ' },
  map_search_placeholder: { en: 'Search areas in Lahore...', ur: 'لاہور میں علاقے تلاش کریں...' },
  map_hazard_type: { en: 'Hazard Type', ur: 'خطرے کی قسم' },
  map_priority_status: { en: 'Priority & Status', ur: 'ترجیح اور صورتحال' },
  map_critical_urgency: { en: 'Critical Urgency', ur: 'انتہائی نازک' },
  map_in_progress: { en: 'In Progress', ur: 'جاری ہے' },
  map_pending_verification: { en: 'Pending Verification', ur: 'تصدیق کے منتظر' },
  map_recent_reports: { en: 'Recent Reports', ur: 'حالیہ رپورٹس' },
  map_no_reports_match: { en: 'No reports match the current filters.', ur: 'موجودہ فلٹرز سے کوئی رپورٹ مماثل نہیں۔' },
  map_active_hazards: { en: 'Active Hazards', ur: 'فعال خطرات' },
  map_total_reported: { en: 'Total reported', ur: 'کل رپورٹ شدہ' },
  map_resolution_rate: { en: 'Resolution Rate this week', ur: 'اس ہفتے حل کی شرح' },
  map_urgency_legend: { en: 'Urgency Legend', ur: 'شدت کی علامتیں' },
  map_view_full_details: { en: 'View Full Details', ur: 'مکمل تفصیلات دیکھیں' },
  map_markers: { en: 'Markers', ur: 'نشانات' },
  map_heatmap: { en: 'Heatmap', ur: 'ہیٹ میپ' },
  map_pothole: { en: 'Pothole', ur: 'گڑھا' },
  map_manhole: { en: 'Manhole', ur: 'مین ہول' },
  map_street_light: { en: 'Street Light', ur: 'اسٹریٹ لائٹ' },
  map_encroachment: { en: 'Encroachment', ur: 'تجاوزات' },
  urgency_low: { en: 'Low', ur: 'کم' },
  urgency_medium: { en: 'Medium', ur: 'درمیانہ' },
  urgency_high: { en: 'High', ur: 'زیادہ' },
  urgency_critical: { en: 'Critical', ur: 'انتہائی نازک' },

  // Citizen Dashboard
  dash_title: { en: 'My Dashboard', ur: 'میرا ڈیش بورڈ' },
  dash_welcome: { en: 'Welcome back', ur: 'خوش آمدید' },
  dash_overview: { en: "Here's an overview of your reports.", ur: 'آپ کی شکایات کا خلاصہ درج ذیل ہے۔' },
  dash_total_submitted: { en: 'Total Submitted', ur: 'کل جمع کروائی گئیں' },
  dash_resolved: { en: 'Resolved', ur: 'حل شدہ' },
  dash_in_progress: { en: 'In Progress', ur: 'جاری ہے' },
  dash_pending: { en: 'Pending', ur: 'زیرِ التوا' },
  dash_most_recent: { en: 'Most Recent Complaint', ur: 'تازہ ترین شکایت' },
  dash_no_complaints: { en: "You haven't reported any road hazards yet.", ur: 'آپ نے ابھی تک کوئی سڑک کا خطرہ رپورٹ نہیں کیا۔' },
  dash_report_first: { en: 'Report Your First Hazard', ur: 'اپنی پہلی شکایت درج کریں' },
  dash_my_locations: { en: 'My Complaint Locations', ur: 'میری شکایات کے مقامات' },
  dash_no_locations: { en: 'No complaint locations to show yet.', ur: 'ابھی دکھانے کے لیے کوئی مقام موجود نہیں۔' },

  // Language toggle
  language_toggle: { en: 'اردو', ur: 'English' },
}

export function translate(language, key) {
  const entry = translations[key]
  if (!entry) return key
  return entry[language] || entry.en || key
}
