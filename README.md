# 🚦 Road Safety Pakistan

> AI-powered civic tech platform for Lahore citizens
> to report road hazards and hold authorities accountable.

![Python](https://img.shields.io/badge/Python-3.10+-blue)
![Django](https://img.shields.io/badge/Django-5.2-green)
![React](https://img.shields.io/badge/React-18-61DAFB)
![YOLOv8](https://img.shields.io/badge/YOLOv8s-mAP50%3A0.808-orange)

---

## 📋 Table of Contents
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Model Performance](#-model-performance)
- [Prerequisites](#-prerequisites)
- [Complete Setup Guide](#-complete-setup-guide)
- [Running the App](#-running-the-app)
- [Testing](#-testing)
- [Voice Reporting](#-voice-reporting)
- [Design System](#-design-system)
- [Project Structure](#-project-structure)
- [API Endpoints](#-api-endpoints)
- [Security Notes](#-security-notes)
- [Troubleshooting](#-troubleshooting)
- [Team](#-team)

---

## ✨ Features
- 📸 Photo upload with YOLOv8 AI hazard detection
- 🧠 Sentiment analysis in Urdu script, Roman Urdu and English
- 🗺️ Live complaint map (OpenStreetMap + Leaflet)
- 📊 Ward performance accountability dashboard
- 🔍 Real-time complaint tracking by ID or phone
- 🏛️ Government admin dashboard with urgency sorting
- 🔐 JWT authentication (Citizen + Admin roles)
- ☁️ Cloudinary image storage
- 🚩 Spam / duplicate detection (rate limits, perceptual image hashing)
- 📍 Duplicate-report clustering within a 50 m radius
- 🌐 Bilingual UI (English / اردو)
- 🎤 Voice reporting — dictate a hazard description in Urdu or English

---

## 🛠 Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | React 18 + Vite + Tailwind CSS    |
| Backend    | Django 5.2 LTS + Django REST Framework|
| AI Model   | YOLOv8s (trained on 5,364 images) |
| Auth       | JWT via SimpleJWT                 |
| Images     | Cloudinary (free tier)            |
| Maps       | OpenStreetMap + Leaflet (free)    |
| Icons      | lucide-react                      |
| Database   | SQLite (development)              |

---

## 🎯 Model Performance

| Class           | mAP50 | mAP50-95 |
|-----------------|-------|----------|
| Speed Bump      | 0.978 | 0.629    |
| Broken Manhole  | 0.921 | 0.682    |
| Open Manhole    | 0.895 | 0.665    |
| Pothole         | 0.837 | 0.482    |
| Garbage         | 0.409 | 0.169    |
| **Overall**     | **0.808** | **0.525** |

> ⚠️ The `garbage` class is significantly weaker than the rest and is the
> main candidate for retraining or dataset augmentation.

---

## ✅ Prerequisites

| Tool        | Version  | Check Command         | Download |
|-------------|----------|-----------------------|----------|
| Python      | 3.10+    | `python --version`    | [python.org](https://python.org) |
| Node.js     | 18+      | `node --version`      | [nodejs.org](https://nodejs.org) |
| npm         | 9+       | `npm --version`       | comes with Node |
| Git         | any      | `git --version`       | [git-scm.com](https://git-scm.com) |

---

## 🚀 Complete Setup Guide

### Step 1 — Clone the Repository

```bash
git clone https://github.com/Rameen07304/Road-Safety-Pakistan.git
cd Road-Safety-Pakistan
```

---

### Step 2 — Get the AI Model (best.pt)

The trained YOLOv8 model is **not** stored in GitHub (too large, and `*.pt`
is gitignored). Download it manually:

1. Download `best.pt`:
   👉 **[Download best.pt — 22.5 MB](https://drive.google.com/file/d/1G8ZBM8kwnXf4ROJbr2dSXD0KKHuVUKjw/view?usp=drive_link)**

2. Place it here:

   ```
   Road-Safety-Pakistan/
   └── backend/
       └── ml_models/
           └── best.pt   ← place it here
   ```

3. Verify:

   ```bash
   ls backend/ml_models/
   ```

> The app still runs without `best.pt` — `detection/detector.py` falls back to
> a hosted Hugging Face Space. If both are unavailable, complaints are saved
> with no detected classes and a correspondingly low urgency score.

---

### Step 3 — Backend Setup

```bash
cd backend

# Create and activate a virtual environment
python -m venv .venv

# Windows (PowerShell)
.venv\Scripts\Activate.ps1
# macOS / Linux
source .venv/bin/activate

# Install dependencies. Detection runs on the hosted Hugging Face model; add
# torch + ultralytics (~1.2 GB) with requirements-ml.txt only to run it locally.
pip install -r requirements.txt
```

Create your environment file:

```bash
cp .env.example .env      # Windows: copy .env.example .env
```

Then open `.env` and fill in real values. At minimum set `SECRET_KEY`, and add
your Cloudinary credentials if you want image uploads to work.

Apply migrations and create an admin (`manage.py` already defaults to
`core.settings.dev`, so no `--settings` flag is needed locally):

```bash
python manage.py migrate
python manage.py createadmin
```

`createadmin` reads `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env` and defaults
to `admin@roadsafety.pk`.

---

### Step 4 — Frontend Setup

```bash
cd ../frontend
npm install
```

---

## ▶ Running the App

Run these in **two separate terminals**.

**Terminal 1 — backend** (http://localhost:8000):

```bash
cd backend
python manage.py runserver
```

**Terminal 2 — frontend** (http://localhost:5173):

```bash
cd frontend
npm run dev
```

Then open **http://localhost:5173**.

> On Windows, Vite may bind to IPv6 only. If `127.0.0.1:5173` refuses the
> connection, use `localhost:5173`.

Optional — seed sample complaints for browsing the map and admin queue:

```bash
cd backend
python manage.py seed_browser_test
```

---

## 🧪 Testing

```bash
cd backend
python manage.py smoke_test
```

`smoke_test` covers 38 assertions across the full complaint pipeline:
department auto-assignment, PII-free summaries, duplicate clustering and
progression, rate limiting, perceptual image-hash duplicate detection, the
admin approve/reject flow, and the blur/darkness image-quality gate. It is
idempotent, so it is safe to re-run against an existing dev database.

Frontend checks:

```bash
cd frontend
npm run lint        # eslint
npm run build       # production build
```

> There is currently **no automated test suite in CI**. Porting the smoke test
> to `pytest-django` and adding a browser test run on GitHub Actions is the
> highest-value next step — several defects fixed recently (a 500 that
> discarded valid complaints, non-deterministic department routing) would have
> been caught automatically.

---

## 🎤 Voice Reporting

Citizens can dictate a hazard description instead of typing it, on step 3 of
the report flow. Literacy is a real barrier for many of the people this
platform serves, and typing Roman Urdu on a phone is slow even for those who
can — so speech keeps the core action reachable.

**How it works**

- Uses the browser's built-in Web Speech API. There is no API key, no cost, and
  no model to download.
- Urdu (`ur-PK`) is the default; English (`en-PK`) is one tap away.
- Speech appends to the field rather than replacing it, so a report can be
  spoken in several goes and then edited by hand.
- Interim results preview below the button but only final results are committed.

**Requirements and limits**

- Needs Chrome or Edge. In any other browser the control is replaced by a note
  and typing works exactly as before — nothing is gated behind speech.
- Needs a secure context: HTTPS in production, or `localhost` in development.
- Punjabi is deliberately not offered. Browser engines only support Punjabi in
  Gurmukhi (`pa-IN`), which would return the wrong script for Pakistan, where
  Punjabi is written in Shahmukhi.

**Why the sentiment analyser has Urdu-script keywords**

Dictation returns Urdu script, not Roman transliteration. The keyword lists in
`detection/sentiment.py` were Roman-only, so a spoken emergency scored
`neutral` and was triaged well below the same report typed in Roman Urdu —
under-prioritising exactly the citizens the feature exists for. The analyser
now carries Urdu-script terms alongside the Roman and English ones, and the
same report scores identically in either script.

---

## 🎨 Design System

All colours come from a single source of truth:
**`frontend/src/theme/colors.js`**.

`tailwind.config.js` imports that file, and any JavaScript needing a literal
colour (Leaflet map pins, inline SVG) imports it too — so the palette cannot
drift between the config and hand-copied hex strings.

| Token      | Purpose                                  |
|------------|------------------------------------------|
| `primary`  | Brand green, 50–900                      |
| `neutral`  | Warm greys for text and surfaces, 50–900 |
| `urgency`  | `low` / `medium` / `high` / `critical`   |
| `danger`   | Errors and destructive actions           |
| `warning`  | Cautions                                 |
| `info`     | Informational surfaces                   |
| `success`  | Positive confirmation                    |
| `accent`   | Gold highlights                          |

**Rules**

- Never use Tailwind's stock palette (`red-500`, `amber-100`, `blue-200`, …).
  Those hues do not match the tokens and cause visible drift.
- For text on a light tinted surface use the **`700`** step, not `DEFAULT`.
  Every `700`-on-`50` pair clears WCAG AA; `warning.DEFAULT` on `warning.50`
  is only 3.07:1 and fails.
- Fonts: `font-heading` (Outfit) for headings, `font-sans` (Public Sans)
  for body.

---

## 📁 Project Structure

```
Road-Safety-Pakistan/
├── backend/
│   ├── accounts/            # Custom user model, JWT auth, permissions
│   │   └── management/commands/
│   │       ├── createadmin.py
│   │       ├── seed_browser_test.py
│   │       └── smoke_test.py
│   ├── analytics/           # Dashboard stats, ward analytics, PDF reports
│   ├── complaints/          # Complaint model, clustering, spam flags, API
│   ├── detection/           # YOLOv8 inference, sentiment, urgency scoring
│   │   ├── detector.py      # Hugging Face Space + local model fallback
│   │   ├── sentiment.py     # Urdu script / Roman Urdu / English analysis
│   │   └── urgency.py       # Hazard score × sentiment multiplier
│   ├── core/settings/       # base.py / dev.py / prod.py
│   ├── ml_models/best.pt    # (downloaded separately — gitignored)
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── components/      # Header, Footer, UI primitives, Toast,
    │   │                    #   UpvoteButton, VoiceInput
    │   ├── context/         # AuthContext, LanguageContext
    │   ├── hooks/           # useDocumentTitle, useSpeechRecognition
    │   ├── pages/
    │   │   ├── public/      # Home, LiveMap, TrackComplaint
    │   │   ├── auth/        # Login, Register, ForgotPassword
    │   │   ├── citizen/     # Dashboard, MyComplaints, ReportHazard
    │   │   └── admin/       # Dashboard, ComplaintDetail, WardAnalytics,
    │   │                    #   FlaggedQueue
    │   ├── services/api.js  # Axios instance + token refresh
    │   ├── theme/colors.js  # Single source of truth for the palette
    │   ├── translations/    # English / Urdu dictionary
    │   └── utils/           # urgencyHelpers (map pin colours, labels)
    └── tailwind.config.js
```

---

## 🔌 API Endpoints

Base URL: `http://localhost:8000`

**Auth** — `/api/auth/`

| Method | Path                | Auth   | Description                    |
|--------|---------------------|--------|--------------------------------|
| POST   | `register/`         | Public | Create a citizen account       |
| POST   | `login/`            | Public | Returns access + refresh token |
| POST   | `logout/`           | User   | Blacklists the refresh token   |
| GET    | `profile/`          | User   | Current user profile           |
| POST   | `change-password/`  | User   | Change password                |
| POST   | `password-reset/`   | Public | Request a reset email          |
| POST   | `token/refresh/`    | Public | Exchange refresh for access    |

**Complaints** — `/api/complaints/`

| Method | Path                       | Auth   | Description                       |
|--------|----------------------------|--------|-----------------------------------|
| GET    | `` (list)                  | Public | All non-flagged complaints        |
| POST   | `submit/`                  | User   | File a complaint (runs detection) |
| POST   | `upload-image/`            | User   | Upload photo + early detection    |
| GET    | `map/`                     | Public | Map markers                       |
| GET    | `track/?complaint_id=…`    | Public | Track by complaint ID             |
| GET    | `my/`                      | User   | Complaints filed by current user  |
| GET    | `my-dashboard/`            | User   | Citizen dashboard summary         |
| GET    | `<complaint_id>/`          | Public | Complaint detail (reporter name and admin notes only for owner/admin) |
| POST   | `<complaint_id>/upvote/`   | User   | Upvote (one per user)             |


**Analytics** — `/api/analytics/`

| Method | Path           | Auth   | Description                     |
|--------|----------------|--------|---------------------------------|
| GET    | `summary/`     | Public | Headline stats                  |
| GET    | `hazards/`     | Public | Hazard-type breakdown           |
| GET    | `wards/`       | Admin  | Per-ward performance            |
| GET    | `trends/`      | Admin  | Complaint trends over time      |
| GET    | `report/pdf/`  | Admin  | Downloadable PDF report         |

**Admin** — `/api/admin/`

| Method | Path                              | Auth  | Description              |
|--------|-----------------------------------|-------|--------------------------|
| GET    | `complaints/flagged/`             | Admin | Flagged review queue     |
| PATCH  | `complaints/<id>/status/`         | Admin | Update complaint status  |
| POST   | `complaints/<id>/approve/`        | Admin | Clear a flag             |
| POST   | `complaints/<id>/reject/`         | Admin | Reject a flagged report  |

Django admin UI is at `/admin-rsp-secure/` (configurable via `ADMIN_URL`).

---

## 🔒 Security Notes

This repository is public. Everything below is deliberate.

**What is never committed**

`.gitignore` excludes `.env` and every `.env.*` variant at any depth, plus
`*.pem`, `*.key`, `*.p12`, `id_rsa*`, `credentials.json` and
`service-account*.json`. The single intentional exception is `.env.example`,
which holds placeholders only. No real `.env` has ever been committed on any
branch, and no secret appears anywhere in the git history.

**Configuration you must set yourself**

| Variable | Notes |
|----------|-------|
| `SECRET_KEY` | Required. `settings/base.py` raises if it is missing rather than falling back to a default. |
| `ADMIN_PASSWORD` | Required. `createadmin` refuses to run without it and never prints it. |
| `CLOUDINARY_*` | Optional locally; image uploads fail without it, complaints still save. |
| `ADMIN_URL` | The committed default gives no obscurity in a public repo — change it for a real deployment. |

**Production settings** (`core/settings/prod.py`) force `DEBUG = False`,
require `ALLOWED_HOSTS`, and enable SSL redirect, HSTS, and secure session and
CSRF cookies.

**Known gap:** `/api/auth/login/` has no rate limiting, so password attempts
are unthrottled. Add a DRF throttle before exposing this to real users.

---

## 🔧 Troubleshooting

**`ModuleNotFoundError: No module named 'cv2'`**
Dependencies are out of date. Re-run `pip install -r requirements.txt` inside
the activated virtual environment.

**`Model not found at .../ml_models/best.pt`**
Expected if you skipped Step 2. Detection falls back to the Hugging Face
Space; download `best.pt` for local inference.

**Complaint submission returns 500 / images do not appear**
Cloudinary credentials are missing or wrong in `backend/.env`. Complaints
still save (the annotated preview is skipped and logged as a warning), but
uploads through `/api/complaints/upload-image/` will fail.

**`127.0.0.1:5173` refuses to connect**
Vite may be bound to IPv6 only on Windows. Use `http://localhost:5173`.

**`UNIQUE constraint failed: accounts_user.phone`**
A user with that phone number already exists. Every one of `email`, `phone`
and `cnic` is unique on the user model.

**The "Speak instead" button does not appear**
Voice input needs Chrome or Edge and a secure context. On `localhost` it works
over plain HTTP; deployed, it requires HTTPS. Typing is always available.

**Never commit `backend/.venv/`**
It is roughly 1.2 GB across ~27,000 files. It is gitignored — keep it that way.

---

## 👥 Team

<!-- Add team members here. -->

| Name | Role |
|------|------|
|      |      |

---

## 📄 License

Academic project. All rights reserved.
