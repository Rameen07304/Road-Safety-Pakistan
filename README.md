# 🚦 Road Safety Pakistan

> AI-powered civic tech platform for Lahore citizens
> to report road hazards and hold authorities accountable.

![Python](https://img.shields.io/badge/Python-3.10+-blue)
![Django](https://img.shields.io/badge/Django-4.2.7-green)
![React](https://img.shields.io/badge/React-18-61DAFB)
![YOLOv8](https://img.shields.io/badge/YOLOv8s-mAP50%3A0.808-orange)

---

## 📋 Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Model Performance](#model-performance)
- [Prerequisites](#prerequisites)
- [Complete Setup Guide](#complete-setup-guide)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Team](#team)

---

## ✨ Features
- 📸 Photo upload with YOLOv8 AI hazard detection
- 🧠 Roman Urdu + English sentiment analysis
- 🗺️ Live complaint map (OpenStreetMap + Leaflet)
- 📊 Ward performance accountability dashboard
- 🔍 Real-time complaint tracking by ID or phone
- 🏛️ Government admin dashboard with urgency sorting
- 🔐 JWT authentication (Citizen + Admin roles)
- ☁️ Cloudinary image storage

---

## 🛠️ Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | React 18 + Vite + Tailwind CSS    |
| Backend    | Django 4.2 + Django REST Framework|
| AI Model   | YOLOv8s (trained on 5,364 images) |
| Auth       | JWT via SimpleJWT                 |
| Images     | Cloudinary (free tier)            |
| Maps       | OpenStreetMap + Leaflet (free)    |
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

---

## ✅ Prerequisites

Before you begin make sure you have these installed.
Click each link for the official download page:

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
git clone https://github.com/Rameen07304/road-safety-pakistan.git
cd road-safety-pakistan
```

---

### Step 2 — Get the AI Model (best.pt)

The trained YOLOv8 model is NOT stored in GitHub
(too large). Download it manually:

1. Download `best.pt` from this Google Drive link:
   👉 **[Download best.pt — 22.5MB](https://drive.google.com/file/d/1G8ZBM8kwnXf4ROJbr2dSXD0KKHuVUKjw/view?usp=drive_link)**

2. Place it in the correct folder:
road-safety-pakistan/
└── backend/
└── ml_models/
└── best.pt   ← place it here

3. Verify it is in the right place:
```bash
   # You should see best.pt listed
   ls backend/ml_models/
```

