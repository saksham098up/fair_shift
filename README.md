# 🛡️ FairShift — Accessible Frontline Worker Shift & Safety Reporting Platform

> Built for the Hackathon • Ready for Google Cloud Run • Bilingual (English & हिन्दी) • WCAG AAA High Contrast

---

## 📌 Executive Summary

**FairShift** is an inclusive, mobile-first web application designed for frontline workers (manufacturing, warehousing, healthcare, hospitality) to ensure transparent shift check-ins and empower workers with an immediate, non-punitive safety hazard voice.

It features two cohesive interfaces:
1. **Worker UI (Mobile-First Portal)**: High-contrast, large touch-target interface with a prominent **'Check In / Check Out'** button, live active shift duration timer, GPS verification, and a streamlined **'Safety Hazard Report'** text box with urgency chips.
2. **Admin UI (Command Dashboard)**: Real-time operations and safety monitor featuring live KPI summary cards, auto-syncing shift logs, hazard triage board with status updates (Open → Investigating → Resolved), and CSV exports.

---

## 🏆 Hackathon Rubric Alignments

| Rubric Category | How FairShift Meets & Exceeds It |
|---|---|
| **Inclusivity** | **Bilingual toggle button (English & हिन्दी)** available on all screens. Every label, status, hazard category, button, and validation message dynamically switches with zero reload. |
| **Accessibility** | Built with **high-contrast industrial colors** (Safety Yellow `#FFDE00`, Alert Red `#EF4444`, Crisp White, Deep Charcoal Slate). Includes a dedicated **⚡ Ultra High-Contrast Mode (WCAG AAA)** toggle for visually impaired workers or high-glare warehouse environments. |
| **Worker Ergonomics** | Designed for field environments: **extra-large hit targets (>60px)** for gloved hands or small mobile screens, live visual status feedback, and quick pre-fill hazard shortcuts. |
| **Clean Architecture** | Single clean repository monorepo. Express.js REST backend serving JSON data and compiling static React + Tailwind assets in a single container. |
| **Google Cloud Run** | Multi-stage `Dockerfile` listening dynamically on `process.env.PORT || 8080`, optimized for serverless, zero-config Cloud Run deployment. |

---

## 🏗️ System Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                    Google Cloud Run Container                │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │               Node.js + Express Backend             │   │
│   │                                                     │   │
│   │   • GET /api/checkins      • POST /api/checkins    │   │
│   │   • GET /api/hazards       • POST /api/hazards     │   │
│   │   • PATCH /api/hazards/:id • POST /api/reset       │   │
│   │   • Port Binding: process.env.PORT || 8080          │   │
│   └──────────────────────────┬──────────────────────────┘   │
│                              │ Serves compiled assets        │
│   ┌──────────────────────────▼──────────────────────────┐   │
│   │              React 18 + Vite + Tailwind             │   │
│   │                                                     │   │
│   │   • Worker UI (Large Check-In & Safety Hazard)      │   │
│   │   • Admin UI (Operations Dashboard & Live Sync)     │   │
│   │   • i18n English/Hindi Language Engine              │   │
│   │   • WCAG AAA High-Contrast Accessibility Theme      │   │
│   └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Running FairShift Locally

### 1. Prerequisites
- Node.js 18+ and npm installed.

### 2. Setup & Installation
```bash
# Clone the repository
git clone <your-repo-url>
cd fair_shift_project

# Install dependencies
npm install
```

### 3. Build & Run Production Container / Server
```bash
# Build React frontend
npm run build

# Start Express server (serves API + compiled frontend)
npm run start
```
The application will be live at `http://localhost:8080`.

### 4. Development Mode (Hot Reload)
```bash
# Terminal 1: Start Backend API
node server/server.js

# Terminal 2: Start Vite Client
npm run dev
```

---

## ▲ Deploying to Vercel (Fastest & Free)

FairShift is fully configured for zero-config Vercel deployment with serverless Express API endpoints and Vite frontend:

### Method 1: Using the Vercel CLI (1-Click)
In PowerShell:
```powershell
.\deploy-vercel.bat
```
or run:
```powershell
$env:PATH = "$PWD\.tools\node-v20.18.0-win-x64;$env:PATH"
npx vercel --prod
```

### Method 2: Via GitHub / GitLab (Recommended for Hackathons)
1. Push this repository to GitHub or GitLab.
2. Go to **[vercel.com/new](https://vercel.com/new)** and import the repository.
3. Vercel will automatically read `vercel.json` (Build command: `npm run build`, Output: `dist`, Serverless API: `api/index.js`).
4. Click **Deploy** — your live HTTPS URL will be ready in under 60 seconds!

---

## ☁️ Deploying to Google Cloud Run (Alternative)

FairShift is packaged with an optimized multi-stage `Dockerfile` specifically crafted for Google Cloud Run:

```bash
# Step 1: Authenticate with Google Cloud
gcloud auth login
gcloud config set project [YOUR_GCP_PROJECT_ID]

# Step 2: Deploy directly from source to Cloud Run
gcloud run deploy fairshift \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080
```

Cloud Run will automatically build the container using the provided `Dockerfile`, provision an HTTPS endpoint, and auto-scale according to demand.

---

## 🧪 Testing the Hackathon Demo Features

1. **Language Inclusivity**:
   - Tap the **`🌐 हिन्दी`** button in the top navigation. Observe how the entire worker portal, check-in instructions, hazard categories, and admin dashboard instantly translate to Hindi.
2. **Accessibility / High Contrast**:
   - Click the **`👁️ High Contrast Mode`** toggle in the header. Notice the WCAG AAA ultra-contrast black & safety yellow theme with crisp focus outlines.
3. **Worker Check-In**:
   - In **Worker Mode**, enter a name or keep the default (`Rajesh Kumar`), then press the large **`CHECK IN TO SHIFT`** button.
   - The shift starts immediately with a live elapsed timer (`00:00:01...`), status badge, and location tag.
4. **Safety Hazard Reporting**:
   - Type a safety concern in the hazard text box (or click one of the quick shortcuts like `⚠️ Oil Spill`).
   - Choose urgency (`Critical`, `High`, `Medium`, `Low`) and click **`SUBMIT HAZARD REPORT`**.
5. **Admin Operations Triage**:
   - Click **`📊 Admin Dashboard`** in the top navigation.
   - Notice the live counters update immediately.
   - Under **Safety Hazard Reports**, click **`Mark Investigating`** or **`Resolve Issue`** to change the incident status in real time.
6. **Demo Reset**:
   - Click **`🔄 Seed Demo Data`** anytime to reload fresh test records.
