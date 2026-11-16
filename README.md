# 🚗 RideProfit LK (ශ්‍රී ලංකා)

> **Driver Earnings & Profit Optimizer** tailored specifically for Sri Lankan ride-hailing drivers (PickMe & Uber) to calculate real trip profitability, log daily net earnings, factor in fuel and vehicle maintenance costs, and track leasing goals.

---

## 🌟 Key Features

### 1. ⚡ Live Hire Check (ක්ෂණික හයර් ඇගයුම)
- **Instant Real-Time Evaluation:** Auto-evaluates as you type Fare, Pickup KM, and Trip KM (zero button clicks required).
- **Clear Visual Verdict:**
  - `PROFITABLE — ACCEPT (ලාභයි - භාරගන්න)` (Emerald Green)
  - `LOW PROFIT / LOSS — REJECT (පාඩුයි - Reject කරන්න)` (Rose Red)
- **Math Breakdown:** Shows Net Take-Home Profit (LKR), Profit per KM (LKR/km), Operating Costs, and Minimum Recommended Fare to break even.
- **App Commission:** Configurable commission rate (default: `15%`, with `0%`, `10%`, `15%`, `20%` quick presets).
- **Empty Return Toggle:** Factor in returning empty without a passenger (doubles distance cost).

### 2. 📊 Today's Profit Tracker (දවසේ ලාභය)
- **Summary Dashboard:** Big display of Net Profit (LKR), Gross Earnings, Total Distance (km), Fuel Cost, and Maintenance Cost.
- **Daily Leasing / Target Progress Bar:** Visual progress tracking against your daily financial goal (e.g., LKR 1,600 or 4,000/day) showing percentage, remaining amount needed, or target reached celebration.
- **Single Hire Logger:**
  - Fast selection between `📱 App (PickMe / Uber)` and `💵 Road Pickup (Cash 100%)`.
  - Direct entry of net earnings and distance.
  - Round trip toggle.
  - Per-day trip log with time, category, distance, and net profit per trip.
- **End-of-Day Bulk Calculator:**
  - Compute total day profit by entering Total App Earnings + Cash Pickups.
  - Distance via Direct KM or **Start & End Odometer Readings** (auto-calculates distance).

### 3. 📅 Past Days History & Monthly Summary (පසුගිය දින වාර්තා)
- **Monthly Net Profit Card:** Real-time calculation of this month's total net profit, monthly gross earnings, distance, and trip count.
- **Daily Log Archive:** Interactive list of previous tracked days saved in `localStorage`.

### 4. ⚙️ Vehicle & Fuel Cost Settings (සැකසුම්)
- **Vehicle Presets:**
  - **Motorbike (මෝටර් බයිසිකලය):** 47 km/L, LKR 320/L, LKR 4.00/km maintenance.
  - **Three-Wheeler (ත්‍රී වීලරය):** 22 km/L, LKR 320/L, LKR 4.50/km maintenance.
- **Customizable:** Freely adjust fuel efficiency, petrol price (LKR/L), maintenance cost (LKR/km), and daily leasing target.
- **Live Running Cost Metric:** Automatically computes Fuel Cost/km and Total Running Cost/km.

### 5. 🌙 Dark Mode & Mobile-First Design
- **Night-Drive Optimized:** High-contrast OLED dark palette (`#090D16`) eliminating screen glare while driving at night.
- **Bilingual (සිංහල / English):** One-tap language toggle in the header with authentic Sri Lankan driver terminology.
- **PWA Ready:** Includes `manifest.json` for "Add to Home Screen" installation on Android and iOS.

---

## 🛠️ Tech Stack

- **Framework:** React 19 (Vite)
- **Styling:** Tailwind CSS v4
- **Icons:** `lucide-react`
- **Fonts:** Plus Jakarta Sans & Noto Sans Sinhala
- **Storage:** Browser `localStorage` (100% private, zero backend dependencies)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/Dlanka/ride-profit.git

# Navigate to project directory
cd ride-profit

# Install dependencies
npm install

# Start development server
npm run dev
```

### Production Build

```bash
npm run build
```
The static bundle will be built in the `dist/` directory, ready to be deployed on **Vercel**, **Cloudflare Pages**, or **GitHub Pages**.

---

## 📄 License
MIT License. Built for Sri Lankan ride-hailing drivers.
