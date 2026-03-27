# Weather Dashboard — Project Spec

## Overview

Build a **real-time weather dashboard** as a static webpage that fetches data from the OpenWeatherMap API. The dashboard uses a **dark glassmorphism aesthetic** — frosted glass cards over dynamic animated weather backgrounds. It should feel immersive, polished, and alive.

---

## File Structure

```
weather-dashboard/
├── index.html
├── css/
│   ├── style.css          # Layout, glassmorphism cards, typography, responsive
│   └── weather-effects.css # Weather particle animations, backgrounds, transitions
├── js/
│   ├── app.js             # Main app logic, state management, DOM updates
│   ├── api.js             # All OpenWeatherMap API calls (current, forecast, AQI, geocoding)
│   ├── weather-effects.js # Canvas/CSS particle system (rain, snow, sun, fog, lightning)
│   └── utils.js           # Helpers: unit conversion, date/time formatting, clothing logic
└── assets/
    └── (any static icons or SVGs if needed)
```

---

## OpenWeatherMap Account & API Key

We are on the **Free** subscription tier of OpenWeatherMap.

**API Key**: `e8c7cee3a1dc772dd77955d32c61bd31`

The API key will be stored as a constant in `api.js`. This is acceptable for a free-tier learning project per the assignment instructions.

```js
const API_KEY = 'e8c7cee3a1dc772dd77955d32c61bd31';
```

**Important — the key may take up to 2 hours to activate after account creation.** If API calls return 401 errors, the key isn't active yet — just wait and try again.

### Free Tier Limitations

Per OpenWeatherMap's documentation:
- **16-day daily forecast is NOT available** on the free plan.
- **History API is NOT available** on the free plan.
- The free tier is **rate limited** (60 calls/minute).
- Only basic weather data endpoints are accessible.

This means we must use the **5-Day / 3-Hour Forecast** endpoint (which IS available on free) rather than any daily or extended forecast endpoint.

### API Endpoint & Endpoints to Use

**Base endpoint**: `api.openweathermap.org`

Example call format per OpenWeatherMap:
```
api.openweathermap.org/data/2.5/weather?q=London,uk&APPID=e8c7cee3a1dc772dd77955d32c61bd31
```

All endpoints below are confirmed available on the free tier:

1. **Current Weather**: `https://api.openweathermap.org/data/2.5/weather?q={city}&appid={key}&units={units}`
2. **5-Day / 3-Hour Forecast**: `https://api.openweathermap.org/data/2.5/forecast?q={city}&appid={key}&units={units}`
3. **Air Pollution**: `https://api.openweathermap.org/data/2.5/air_pollution?lat={lat}&lon={lon}&appid={key}`
4. **Geocoding** (city name → coordinates): `https://api.openweathermap.org/geo/1.0/direct?q={city}&limit=1&appid={key}`
5. **Reverse Geocoding** (coordinates → city name): `https://api.openweathermap.org/geo/1.0/reverse?lat={lat}&lon={lon}&limit=1&appid={key}`

**Useful links**:
- API documentation: https://openweathermap.org/api
- Plan details & pricing: https://openweathermap.org/price

**Flow**: For a city search, first call Current Weather (which returns lat/lon), then use those coordinates for AQI. The Forecast endpoint can use the city name directly.

**Note on rate limiting**: Since we're on the free tier (60 calls/min), be mindful that each city search triggers 3 API calls (current + forecast + AQI). In comparison mode, that doubles to 6 calls. Unit toggling also re-fetches. Avoid unnecessary re-fetches where possible.

---

## Core Requirements (from the assignment)

### 1. City Search
- Text input with a "Get Weather" button
- Also trigger search on Enter key press
- Display the city name and country code in results (e.g., "Omaha, US")
- Handle invalid city names gracefully with a user-friendly error message

### 2. Current Weather Display
- City name + country
- Weather condition description (e.g., "Clear Sky", "Light Rain")
- Weather icon from OpenWeatherMap (use `https://openweathermap.org/img/wn/{icon}@2x.png`)
- Temperature (large, prominent)
- Humidity percentage
- Wind speed
- "Last updated" timestamp

### 3. Temperature Unit Toggle
- Radio buttons or toggle switch for Celsius / Fahrenheit
- Changing the unit should **re-fetch data** with the correct `units` parameter (`metric` or `imperial`) — do NOT just convert client-side, because wind speed units also change (m/s vs mph)
- Persist the user's preference for the session

