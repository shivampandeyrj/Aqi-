# 🚀 Deployment Guide — AQI to Cigarette Calculator

This guide walks you through deploying:
- **Java Spring Boot backend** → Railway (free tier)
- **Next.js frontend** → Cloudflare Pages (free tier)

---

## Architecture Overview

```
Browser → Cloudflare Pages (Next.js static site)
              ↓ API calls
        Railway / Render / Fly.io (Java Spring Boot)
              ↓ fetches AQI data
        Open-Meteo Air Quality API (free, no key)
```

---

## PART 1 — Deploy Java Backend on Railway

### Step 1 — Create a Railway account
1. Go to [railway.app](https://railway.app) and sign up (free)
2. Click **New Project**

### Step 2 — Connect your GitHub repo
1. Select **Deploy from GitHub repo**
2. Authorize Railway to access your GitHub account
3. Select your `meet-main` repository

### Step 3 — Configure the Java backend service
1. In Railway, click **Add Service → GitHub Repo**
2. Set the **Root Directory** to: `java-backend`
3. Railway auto-detects Maven (`pom.xml`) and builds the Spring Boot app
4. Go to **Settings → Variables** and add:
   ```
   PORT=8080
   ```
5. Click **Deploy**

### Step 4 — Get your backend URL
1. After deployment, go to **Settings → Networking → Generate Domain**
2. Copy your URL, e.g. `https://aqi-calculator-production.up.railway.app`

### Step 5 — Test your backend
```bash
# Test the calculate endpoint
curl -X POST https://YOUR_RAILWAY_URL/api/calculate \
  -H "Content-Type: application/json" \
  -d '{"aqi": 150}'

# Test the location endpoint (San Francisco coords)
curl "https://YOUR_RAILWAY_URL/api/aqi/location?lat=37.7749&lng=-122.4194"

# Test health check
curl "https://YOUR_RAILWAY_URL/api/health"
```

Expected response for `/api/calculate`:
```json
{
  "aqi": 150,
  "pm25": 55.4,
  "cigarettes": { "perDay": 2.52, "perWeek": 17.64, ... },
  "level": { "category": "Unhealthy for Sensitive Groups", "color": "#F97316", ... },
  "healthImpact": { "minutesLostPerDay": 27.7, "daysLostPerYear": 6.9, "riskLevel": "High" }
}
```

---

## PART 2 — Deploy Frontend on Cloudflare Pages

### Step 1 — Create a Cloudflare account
1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) and sign up (free)

### Step 2 — Connect your GitHub repo
1. Go to **Workers & Pages → Create Application → Pages → Connect to Git**
2. Authorize Cloudflare to access GitHub
3. Select your `meet-main` repository → click **Begin setup**

### Step 3 — Configure build settings
| Setting | Value |
|---|---|
| **Framework preset** | Next.js (Static HTML Export) |
| **Build command** | `npm run build` |
| **Build output directory** | `out` |
| **Root directory** | `/` (leave empty) |
| **Node.js version** | `18` or `20` |

### Step 4 — Add environment variable ⚠️ CRITICAL
1. Scroll to **Environment Variables**
2. Click **Add variable**
3. Set:
   - **Name**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://YOUR_RAILWAY_URL` (from PART 1 Step 4)
4. Apply to **Production** environment

> ⚠️ This env var MUST be set before building. The frontend bakes this URL into the static JS bundle at build time.

### Step 5 — Deploy!
1. Click **Save and Deploy**
2. Wait ~2-3 minutes for the build to complete
3. Your site will be live at `https://your-project.pages.dev`

### Step 6 — Test your deployment
1. Open your Cloudflare Pages URL
2. Click **📍 Auto-detect AQI from my location** — browser asks for location permission
3. Allow location → AQI auto-fills and calculation runs automatically
4. Manually enter AQI values and click Calculate

---

## PART 3 — Local Development

### Run Java backend locally
```bash
cd java-backend
mvn spring-boot:run
# Backend runs at http://localhost:8080
```

### Run frontend locally
```bash
# Create local env file
echo "NEXT_PUBLIC_API_URL=http://localhost:8080" > .env.local

# Install dependencies
npm install

# Start dev server
npm run dev
# Frontend at http://localhost:3000
```

### Build frontend for production
```bash
npm run build
# Generates static files in /out directory
```

---

## PART 4 — Alternative Backend Platforms

### Render (render.com)
1. New → Web Service → Connect repo
2. Root directory: `java-backend`
3. Build command: `mvn package -DskipTests`
4. Start command: `java -jar target/aqi-cigarette-calculator-1.0.0.jar`
5. Environment: Add `PORT=10000` (Render uses port 10000)

### Fly.io
1. Install flyctl: `brew install flyctl`
2. `cd java-backend && fly launch`
3. Follow prompts, fly.io auto-detects Java/Maven
4. `fly deploy`

### Run on your own server (VPS)
```bash
# 1. Build JAR locally
cd java-backend && mvn package -DskipTests

# 2. Copy to server
scp target/aqi-cigarette-calculator-1.0.0.jar user@your-server:/opt/aqi/

# 3. Run on server (with systemd for production)
java -jar /opt/aqi/aqi-cigarette-calculator-1.0.0.jar --server.port=8080

# 4. Use nginx as reverse proxy (recommended)
# Set NEXT_PUBLIC_API_URL to your server's domain
```

---

## API Reference

### POST `/api/calculate`
Calculate cigarette equivalent from AQI.

**Request:**
```json
{ "aqi": 150 }
```

**Response:**
```json
{
  "aqi": 150,
  "pm25": 55.4,
  "cigarettes": {
    "perDay": 2.52,
    "perWeek": 17.64,
    "perMonth": 75.6,
    "perYear": 919.8,
    "packsPerMonth": 3.78
  },
  "level": {
    "category": "Unhealthy for Sensitive Groups",
    "color": "#F97316",
    "healthImplications": "...",
    "cautionaryStatement": "..."
  },
  "healthImpact": {
    "minutesLostPerDay": 27.7,
    "hoursLostPerYear": 168.5,
    "daysLostPerYear": 7.0,
    "riskLevel": "High",
    "healthRisks": ["..."]
  }
}
```

### GET `/api/aqi/location?lat={lat}&lng={lng}`
Fetch real-time AQI from user coordinates (via Open-Meteo, no API key needed).

**Example:**
```bash
curl "https://YOUR_BACKEND/api/aqi/location?lat=37.7749&lng=-122.4194"
```

**Response:**
```json
{
  "aqi": 42,
  "pm25": 9.1,
  "location": "37.7749°, -122.4194°",
  "latitude": 37.7749,
  "longitude": -122.4194,
  "source": "Open-Meteo Air Quality API"
}
```

### GET `/api/health`
Health check.
```json
{ "status": "UP", "service": "AQI Cigarette Calculator API", "version": "1.0.0" }
```

---

## Troubleshooting

| Problem | Solution |
|---|---|
| CORS error in browser | Make sure `NEXT_PUBLIC_API_URL` has no trailing slash |
| Location button not working | Site must be served over HTTPS (Cloudflare handles this) |
| Backend returns 500 | Check Railway logs; ensure Java 17 is set |
| Build fails on Cloudflare | Set Node.js version to 18 or 20 in Pages settings |
| AQI always shows 0 | Open-Meteo may not have coverage for remote areas; enter AQI manually |
