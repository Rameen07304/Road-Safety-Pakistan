// Flat key -> { en, ur } translation dictionary.
// Keep keys grouped by the page/component they belong to.
// Values may contain {placeholders}, filled from the second argument of t().
export const translations = {
  // Common
  common_back: { en: 'Back', ur: 'واپس' },
  common_next: { en: 'Next', ur: 'آگے' },
  common_view: { en: 'View', ur: 'دیکھیں' },
  common_all: { en: 'All', ur: 'تمام' },
  common_na: { en: 'N/A', ur: 'دستیاب نہیں' },
  common_lahore: { en: 'Lahore', ur: 'لاہور' },
  common_days: { en: '{n} days', ur: '{n} دن' },
  common_loading_page: { en: 'Loading page', ur: 'صفحہ لوڈ ہو رہا ہے' },
  common_back_to_dashboard: { en: 'Back to Dashboard', ur: 'ڈیش بورڈ پر واپس جائیں' },
  common_photo_selected: { en: 'Photo selected', ur: 'تصویر منتخب ہو گئی' },
  common_close: { en: 'Close', ur: 'بند کریں' },
  common_open_complaint: { en: 'Open complaint {id}', ur: 'شکایت {id} کھولیں' },
  time_minutes_ago: { en: '{n}m ago', ur: '{n} منٹ پہلے' },
  time_hours_ago: { en: '{n}h ago', ur: '{n} گھنٹے پہلے' },
  time_days_ago: { en: '{n}d ago', ur: '{n} دن پہلے' },

  // Page titles (browser tab)
  title_home: { en: 'Home', ur: 'ہوم' },
  title_track: { en: 'Track a Complaint', ur: 'شکایت ٹریک کریں' },
  title_login: { en: 'Login', ur: 'لاگ اِن' },
  title_register: { en: 'Create an Account', ur: 'اکاؤنٹ بنائیں' },
  title_reset: { en: 'Reset Password', ur: 'پاس ورڈ ری سیٹ کریں' },
  title_report: { en: 'Report a Hazard', ur: 'خطرے کی اطلاع دیں' },
  title_admin_dashboard: { en: 'Admin Dashboard', ur: 'ایڈمن ڈیش بورڈ' },
  title_complaint_detail: { en: 'Complaint Detail', ur: 'شکایت کی تفصیل' },
  title_flagged: { en: 'Flagged Reports', ur: 'فلیگ شدہ رپورٹس' },
  title_ward_analytics: { en: 'Ward Analytics', ur: 'وارڈ تجزیات' },

  // Complaint status
  status_submitted: { en: 'Submitted', ur: 'جمع شدہ' },
  status_verified: { en: 'Verified', ur: 'تصدیق شدہ' },
  status_in_progress: { en: 'In Progress', ur: 'جاری ہے' },
  status_resolved: { en: 'Resolved', ur: 'حل شدہ' },
  status_rejected: { en: 'Rejected', ur: 'مسترد' },
  status_pending: { en: 'Pending', ur: 'زیرِ التوا' },

  // Urgency levels
  urgency_low: { en: 'Low', ur: 'کم' },
  urgency_medium: { en: 'Medium', ur: 'درمیانہ' },
  urgency_high: { en: 'High', ur: 'زیادہ' },
  urgency_critical: { en: 'Critical', ur: 'انتہائی نازک' },

  // Cluster progression
  progression_worsening: { en: 'Worsening', ur: 'بگڑ رہا ہے' },
  progression_improving: { en: 'Improving', ur: 'بہتر ہو رہا ہے' },
  progression_unchanged: { en: 'Unchanged', ur: 'جوں کا توں' },

  // Detected hazard classes (backend detection/detector.py CLASS_NAMES)
  hazard_pothole: { en: 'Pothole', ur: 'گڑھا' },
  hazard_open_manhole: { en: 'Open Manhole', ur: 'کھلا مین ہول' },
  hazard_broken_manhole: { en: 'Broken Manhole', ur: 'ٹوٹا ہوا مین ہول' },
  hazard_speed_bump: { en: 'Speed Bump', ur: 'اسپیڈ بریکر' },
  hazard_garbage: { en: 'Garbage', ur: 'کچرا' },

  // Sentiment (backend detection/sentiment.py)
  sentiment_emergency: { en: 'Emergency', ur: 'ہنگامی' },
  sentiment_frustrated: { en: 'Frustrated', ur: 'برہم' },
  sentiment_concerned: { en: 'Concerned', ur: 'فکرمند' },
  sentiment_neutral: { en: 'Neutral', ur: 'غیر جانبدار' },

  // Departments (backend complaints/views.py DEPARTMENT_MAP)
  dept_roads_infrastructure: { en: 'Roads & Infrastructure', ur: 'سڑکیں و انفراسٹرکچر' },
  dept_solid_waste_management: { en: 'Solid Waste Management', ur: 'سالڈ ویسٹ مینجمنٹ' },
  dept_traffic_engineering: { en: 'Traffic Engineering', ur: 'ٹریفک انجینئرنگ' },

  // Wards (the English name is what gets stored; this is display only)
  ward_lahore_cant: { en: 'Lahore Cant', ur: 'لاہور کینٹ' },
  ward_data_ganj_baksh: { en: 'Data Ganj Baksh', ur: 'داتا گنج بخش' },
  ward_allama_iqbal: { en: 'Allama Iqbal', ur: 'علامہ اقبال' },
  ward_azad_pul: { en: 'Azad Pul', ur: 'آزاد پل' },
  ward_mall: { en: 'Mall', ur: 'مال' },
  ward_johar_town: { en: 'Johar Town', ur: 'جوہر ٹاؤن' },
  ward_shadbagh: { en: 'Shadbagh', ur: 'شاد باغ' },
  ward_ravi: { en: 'Ravi', ur: 'راوی' },
  ward_thokar_niaz_baig: { en: 'Thokar Niaz Baig', ur: 'ٹھوکر نیاز بیگ' },
  ward_wagha: { en: 'Wagha', ur: 'واہگہ' },
  ward_gulshan_ravi: { en: 'Gulshan Ravi', ur: 'گلشن راوی' },

  // Header / navigation
  nav_home: { en: 'Home', ur: 'ہوم' },
  nav_map: { en: 'Map', ur: 'نقشہ' },
  nav_track: { en: 'Track', ur: 'ٹریک کریں' },
  nav_report: { en: 'Report', ur: 'اطلاع دیں' },
  nav_my_issues: { en: 'My Issues', ur: 'میری شکایات' },
  nav_my_dashboard: { en: 'My Dashboard', ur: 'میرا ڈیش بورڈ' },
  nav_dashboard: { en: 'Dashboard', ur: 'ڈیش بورڈ' },
  nav_flagged: { en: 'Flagged', ur: 'فلیگ شدہ' },
  nav_analytics: { en: 'Analytics', ur: 'تجزیات' },
  nav_login: { en: 'Login', ur: 'لاگ اِن' },
  nav_register: { en: 'Register', ur: 'رجسٹر کریں' },
  nav_logout: { en: 'Logout', ur: 'لاگ آؤٹ' },
  nav_report_hazard: { en: 'Report Hazard', ur: 'خطرے کی اطلاع دیں' },
  nav_my_complaints: { en: 'My Complaints', ur: 'میری شکایات' },
  app_name: { en: 'Road Safety Pakistan', ur: 'روڈ سیفٹی پاکستان' },
  nav_open_menu: { en: 'Open navigation menu', ur: 'نیویگیشن مینو کھولیں' },
  nav_close_menu: { en: 'Close navigation menu', ur: 'نیویگیشن مینو بند کریں' },

  // Footer
  footer_about: {
    en: 'AI-powered civic technology platform for reporting and tracking road hazards in Lahore, Pakistan.',
    ur: 'لاہور، پاکستان میں سڑکوں کے خطرات کی اطلاع دینے اور انہیں ٹریک کرنے کے لیے مصنوعی ذہانت پر مبنی شہری پلیٹ فارم۔',
  },
  footer_quick_links: { en: 'Quick Links', ur: 'فوری روابط' },
  footer_live_map: { en: 'Live Map', ur: 'لائیو نقشہ' },
  footer_track_complaint: { en: 'Track Complaint', ur: 'شکایت ٹریک کریں' },
  footer_contact: { en: 'Contact', ur: 'رابطہ' },
  footer_location: { en: 'Lahore, Pakistan', ur: 'لاہور، پاکستان' },
  footer_rights: { en: '© 2026 Road Safety Pakistan. All rights reserved.', ur: '© 2026 روڈ سیفٹی پاکستان۔ جملہ حقوق محفوظ ہیں۔' },

  // Upvote button
  upvote_add: { en: 'Upvote this complaint', ur: 'اس شکایت کی تائید کریں' },
  upvote_remove: { en: 'Remove upvote', ur: 'تائید واپس لیں' },

  // Voice input
  voice_unsupported: {
    en: 'Voice input needs Chrome or Edge. You can type your description below.',
    ur: 'آواز سے لکھنے کے لیے کروم یا ایج براؤزر درکار ہے۔ آپ نیچے اپنی تفصیل ٹائپ کر سکتے ہیں۔',
  },
  voice_stop: { en: 'Stop', ur: 'روکیں' },
  voice_speak: { en: 'Speak instead', ur: 'بول کر بتائیں' },
  voice_language: { en: 'Dictation language', ur: 'بولنے کی زبان' },
  voice_listening: { en: 'Listening…', ur: 'سن رہا ہے…' },
  voice_listening_sr: { en: 'Listening. Speak your description now.', ur: 'سن رہا ہے۔ اب اپنی تفصیل بولیں۔' },
  voice_error_denied: {
    en: 'Microphone permission was denied. You can still type your description.',
    ur: 'مائیکروفون کی اجازت نہیں دی گئی۔ آپ اپنی تفصیل ٹائپ کر سکتے ہیں۔',
  },
  voice_error_unavailable: {
    en: 'Speech recognition is unavailable right now. Please type instead.',
    ur: 'آواز کی شناخت اس وقت دستیاب نہیں۔ براہِ کرم ٹائپ کریں۔',
  },

  // Home page
  home_hero_title: { en: 'Make Our Roads Safer, Together.', ur: 'آئیے مل کر اپنی سڑکیں محفوظ بنائیں۔' },
  home_hero_subtitle: {
    en: 'Photograph a road hazard, report it in Urdu or English, and follow it until it is fixed.',
    ur: 'سڑک کے خطرے کی تصویر لیں، اردو یا انگریزی میں اطلاع دیں، اور اس کے ٹھیک ہونے تک اس پر نظر رکھیں۔',
  },
  home_report_hazard: { en: 'Report a hazard', ur: 'خطرے کی اطلاع دیں' },
  home_view_live_map: { en: 'View Live Map', ur: 'لائیو نقشہ دیکھیں' },
  home_report_now: { en: 'Report Now', ur: 'ابھی اطلاع دیں' },
  home_total_complaints: { en: 'Total Complaints', ur: 'کل شکایات' },
  home_resolved: { en: 'Resolved', ur: 'حل شدہ' },
  home_pending: { en: 'Pending', ur: 'زیرِ التوا' },
  home_avg_resolution: { en: 'Avg. Resolution', ur: 'اوسط حل کا وقت' },
  home_reported_in_lahore: { en: 'Reported in Lahore', ur: 'لاہور میں رپورٹ شدہ' },
  home_view_all: { en: 'View all', ur: 'سب دیکھیں' },
  home_no_hazards: { en: 'No hazards reported yet. Be the first.', ur: 'ابھی تک کوئی خطرہ رپورٹ نہیں ہوا۔ پہل آپ کریں۔' },
  home_key_features: { en: 'Key Features', ur: 'اہم خصوصیات' },
  home_features_subtitle: {
    en: 'Everything you need to report, track, and resolve road hazards in your community.',
    ur: 'اپنے علاقے میں سڑکوں کے خطرات کی اطلاع دینے، انہیں ٹریک کرنے اور حل کروانے کے لیے سب کچھ ایک جگہ۔',
  },
  feat_ai_title: { en: 'AI Hazard Detection', ur: 'مصنوعی ذہانت سے خطرے کی نشاندہی' },
  feat_ai_desc: {
    en: 'Our YOLOv8 model automatically detects potholes, open manholes, broken speed bumps, and garbage with 80.8% accuracy.',
    ur: 'ہمارا YOLOv8 ماڈل گڑھوں، کھلے مین ہولز، ٹوٹے اسپیڈ بریکرز اور کچرے کی 80.8٪ درستگی کے ساتھ خودکار نشاندہی کرتا ہے۔',
  },
  feat_ai_trained: { en: 'YOLOv8s, trained on 5,364 images of Lahore roads.', ur: 'YOLOv8s، لاہور کی سڑکوں کی 5,364 تصاویر پر تربیت یافتہ۔' },
  feat_ai_accuracy: { en: 'Detection accuracy per class (mAP50).', ur: 'ہر قسم کے لیے نشاندہی کی درستگی (mAP50)۔' },
  feat_map_title: { en: 'Live Interactive Map', ur: 'لائیو انٹرایکٹو نقشہ' },
  feat_map_desc: {
    en: 'View all reported hazards on a real-time map of Lahore. Color-coded pins show urgency levels at a glance.',
    ur: 'لاہور کے براہِ راست نقشے پر تمام رپورٹ شدہ خطرات دیکھیں۔ رنگین نشانات ایک نظر میں شدت ظاہر کرتے ہیں۔',
  },
  feat_ward_title: { en: 'Ward Analytics', ur: 'وارڈ تجزیات' },
  feat_ward_desc: {
    en: 'Track complaint volumes and resolution times by ward. Hold authorities accountable with transparent performance data.',
    ur: 'ہر وارڈ میں شکایات کی تعداد اور حل کا وقت دیکھیں۔ شفاف کارکردگی کے اعداد و شمار سے اداروں کو جوابدہ بنائیں۔',
  },
  feat_sentiment_title: { en: 'Sentiment Analysis', ur: 'جذبات کا تجزیہ' },
  feat_sentiment_desc: {
    en: 'Our system analyzes your complaint description in Urdu or English to boost urgency scores automatically.',
    ur: 'ہمارا نظام اردو یا انگریزی میں لکھی آپ کی شکایت کا تجزیہ کر کے شدت کا اسکور خودکار طور پر بڑھاتا ہے۔',
  },
  feat_urgency_title: { en: 'Auto Urgency Scoring', ur: 'خودکار شدت اسکورنگ' },
  feat_urgency_desc: {
    en: 'Hazard type, sentiment, and keywords combine to generate urgent prioritization for admins.',
    ur: 'خطرے کی قسم، جذبات اور کلیدی الفاظ مل کر منتظمین کے لیے ترجیح طے کرتے ہیں۔',
  },
  feat_secure_title: { en: 'Secure & Private', ur: 'محفوظ اور نجی' },
  feat_secure_desc: {
    en: 'JWT-based authentication and encrypted data storage protect your personal information.',
    ur: 'JWT پر مبنی تصدیق اور خفیہ کردہ ڈیٹا اسٹوریج آپ کی ذاتی معلومات کی حفاظت کرتے ہیں۔',
  },
  home_how_it_works: { en: 'How It Works', ur: 'یہ کیسے کام کرتا ہے' },
  home_how_subtitle: { en: 'Three simple steps from photo to resolution.', ur: 'تصویر سے حل تک تین آسان مراحل۔' },
  step_upload_title: { en: 'Upload Photo', ur: 'تصویر اپ لوڈ کریں' },
  step_upload_desc: {
    en: 'Take a photo of the road hazard and provide a description in Urdu or English.',
    ur: 'سڑک کے خطرے کی تصویر لیں اور اردو یا انگریزی میں تفصیل لکھیں۔',
  },
  step_ai_title: { en: 'AI Analysis', ur: 'مصنوعی ذہانت کا تجزیہ' },
  step_ai_desc: {
    en: 'Our YOLOv8 model analyzes the image and identifies the hazard type with confidence scores.',
    ur: 'ہمارا YOLOv8 ماڈل تصویر کا تجزیہ کر کے اعتماد کے اسکور کے ساتھ خطرے کی قسم پہچانتا ہے۔',
  },
  step_priority_title: { en: 'Get Priority', ur: 'ترجیح حاصل کریں' },
  step_priority_desc: {
    en: 'Your complaint gets an urgency score and appears on the live map for admin review.',
    ur: 'آپ کی شکایت کو شدت کا اسکور ملتا ہے اور یہ منتظمین کے جائزے کے لیے لائیو نقشے پر ظاہر ہوتی ہے۔',
  },
  home_ready_title: { en: 'Ready to Make a Difference?', ur: 'تبدیلی لانے کے لیے تیار ہیں؟' },
  home_ready_subtitle: {
    en: "Join thousands of citizens helping make Lahore's roads safer. Report hazards, track progress, and hold authorities accountable.",
    ur: 'لاہور کی سڑکوں کو محفوظ بنانے میں مدد کرنے والے ہزاروں شہریوں کے ساتھ شامل ہوں۔ خطرات کی اطلاع دیں، پیش رفت دیکھیں، اور اداروں کو جوابدہ بنائیں۔',
  },
  home_register_now: { en: 'Register Now', ur: 'ابھی رجسٹر کریں' },

  // Login page
  auth_photo_alt: { en: 'Traffic on The Mall, Lahore', ur: 'مال روڈ، لاہور پر ٹریفک' },
  login_stat_reported: { en: 'Hazards Reported', ur: 'رپورٹ شدہ خطرات' },
  login_stat_resolved: { en: 'Hazards Resolved', ur: 'حل شدہ خطرات' },
  login_welcome_back: { en: 'Welcome Back', ur: 'خوش آمدید' },
  login_subtitle: { en: 'Enter your credentials to access your dashboard.', ur: 'اپنے ڈیش بورڈ تک رسائی کے لیے اپنی معلومات درج کریں۔' },
  login_email_tab: { en: 'Email', ur: 'ای میل' },
  login_phone_tab: { en: 'Phone', ur: 'فون' },
  login_email_label: { en: 'Email Address', ur: 'ای میل ایڈریس' },
  login_phone_label: { en: 'Phone Number', ur: 'فون نمبر' },
  login_password_label: { en: 'Password', ur: 'پاس ورڈ' },
  login_show_password: { en: 'Show password', ur: 'پاس ورڈ دکھائیں' },
  login_hide_password: { en: 'Hide password', ur: 'پاس ورڈ چھپائیں' },
  login_forgot_password: { en: 'Forgot Password?', ur: 'پاس ورڈ بھول گئے؟' },
  login_button: { en: 'Login', ur: 'لاگ اِن کریں' },
  login_button_loading: { en: 'Logging in...', ur: 'لاگ اِن ہو رہا ہے...' },
  login_new_here: { en: 'New to Road Safety Pakistan?', ur: 'روڈ سیفٹی پاکستان میں نئے ہیں؟' },
  login_create_account: { en: 'Create Account', ur: 'اکاؤنٹ بنائیں' },
  login_admin_note: { en: 'Administrators sign in with this same form', ur: 'منتظمین بھی اسی فارم سے لاگ اِن کرتے ہیں' },
  login_success: { en: 'Login successful!', ur: 'لاگ اِن کامیاب!' },
  login_failed: { en: 'Login failed. Check your credentials.', ur: 'لاگ اِن ناکام۔ اپنی معلومات چیک کریں۔' },

  // Register page
  register_title: { en: 'Create Account', ur: 'نیا اکاؤنٹ بنائیں' },
  register_subtitle: { en: 'Join the community-led initiative for safer roads.', ur: 'محفوظ سڑکوں کی اس شہری مہم میں شامل ہوں۔' },
  register_full_name: { en: 'Full Name', ur: 'پورا نام' },
  register_name_placeholder: { en: 'e.g. Ahmed Khan', ur: 'مثلاً احمد خان' },
  register_email: { en: 'Email Address', ur: 'ای میل ایڈریس' },
  register_phone: { en: 'Phone Number', ur: 'فون نمبر' },
  register_id_type: { en: 'ID Type', ur: 'شناختی دستاویز کی قسم' },
  register_id_cnic: { en: 'CNIC (Computerized National ID Card)', ur: 'شناختی کارڈ (CNIC)' },
  register_id_passport: { en: 'Passport', ur: 'پاسپورٹ' },
  register_cnic_number: { en: 'CNIC Number', ur: 'شناختی کارڈ نمبر' },
  register_passport_number: { en: 'Passport Number', ur: 'پاسپورٹ نمبر' },
  register_cnic_part1: { en: 'CNIC first five digits', ur: 'شناختی کارڈ کے پہلے پانچ ہندسے' },
  register_cnic_part2: { en: 'CNIC middle seven digits', ur: 'شناختی کارڈ کے درمیانی سات ہندسے' },
  register_cnic_part3: { en: 'CNIC last digit', ur: 'شناختی کارڈ کا آخری ہندسہ' },
  register_password: { en: 'Password', ur: 'پاس ورڈ' },
  register_confirm_password: { en: 'Confirm Password', ur: 'پاس ورڈ کی تصدیق کریں' },
  register_strength_weak: { en: 'Strength: Weak. Use at least 8 characters with numbers and symbols.', ur: 'مضبوطی: کمزور۔ کم از کم 8 حروف، ہندسے اور علامات استعمال کریں۔' },
  register_strength_medium: { en: 'Strength: Medium. Use symbols for better security.', ur: 'مضبوطی: درمیانی۔ بہتر حفاظت کے لیے علامات استعمال کریں۔' },
  register_strength_strong: { en: 'Strength: Strong.', ur: 'مضبوطی: مضبوط۔' },
  register_submit: { en: 'Create Account', ur: 'اکاؤنٹ بنائیں' },
  register_submit_loading: { en: 'Creating account...', ur: 'اکاؤنٹ بن رہا ہے...' },
  register_already_have: { en: 'Already have an account?', ur: 'پہلے سے اکاؤنٹ ہے؟' },
  register_password_mismatch: { en: 'Passwords do not match', ur: 'پاس ورڈ مماثل نہیں' },
  register_cnic_invalid: { en: 'Please enter a valid CNIC in the format XXXXX-XXXXXXX-X', ur: 'براہِ کرم درست شناختی کارڈ نمبر XXXXX-XXXXXXX-X کی صورت میں درج کریں' },
  register_success: { en: 'Registration successful! Welcome!', ur: 'رجسٹریشن کامیاب! خوش آمدید!' },
  register_failed: { en: 'Registration failed. Try again.', ur: 'رجسٹریشن ناکام۔ دوبارہ کوشش کریں۔' },

  // Forgot password page
  forgot_back_to_login: { en: 'Back to Login', ur: 'لاگ اِن پر واپس جائیں' },
  forgot_title: { en: 'Reset Your Password', ur: 'پاس ورڈ ری سیٹ کریں' },
  forgot_subtitle: {
    en: 'Enter your registered email address to receive a secure recovery link.',
    ur: 'محفوظ بحالی لنک حاصل کرنے کے لیے اپنا رجسٹرڈ ای میل ایڈریس درج کریں۔',
  },
  forgot_sent: {
    en: 'Password reset instructions have been sent to your email. Check your inbox and follow the link to reset your password.',
    ur: 'پاس ورڈ ری سیٹ کرنے کی ہدایات آپ کی ای میل پر بھیج دی گئی ہیں۔ اپنا ان باکس دیکھیں اور لنک پر عمل کریں۔',
  },
  forgot_send: { en: 'Send Reset Link', ur: 'ری سیٹ لنک بھیجیں' },
  forgot_sending: { en: 'Sending...', ur: 'بھیجا جا رہا ہے...' },
  forgot_trouble: { en: 'Still having trouble?', ur: 'اب بھی مشکل پیش آ رہی ہے؟' },
  forgot_contact_support: { en: 'Contact Support', ur: 'معاونت سے رابطہ کریں' },
  forgot_success: { en: 'Check your email for reset instructions!', ur: 'ری سیٹ کی ہدایات کے لیے اپنی ای میل دیکھیں!' },
  forgot_failed: { en: 'Failed to send reset email. Try again.', ur: 'ری سیٹ ای میل نہیں بھیجی جا سکی۔ دوبارہ کوشش کریں۔' },

  // Reset password page (link from the email)
  reset_title: { en: 'Choose a New Password', ur: 'نیا پاس ورڈ منتخب کریں' },
  reset_new_password: { en: 'New Password', ur: 'نیا پاس ورڈ' },
  reset_submit: { en: 'Save New Password', ur: 'نیا پاس ورڈ محفوظ کریں' },
  reset_done: { en: 'Your password has been changed. You can now log in with it.', ur: 'آپ کا پاس ورڈ تبدیل ہو گیا ہے۔ اب آپ اس سے لاگ اِن کر سکتے ہیں۔' },
  reset_invalid_link: { en: 'This reset link is invalid or has expired. Please request a new one.', ur: 'یہ ری سیٹ لنک غلط ہے یا اس کی مدت ختم ہو چکی ہے۔ براہِ کرم نیا لنک منگوائیں۔' },

  // Track Complaint page
  track_title: { en: 'Track Your Complaint', ur: 'اپنی شکایت ٹریک کریں' },
  track_subtitle: { en: 'Search by Complaint ID or registered phone number', ur: 'شکایت نمبر یا رجسٹرڈ فون نمبر سے تلاش کریں' },
  track_id_placeholder: { en: 'Enter Complaint ID (e.g., RSP-2026-0001)', ur: 'شکایت نمبر درج کریں (مثال: RSP-2026-0001)' },
  track_phone_placeholder: { en: 'Or enter phone number', ur: 'یا فون نمبر درج کریں' },
  track_search_button: { en: 'Search', ur: 'تلاش کریں' },
  track_searching: { en: 'Searching...', ur: 'تلاش جاری ہے...' },
  track_not_found: {
    en: 'Complaint not found. Please check your Complaint ID or phone number.',
    ur: 'شکایت نہیں ملی۔ براہِ کرم اپنا شکایت نمبر یا فون نمبر چیک کریں۔',
  },
  track_phone_login: {
    en: 'Log in to look up complaints by your phone number, or search by Complaint ID.',
    ur: 'فون نمبر سے شکایات دیکھنے کے لیے لاگ اِن کریں، یا شکایت نمبر سے تلاش کریں۔',
  },
  track_not_found_id: { en: 'Complaint not found. Please check the Complaint ID.', ur: 'شکایت نہیں ملی۔ براہِ کرم شکایت نمبر چیک کریں۔' },
  track_filed_on: { en: 'Filed on {date}', ur: '{date} کو درج کی گئی' },
  track_linked_one: { en: '{n} other citizen reported this same issue nearby', ur: 'ایک اور شہری نے بھی قریب ہی یہی مسئلہ رپورٹ کیا ہے' },
  track_linked_many: { en: '{n} other citizens reported this same issue nearby', ur: '{n} دیگر شہریوں نے بھی قریب ہی یہی مسئلہ رپورٹ کیا ہے' },
  track_under_review: {
    en: 'This complaint is currently under review by our moderation team.',
    ur: 'یہ شکایت اس وقت ہماری نگران ٹیم کے زیرِ جائزہ ہے۔',
  },
  track_status_timeline: { en: 'Status Timeline', ur: 'صورتحال کی ٹائم لائن' },
  track_submitted: { en: 'Submitted', ur: 'جمع کروائی گئی' },
  track_hazard_details: { en: 'Hazard Details', ur: 'خطرے کی تفصیلات' },
  track_current_status: { en: 'Current Status', ur: 'موجودہ صورتحال' },
  track_description: { en: 'Description', ur: 'تفصیل' },
  track_type_label: { en: 'Type', ur: 'قسم' },
  track_location_label: { en: 'Location', ur: 'مقام' },
  track_ward_label: { en: 'Ward', ur: 'وارڈ' },
  track_department: { en: 'Department', ur: 'محکمہ' },
  track_estimated_resolution: { en: 'Estimated resolution', ur: 'متوقع حل' },
  track_no_estimate: { en: 'Not enough data to estimate resolution time', ur: 'حل کے وقت کا اندازہ لگانے کے لیے کافی ڈیٹا موجود نہیں' },
  track_image_comparison: { en: 'Image Comparison', ur: 'تصاویر کا موازنہ' },
  track_original_photo: { en: 'Original photo', ur: 'اصل تصویر' },
  track_annotated_photo: { en: 'AI annotated photo', ur: 'مصنوعی ذہانت کی نشان زدہ تصویر' },
  track_before_after: { en: 'Before & After', ur: 'پہلے اور بعد' },
  track_before: { en: 'Before', ur: 'پہلے' },
  track_after: { en: 'After', ur: 'بعد' },
  track_no_original: { en: 'No original photo available', ur: 'اصل تصویر دستیاب نہیں' },

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
  map_summary: { en: '{n} reported · {pct}% resolved', ur: '{n} رپورٹ شدہ · {pct}٪ حل شدہ' },
  map_view_on_map: { en: 'View on map', ur: 'نقشے پر دیکھیں' },
  map_urgency_legend: { en: 'Urgency Legend', ur: 'شدت کی علامتیں' },
  map_view_full_details: { en: 'View Full Details', ur: 'مکمل تفصیلات دیکھیں' },
  map_markers: { en: 'Markers', ur: 'نشانات' },
  map_heatmap: { en: 'Heatmap', ur: 'ہیٹ میپ' },
  map_pothole: { en: 'Pothole', ur: 'گڑھا' },
  map_manhole: { en: 'Manhole', ur: 'مین ہول' },
  map_street_light: { en: 'Street Light', ur: 'اسٹریٹ لائٹ' },
  map_encroachment: { en: 'Encroachment', ur: 'تجاوزات' },
  map_linked_nearby: { en: '{n} reports linked nearby', ur: 'قریب کی {n} رپورٹس منسلک ہیں' },
  map_linked: { en: '{n} linked', ur: '{n} منسلک' },
  map_close_preview: { en: 'Close hazard preview', ur: 'خطرے کا خلاصہ بند کریں' },
  map_preview_placeholder: { en: 'Reported hazard preview', ur: 'رپورٹ شدہ خطرے کی جھلک' },
  map_anonymous: { en: 'Anonymous Citizen', ur: 'گمنام شہری' },
  map_hazard: { en: 'Hazard', ur: 'خطرہ' },

  // Report Hazard page
  report_step_photo: { en: 'Photo', ur: 'تصویر' },
  report_step_location: { en: 'Location', ur: 'مقام' },
  report_step_details: { en: 'Details', ur: 'تفصیل' },
  report_step_review: { en: 'Review', ur: 'جائزہ' },
  report_invalid_image: { en: 'Please select a valid image file', ur: 'براہِ کرم درست تصویری فائل منتخب کریں' },
  report_location_detected: { en: 'Location detected successfully!', ur: 'مقام کامیابی سے معلوم ہو گیا!' },
  report_location_failed: { en: 'Could not detect your location. Please enter it manually.', ur: 'آپ کا مقام معلوم نہیں ہو سکا۔ براہِ کرم خود درج کریں۔' },
  report_need_photo: { en: 'Please select a photo before submitting.', ur: 'جمع کرانے سے پہلے براہِ کرم تصویر منتخب کریں۔' },
  report_need_description: { en: 'Please describe the hazard before submitting.', ur: 'جمع کرانے سے پہلے براہِ کرم خطرے کی تفصیل لکھیں۔' },
  report_under_review: { en: 'Your complaint is under review by our team.', ur: 'آپ کی شکایت ہماری ٹیم کے زیرِ جائزہ ہے۔' },
  report_submitted: { en: 'Complaint submitted successfully!', ur: 'شکایت کامیابی سے جمع ہو گئی!' },
  report_failed: { en: 'Failed to submit complaint. Try again.', ur: 'شکایت جمع نہیں ہو سکی۔ دوبارہ کوشش کریں۔' },
  report_thanks: { en: 'Thank You!', ur: 'شکریہ!' },
  report_thanks_body: {
    en: "Your complaint has been submitted successfully. You'll be redirected to track your complaint.",
    ur: 'آپ کی شکایت کامیابی سے جمع ہو گئی ہے۔ آپ کو شکایت ٹریک کرنے کے صفحے پر بھیجا جا رہا ہے۔',
  },
  report_upload_photo: { en: 'Upload Photo', ur: 'تصویر اپ لوڈ کریں' },
  report_upload_aria: { en: 'Upload a photo of the hazard. JPG or PNG, up to 10 megabytes.', ur: 'خطرے کی تصویر اپ لوڈ کریں۔ JPG یا PNG، زیادہ سے زیادہ 10 میگا بائٹ۔' },
  report_take_photo: { en: 'Take or choose a photo', ur: 'تصویر لیں یا منتخب کریں' },
  report_click_upload: { en: 'Click to upload or drag and drop', ur: 'اپ لوڈ کرنے کے لیے کلک کریں یا تصویر یہاں چھوڑیں' },
  report_file_hint: { en: 'JPG, PNG up to 10 MB', ur: 'JPG، PNG زیادہ سے زیادہ 10 MB' },
  report_uploading: { en: 'Uploading: {n}%', ur: 'اپ لوڈ ہو رہی ہے: {n}٪' },
  report_uploading_image: { en: 'Uploading image: {n}%', ur: 'تصویر اپ لوڈ ہو رہی ہے: {n}٪' },
  report_confirm_location: { en: 'Confirm Location', ur: 'مقام کی تصدیق کریں' },
  report_detect_location: { en: 'Detect My Current Location', ur: 'میرا موجودہ مقام معلوم کریں' },
  report_choose_ward: { en: 'Choose a ward...', ur: 'وارڈ منتخب کریں...' },
  report_street_address: { en: 'Street Address', ur: 'گلی / سڑک کا پتہ' },
  report_describe: { en: 'Describe the Hazard', ur: 'خطرے کی تفصیل بتائیں' },
  report_suggestion: { en: 'Suggestion:', ur: 'تجویز:' },
  report_suggest_ward: { en: '{hazard} reported in {ward} area', ur: '{ward} کے علاقے میں {hazard} کی شکایت' },
  report_suggest_local: { en: '{hazard} reported in the local area', ur: 'مقامی علاقے میں {hazard} کی شکایت' },
  report_use_this: { en: 'Use this', ur: 'یہی استعمال کریں' },
  report_desc_placeholder: { en: 'Describe the hazard, or use Speak instead above...', ur: 'خطرے کی تفصیل لکھیں، یا اوپر "بول کر بتائیں" استعمال کریں...' },
  report_review_submit: { en: 'Review & Submit', ur: 'جائزہ لیں اور جمع کرائیں' },
  report_ward: { en: 'Ward', ur: 'وارڈ' },
  report_address: { en: 'Address', ur: 'پتہ' },
  report_coords: { en: 'Coords', ur: 'نقاط' },
  report_submit: { en: 'Submit', ur: 'جمع کرائیں' },

  // Citizen Dashboard
  dash_title: { en: 'My Dashboard', ur: 'میرا ڈیش بورڈ' },
  dash_welcome: { en: 'Welcome back', ur: 'خوش آمدید' },
  dash_overview: { en: "Here's an overview of your reports.", ur: 'آپ کی شکایات کا خلاصہ درج ذیل ہے۔' },
  dash_load_failed: { en: 'Failed to load your dashboard. Please try again.', ur: 'آپ کا ڈیش بورڈ لوڈ نہیں ہو سکا۔ دوبارہ کوشش کریں۔' },
  dash_total_submitted: { en: 'Total Submitted', ur: 'کل جمع کروائی گئیں' },
  dash_resolved: { en: 'Resolved', ur: 'حل شدہ' },
  dash_in_progress: { en: 'In Progress', ur: 'جاری ہے' },
  dash_pending: { en: 'Pending', ur: 'زیرِ التوا' },
  dash_most_recent: { en: 'Most Recent Complaint', ur: 'تازہ ترین شکایت' },
  dash_hazard_report: { en: 'Hazard report', ur: 'خطرے کی رپورٹ' },
  dash_filed: { en: 'Filed: {date}', ur: 'درج کی گئی: {date}' },
  dash_no_complaints: { en: "You haven't reported any road hazards yet.", ur: 'آپ نے ابھی تک کوئی سڑک کا خطرہ رپورٹ نہیں کیا۔' },
  dash_report_first: { en: 'Report Your First Hazard', ur: 'اپنی پہلی شکایت درج کریں' },
  dash_my_locations: { en: 'My Complaint Locations', ur: 'میری شکایات کے مقامات' },
  dash_no_locations: { en: 'No complaint locations to show yet.', ur: 'ابھی دکھانے کے لیے کوئی مقام موجود نہیں۔' },

  // My Complaints
  mc_subtitle: { en: 'Track all your reported road hazards and their status', ur: 'اپنے رپورٹ کردہ تمام خطرات اور ان کی صورتحال دیکھیں' },
  mc_empty_title: { en: 'No Complaints Yet', ur: 'ابھی تک کوئی شکایت نہیں' },
  mc_score: { en: 'Score: {n}/100', ur: 'اسکور: {n}/100' },
  mc_location: { en: 'Location: {value}', ur: 'مقام: {value}' },
  mc_date: { en: 'Date: {value}', ur: 'تاریخ: {value}' },
  mc_ai: { en: 'AI: {value}', ur: 'مصنوعی ذہانت: {value}' },
  mc_analyzing: { en: 'Analyzing...', ur: 'تجزیہ جاری ہے...' },

  // Admin Dashboard
  admin_title: { en: 'Admin Dashboard', ur: 'ایڈمن ڈیش بورڈ' },
  admin_subtitle: { en: 'Triage incoming hazard reports across Lahore.', ur: 'لاہور بھر سے آنے والی خطرات کی رپورٹس کی درجہ بندی کریں۔' },
  admin_start_date: { en: 'Start Date', ur: 'آغاز کی تاریخ' },
  admin_end_date: { en: 'End Date', ur: 'اختتام کی تاریخ' },
  admin_export: { en: 'Export PDF Report', ur: 'PDF رپورٹ ڈاؤن لوڈ کریں' },
  admin_generating: { en: 'Generating report...', ur: 'رپورٹ تیار ہو رہی ہے...' },
  admin_export_failed: { en: 'Failed to generate the report. Please try again.', ur: 'رپورٹ تیار نہیں ہو سکی۔ دوبارہ کوشش کریں۔' },
  admin_total: { en: 'Total Complaints', ur: 'کل شکایات' },
  admin_flagged_review: { en: 'Flagged for Review', ur: 'جائزے کے لیے فلیگ شدہ' },
  admin_flagged_aria: { en: 'Flagged for review: {n}. Open the flagged queue.', ur: 'جائزے کے لیے فلیگ شدہ: {n}۔ فلیگ شدہ فہرست کھولیں۔' },
  admin_unassigned: { en: 'Unassigned', ur: 'تفویض نہیں' },
  th_id: { en: 'ID', ur: 'نمبر' },
  th_summary: { en: 'Summary', ur: 'خلاصہ' },
  th_department: { en: 'Department', ur: 'محکمہ' },
  th_urgency: { en: 'Urgency', ur: 'شدت' },
  th_status: { en: 'Status', ur: 'صورتحال' },
  th_action: { en: 'Action', ur: 'کارروائی' },
  th_ward: { en: 'Ward', ur: 'وارڈ' },
  th_total: { en: 'Total', ur: 'کل' },
  th_avg_days: { en: 'Avg. Days', ur: 'اوسط دن' },
  th_resolution: { en: 'Resolution %', ur: 'حل کی شرح ٪' },

  // Admin Complaint Detail
  cd_load_failed: { en: 'Failed to load complaint details', ur: 'شکایت کی تفصیلات لوڈ نہیں ہو سکیں' },
  cd_invalid_type: { en: 'Please select a JPG, PNG, or WEBP image.', ur: 'براہِ کرم JPG، PNG یا WEBP تصویر منتخب کریں۔' },
  cd_too_large: { en: 'File too large. Max size is 10MB.', ur: 'فائل بہت بڑی ہے۔ زیادہ سے زیادہ سائز 10MB ہے۔' },
  cd_upload_failed: { en: 'Failed to upload the after photo. Status was not changed.', ur: 'بعد کی تصویر اپ لوڈ نہیں ہو سکی۔ صورتحال تبدیل نہیں کی گئی۔' },
  cd_updated: { en: 'Complaint updated successfully!', ur: 'شکایت کامیابی سے اپ ڈیٹ ہو گئی!' },
  cd_update_failed: { en: 'Failed to update complaint', ur: 'شکایت اپ ڈیٹ نہیں ہو سکی' },
  cd_hazard_analysis: { en: 'Hazard Analysis', ur: 'خطرے کا تجزیہ' },
  cd_detected_classes: { en: 'Detected Classes', ur: 'شناخت شدہ اقسام' },
  cd_confidence: { en: 'Confidence Scores', ur: 'اعتماد کے اسکور' },
  cd_description_sentiment: { en: 'Description & Sentiment', ur: 'تفصیل اور جذبات' },
  cd_sentiment: { en: 'Sentiment Analysis', ur: 'جذبات کا تجزیہ' },
  cd_keywords: { en: 'Keywords Found', ur: 'ملنے والے کلیدی الفاظ' },
  cd_location_details: { en: 'Location Details', ur: 'مقام کی تفصیلات' },
  cd_coordinates: { en: 'Coordinates', ur: 'نقاط' },
  cd_urgency_score: { en: 'Urgency Score', ur: 'شدت کا اسکور' },
  cd_update_status: { en: 'Update Status', ur: 'صورتحال تبدیل کریں' },
  cd_after_prompt: { en: 'Upload an "after" photo showing the resolved hazard', ur: 'حل شدہ خطرے کی "بعد" والی تصویر اپ لوڈ کریں' },
  cd_current_after: { en: 'Current after photo:', ur: 'موجودہ بعد کی تصویر:' },
  cd_select_after: { en: 'Click to select after photo', ur: 'بعد کی تصویر منتخب کرنے کے لیے کلک کریں' },
  cd_uploading_after: { en: 'Uploading after photo...', ur: 'بعد کی تصویر اپ لوڈ ہو رہی ہے...' },
  cd_after_optional: { en: 'Optional, but recommended when marking a complaint resolved.', ur: 'اختیاری، لیکن شکایت کو حل شدہ قرار دیتے وقت تجویز کردہ۔' },
  cd_notes: { en: 'Admin notes', ur: 'ایڈمن نوٹس' },
  cd_notes_placeholder: { en: 'Admin notes...', ur: 'ایڈمن نوٹس...' },
  cd_uploading_photo: { en: 'Uploading Photo...', ur: 'تصویر اپ لوڈ ہو رہی ہے...' },
  cd_save: { en: 'Save Changes', ur: 'تبدیلیاں محفوظ کریں' },
  cd_metadata: { en: 'Metadata', ur: 'اضافی معلومات' },
  cd_reported: { en: 'Reported', ur: 'رپورٹ کی تاریخ' },
  cd_reporter: { en: 'Reporter', ur: 'رپورٹ کنندہ' },
  cd_citizen: { en: 'Citizen', ur: 'شہری' },

  // Admin Flagged Queue
  fq_title: { en: 'Flagged Review Queue', ur: 'فلیگ شدہ شکایات کی فہرست' },
  fq_subtitle: {
    en: 'Complaints auto-flagged by spam detection. Approve to make visible, or reject to remove.',
    ur: 'اسپام کی خودکار جانچ سے فلیگ ہونے والی شکایات۔ ظاہر کرنے کے لیے منظور کریں، یا ہٹانے کے لیے مسترد کریں۔',
  },
  fq_load_failed: { en: 'Failed to load flagged complaints', ur: 'فلیگ شدہ شکایات لوڈ نہیں ہو سکیں' },
  fq_approved: { en: 'Complaint {id} approved', ur: 'شکایت {id} منظور کر لی گئی' },
  fq_approve_failed: { en: 'Failed to approve complaint', ur: 'شکایت منظور نہیں ہو سکی' },
  fq_reject_confirm: {
    en: 'Reject and remove complaint {id}? This will mark it as rejected.',
    ur: 'شکایت {id} مسترد کر کے ہٹا دیں؟ اسے مسترد شدہ قرار دیا جائے گا۔',
  },
  fq_rejected: { en: 'Complaint {id} rejected', ur: 'شکایت {id} مسترد کر دی گئی' },
  fq_reject_failed: { en: 'Failed to reject complaint', ur: 'شکایت مسترد نہیں ہو سکی' },
  fq_all_clear: { en: 'All Clear', ur: 'سب ٹھیک ہے' },
  fq_none: { en: 'No flagged complaints awaiting review.', ur: 'جائزے کے لیے کوئی فلیگ شدہ شکایت موجود نہیں۔' },
  fq_flagged: { en: 'Flagged', ur: 'فلیگ شدہ' },
  fq_no_summary: { en: 'No summary', ur: 'کوئی خلاصہ نہیں' },
  fq_reason: { en: 'Flag reason:', ur: 'فلیگ کی وجہ:' },
  fq_submitted: { en: 'Submitted', ur: 'جمع کی تاریخ' },
  fq_approve: { en: 'Approve', ur: 'منظور کریں' },
  fq_reject: { en: 'Reject', ur: 'مسترد کریں' },

  // Admin Ward Analytics
  wa_title: { en: 'Ward Performance Analytics', ur: 'وارڈ کی کارکردگی کا تجزیہ' },

  // Language toggle
  language_toggle: { en: 'اردو', ur: 'English' },
  language_toggle_aria: { en: 'اردو میں تبدیل کریں', ur: 'Switch to English' },
}

export function translate(language, key, vars) {
  const entry = translations[key]
  let text = entry ? (entry[language] || entry.en) : key
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replaceAll(`{${name}}`, value)
    }
  }
  return text
}

// Turn a backend value ("In Progress", "open_manhole", "Roads & Infrastructure")
// into the suffix of a dictionary key ("in_progress", "open_manhole", "roads_infrastructure").
const toKeySuffix = (value) =>
  String(value).toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')

// Translate a dynamic value under a key prefix, e.g. ('status', 'in_progress').
// Values with no translation are shown as they came from the server.
export function translateValue(language, prefix, value) {
  if (value === null || value === undefined || value === '') return value
  const key = `${prefix}_${toKeySuffix(value)}`
  return translations[key] ? translate(language, key) : value
}