### 4. 5-Day Forecast
- **Use the 5-Day / 3-Hour Forecast endpoint** (`/data/2.5/forecast`) — this is the only forecast endpoint available on the free tier. Do NOT use any daily or 16-day forecast endpoint (those require a paid plan).
- Show 5 days below the current weather card
- Each day shows: day name, date, weather icon, high temp, low temp
- **Expandable**: clicking a day reveals the 3-hour breakdown for that day with time, temp, weather icon, and condition text
- Calculate daily high/low by aggregating the 3-hour data points for each day

---

## Enhancements

### Enhancement 1: Dynamic Weather Backgrounds + Particle Effects

The entire page background changes based on the **primary city's** current weather condition. This is the signature visual feature.

**Implementation**:
- Use an HTML5 `<canvas>` element (full-screen, behind everything) for particle effects
- Layer a CSS gradient on top of / behind the canvas that shifts with weather + time of day

**Weather-to-Effect Mapping**:

| Condition Code Range | Background | Particles |
|---|---|---|
| 800 (Clear) — Daytime | Warm gradient (golden-blue) | Floating light rays / sun motes |
| 800 (Clear) — Nighttime | Deep navy-to-black | Twinkling stars |
| 801-804 (Clouds) | Muted gray-blue gradient | Slow drifting cloud wisps |
| 300-321 (Drizzle) | Dark blue-gray | Light, sparse rain drops |
| 500-531 (Rain) | Dark steel blue | Dense rain streaks, faster |
| 600-622 (Snow) | Cool white-blue-gray | Drifting snowflakes (varying sizes) |
| 200-232 (Thunderstorm) | Near-black with purple tint | Rain + periodic screen flash (lightning) |
| 701-781 (Atmosphere/Fog) | Pale gray, low contrast | Slow-moving fog/haze layers |

**Day/Night Detection**: Use `sunrise` and `sunset` from the current weather response. Compare against the city's current time (`dt` + `timezone` offset) to determine if it's day or night, and shift the gradient palette accordingly.

**Transitions**: When the user searches a new city, smoothly crossfade between background states over ~1.5 seconds.

### Enhancement 2: Geolocation Auto-Detect

- On page load, use `navigator.geolocation.getCurrentPosition()` to get the user's coordinates
- Call the Reverse Geocoding API to get the city name
- Automatically populate and search for that city's weather
- Show a 📍 location button in the search bar that re-triggers geolocation
- If the user denies location permission, gracefully default to an empty state with the search input focused and a subtle prompt like "Search for a city to get started"

### Enhancement 3: Wind Compass

- An SVG-based compass rose (N/S/E/W markers)
- An animated needle that rotates to point in the wind direction (use the `wind.deg` value from the API)
- Display wind speed numerically below the compass
- The needle rotation should animate smoothly when data updates
- Place this in the "details" section of the main weather card

### Enhancement 4: Sunrise/Sunset Arc

- A semicircular SVG arc representing the sky from sunrise to sunset
- The sun is a glowing dot positioned along the arc based on current time relative to sunrise/sunset
- Sunrise time labeled on the left, sunset time labeled on the right
- If it's nighttime, show a moon icon instead and indicate time until next sunrise
- Place this alongside or below the wind compass in the details section

### Enhancement 5: Air Quality Index (AQI)

- Call the Air Pollution API using the city's lat/lon from the current weather response
- Display as a color-coded badge on the main weather card:
  - 1 = Good (green)
  - 2 = Fair (yellow)
  - 3 = Moderate (orange)
  - 4 = Poor (red)
  - 5 = Very Poor (dark red/purple)
- On click or hover, expand to show key pollutant levels: PM2.5, PM10, O₃, NO₂
- Use a small horizontal bar or meter to visualize each pollutant level

### Enhancement 6: "What to Wear" Suggestions

- A horizontal strip below the current weather card with icon-based clothing suggestions
- Logic based on **feels-like temperature** + **weather condition** + **wind speed**:

| Condition | Suggestions |
|---|---|
| Feels like > 85°F (30°C) | Shorts, sunglasses, sunscreen, hat |
| Feels like 70–85°F (21–30°C) | Light clothing, sunglasses |
| Feels like 55–70°F (13–21°C) | Light jacket or hoodie |
| Feels like 40–55°F (4–13°C) | Warm jacket, layers |
| Feels like < 40°F (4°C) | Heavy coat, scarf, gloves, hat |
| Rain/Drizzle/Thunderstorm | Add: umbrella, waterproof jacket |
| Snow | Add: boots, heavy layers |
| Wind > 20 mph (9 m/s) | Add: windbreaker |

- Display as a row of icons (use emoji or simple SVG icons) with a short text summary like: "Light jacket + umbrella weather ☂️"

### Enhancement 7: City Comparison Mode

- A "Compare" button near the search bar
- Clicking it reveals a second search input
- Both cities display side-by-side in equal-width columns
- Each column shows: current weather card, AQI badge, what-to-wear strip, and forecast
- The **primary city** (left) controls the background particles/gradient
- On mobile, the columns stack vertically
- A close button on the comparison panel returns to single-city view

---

## Visual Design Spec

### Aesthetic: Dark Glassmorphism

**Color Palette** (CSS variables):
```css
--bg-primary: #0a0a1a;         /* Deep dark blue-black base */
--glass-bg: rgba(255, 255, 255, 0.05);
--glass-bg-hover: rgba(255, 255, 255, 0.08);
--glass-border: rgba(255, 255, 255, 0.1);
--glass-shadow: rgba(0, 0, 0, 0.3);
--text-primary: #f0f0f0;
--text-secondary: rgba(255, 255, 255, 0.6);
--accent-blue: #4fc3f7;
--accent-warm: #ffb74d;
--accent-green: #66bb6a;
--accent-red: #ef5350;
```

**Glass Card Style**:
```css
.glass-card {
    background: var(--glass-bg);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid var(--glass-border);
    border-radius: 16px;
    box-shadow: 0 8px 32px var(--glass-shadow);
}
```

**Typography**:
- Use Google Fonts. Pick something distinctive — avoid Inter/Roboto/Arial.
- Suggested pairing: **"Outfit"** (headings — geometric, clean, modern) + **"DM Sans"** (body — readable, slightly rounded)
- Temperature display should be large and bold (3rem+) with a subtle text-shadow glow
- Choose fonts that look great at both large display sizes and small label sizes

**Layout**:
- Max-width container (~1200px), centered
- Cards have generous padding (24–32px) and spacing between them (20–24px gap)
- The main weather card is the hero — largest, most prominent
- Forecast cards are smaller, in a horizontal scrollable row on mobile
- Details section (compass, sun arc, AQI expansion) uses a 2-column or 3-column grid inside the main card

**Responsive**:
- Mobile-first approach
- Below 768px: single column, forecast cards scroll horizontally, comparison stacks vertically
- The particle canvas should work at any viewport size

**Animations & Micro-interactions**:
- Cards fade in with a slight upward slide on load (staggered)
- Temperature numbers count up from 0 on update
- Forecast day expansion is a smooth height transition
- Glass cards have a subtle hover effect (slight brightness increase on border)
- Loading state: a pulsing skeleton loader styled with the glass aesthetic while API calls are in flight

---

## Error Handling

- **Invalid city**: Show a glass-styled error toast/banner — "City not found. Please check the spelling and try again."
- **API failure / network error**: Show a retry button with message — "Unable to fetch weather data. Please try again."
- **Geolocation denied**: Gracefully fall back, no error shown — just focus the search input
- **Rate limiting**: If the API returns 429, show "Too many requests. Please wait a moment."

---

## Recent Searches

- Store the last 5 searched cities in an array (in-memory, resets on page reload)
- Display as clickable pill/chip buttons below the search input
- Clicking a recent search re-fetches weather for that city
- No duplicates — if a city is searched again, move it to the front

---

## Implementation Notes

- All API calls should use `async/await` with `fetch()`
- Use `try/catch` blocks around all API calls
- The app should work with **no build tools** — plain HTML, CSS, and vanilla JS (ES6 modules are fine with `<script type="module">`)
- No external JS frameworks (no React, Vue, etc.) — vanilla JS only
- External CSS/font imports (Google Fonts) are fine
- The page should be fully functional as a static site that can be opened directly in a browser or hosted on GitHub Pages
