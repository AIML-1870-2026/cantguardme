# NEO Close Approach Tracker — spec.md

## Project Overview

A single-page web dashboard that pulls live data from NASA/JPL APIs and presents near-Earth object (NEO) tracking data across multiple interactive tabs. The dashboard serves as both an informational planetary defense tool and an engaging experience, featuring a hidden arcade game — **Orbit Dodger** — accessible via a play button. The entire project is a single HTML file with embedded CSS/JS, no backend, no build step. All API calls happen client-side via CORS-enabled endpoints.

---

## API Configuration

### NeoWs — Near Earth Object Web Service
- **Base URL:** `https://api.nasa.gov/neo/rest/v1/`
- **API Key:** `c1gVyjytBTtRq22pO4WjUqH8E7SFoVsVIig7Rhcf`
- **Key Endpoints:**
  - `/feed?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&api_key=KEY` — returns all NEOs with close approaches in a date range (max 7 days)
  - `/neo/{asteroid_id}?api_key=KEY` — detailed data for a specific asteroid including full orbital data
- **Returns per NEO (from `/feed`):**
  - `id`, `neo_reference_id`, `name` — identifiers and designation
  - `absolute_magnitude_h` — absolute magnitude (H), a key measure of intrinsic brightness/size used by astronomers. Lower H = bigger/brighter object. H < 22 is the "potentially hazardous" size threshold (~140m+).
  - `estimated_diameter` — min/max diameter in meters, kilometers, feet, and miles
  - `is_potentially_hazardous_asteroid` — boolean flag
  - `close_approach_data[]` — array containing:
    - `close_approach_date`, `close_approach_date_full` — date and full datetime (epoch also available)
    - `relative_velocity` — in km/s, km/h, and mph
    - `miss_distance` — in km, lunar distances, AU, and miles
    - `orbiting_body` — which body it's approaching (Earth)
  - `is_sentry_object` — whether this NEO is also on the Sentry watch list (useful for cross-referencing with Tab 3)
- **Returns per NEO (from `/neo/{id}` detail endpoint):**
  - All of the above, plus:
  - `orbital_data` — full Keplerian orbital elements:
    - `orbit_class.orbit_class_type` — e.g., "Apollo", "Aten", "Amor" (asteroid family classification)
    - `orbit_class.orbit_class_description` — human-readable description of the orbit type
    - `semi_major_axis`, `eccentricity`, `inclination` — key orbital parameters
    - `orbital_period` — period in days
    - `perihelion_distance`, `aphelion_distance` — closest/farthest distance from the Sun
    - `orbit_determination_date` — when the orbit was last computed
    - `first_observation_date`, `last_observation_date` — observation arc
    - `observations_used` — number of observations used to compute the orbit (more = more reliable)

### SBDB Close-Approach Data (JPL)
- **Base URL:** `https://ssd-api.jpl.nasa.gov/cad.api`
- **No API key required**
- **Key Parameters:**
  - `date-min`, `date-max` — date range (YYYY-MM-DD, "now", or relative like "+60" for 60 days from now)
  - `dist-min`, `dist-max` — distance filter (e.g., "0.05" AU, "10LD", "0.5LD")
  - `h-min`, `h-max` — absolute magnitude filter (use to filter by size: H < 22 ≈ >140m, H < 26 ≈ >20m)
  - `diameter` — set to `true` to include estimated diameter data in results
  - `fullname` — set to `true` to return full object name (numbered designation + name if it has one, e.g., "99942 Apophis")
  - `sort` — sort field: `dist` (distance), `date`, `v-rel` (velocity), `h` (magnitude/size), `dist-min` (min possible distance)
  - `limit` — max number of results to return
  - `body` — filter by orbiting body (default Earth)
- **Returns (per close approach):**
  - `des` — object primary designation (e.g., "2024 MK")
  - `fullname` — full designation including number and name if available (when `fullname=true`)
  - `cd` — close approach date/time (TDB format)
  - `dist` — nominal miss distance (AU)
  - `dist_min`, `dist_max` — **minimum and maximum possible miss distances (AU)** based on orbit uncertainty. This is critical data — it shows the uncertainty envelope. A wide gap between dist_min and dist_max means the orbit is poorly constrained.
  - `v_rel` — relative velocity at close approach (km/s)
  - `v_inf` — velocity at infinity (km/s) — approach speed before Earth's gravity
  - `h` — absolute magnitude (H value). Lower = larger/brighter. Can be converted to approximate diameter using: `diameter_km = 1329 / sqrt(albedo) * 10^(-H/5)` (assume albedo ~0.14 for typical asteroid)
  - `diameter`, `diameter_sigma` — estimated diameter and uncertainty (when `diameter=true`)
  - `orbit_id` — orbit solution identifier
- **Important Usage Notes:**
  - Use `dist-max=0.05` (AU) to focus on close approaches within ~20 LD
  - Use `h-max=22` to filter for only larger objects (>140m estimated)
  - Combine `diameter=true&fullname=true` for richest data per result
  - The `dist_min`/`dist_max` uncertainty range should be displayed in Tab 2 to show orbit confidence

### Sentry — Impact Monitoring System (JPL)
- **Base URL:** `https://ssd-api.jpl.nasa.gov/sentry.api`
- **No API key required**
- **Key Parameters:**
  - `all=1` — return all Sentry objects (for full table in Tab 3)
  - `des={designation}` — query a specific object for detailed impact data (e.g., `?des=99942` for Apophis)
  - `h-max` — filter by max absolute magnitude (size filter)
  - `ps-min` — filter by minimum Palermo scale (risk filter)
  - `ip-min` — filter by minimum impact probability
- **Returns (per Sentry object, from `?all=1`):**
  - `des` — object designation (e.g., "2024 YR4")
  - `fullname` — full name with number if applicable
  - `diameter` — estimated diameter (km)
  - `h` — absolute magnitude (H value)
  - `ip` — cumulative impact probability (e.g., "2.2e-05" means 1 in ~45,000 chance)
  - `ps_max` — maximum Palermo scale value across all impact solutions. Palermo scale is logarithmic and relative to background risk: -2 = 1% of background, 0 = equal to background, +2 = 100x background. Anything above -2 warrants attention.
  - `ps_cum` — cumulative Palermo scale (aggregated across all solutions). Often more meaningful than ps_max for overall risk assessment.
  - `ts_max` — maximum Torino scale value (0-10 integer, the public-facing threat metric). 0 = no hazard, 1 = merits monitoring, 2-4 = merits concern, 5-7 = threatening, 8-10 = certain collision.
  - `n_imp` — number of distinct impact solutions (possible impact keyholes). More solutions doesn't mean more danger — it means more orbital uncertainty.
  - `v_inf` — approach velocity (km/s)
  - `last_obs` — **date of most recent observation** (YYYY-MM-DD). Critical context: more recent observations = better orbit determination = more reliable risk assessment. Objects with stale observations (last_obs years ago) may have artificially inflated or deflated risk.
  - `last_obs_jd` — last observation in Julian Date format
  - `range` — **full date range of possible impacts** (e.g., "2029-2124"), showing the span of years in which impact solutions exist
- **Returns (per object, from `?des={designation}` detail query):**
  - All of the above, plus:
  - `data[]` — array of individual virtual impactor (VI) solutions, each containing:
    - `date` — specific potential impact date
    - `ip` — impact probability for that specific solution
    - `ps` — Palermo scale for that specific solution
    - `ts` — Torino scale for that solution
    - `sigma_lov` — sigma value on the line of variations (lower sigma = closer to nominal orbit = more likely)
    - `dist` — distance from Earth center at impact (Earth radii)
    - `width` — width of impact keyhole (km)
    - `energy` — estimated impact energy (megatons of TNT). Directly available — no need to calculate.
  - This detail data enables a per-object deep-dive showing every possible impact window

---

## Visual Design & Aesthetic Direction

### Concept: "Deep Space Mission Control"
The dashboard should feel like you're sitting at a console inside a planetary defense operations center. Not cartoony sci-fi — more like if NASA/JPL's actual dashboards had a designer with taste. Grounded, authoritative, but visually stunning.

### Color Palette
- **Background:** Deep space black (`#05080f`) with subtle blue-tinted noise texture overlay for depth
- **Surface/Cards:** Dark gunmetal panels (`#0d1117`) with faint 1px border in muted cyan (`rgba(0, 200, 255, 0.08)`)
- **Primary accent:** Electric cyan (`#00d4ff`) — used for active states, key metrics, glowing elements
- **Danger/Hazardous:** Searing orange-red (`#ff4d2a`) — hazardous asteroids, alerts, warnings
- **Safe/Non-hazardous:** Cool teal-green (`#00e59b`) — safe objects, positive indicators
- **Secondary accent:** Muted amber (`#ffb800`) — used sparingly for highlights, badges
- **Text primary:** Off-white (`#e6edf3`)
- **Text secondary:** Muted blue-gray (`#7d8590`)
- **Glow effects:** Cyan and orange glows (`box-shadow`, `text-shadow`) applied to key data points for a neon-HUD feel. Subtle, not overdone.

### Typography
- **Display/Headings:** `'Orbitron', sans-serif` (from Google Fonts) — geometric, space-age, authoritative. Used for tab labels, section headers, the main title, big stat numbers.
- **Body/Data:** `'IBM Plex Mono', monospace` (from Google Fonts) — clean, technical, readable. Used for data tables, metric values, API-sourced text.
- **Secondary body:** `'IBM Plex Sans', sans-serif` — used for paragraph descriptions, tooltips, non-data prose.

### Layout & Composition
- Full viewport height, no scroll on main layout (content scrolls within tab panels)
- Fixed header bar at top with project title, tab navigation, and Orbit Dodger play button
- Tab panels fill remaining viewport height
- Cards/panels use CSS `backdrop-filter: blur()` glassmorphism on semi-transparent backgrounds
- Subtle animated starfield canvas behind everything (very slow-moving, low density, no distraction)
- Grid-based card layouts within tabs, responsive down to tablet width (1024px minimum)

### Motion & Micro-Interactions
- Tab transitions: smooth horizontal crossfade (150ms)
- Cards: subtle scale-up + glow intensification on hover
- Data loading: pulsing skeleton placeholders with cyan shimmer
- Stat counters: number roll-up animation when data first loads
- Countdown timer: flip-clock style digit transitions
- Starfield background: continuous subtle parallax drift

---

## Page Structure

### Fixed Header
- **Left:** Project title — "NEO TRACKER" in Orbitron, small subtitle "Planetary Defense Dashboard" underneath
- **Center:** Tab navigation buttons (icon + label for each tab)
- **Right:** 
  - Live countdown to next close approach (updating every second), formatted as `DDd HHh MMm SSs`
  - Orbit Dodger play button — a glowing pulsing icon (gamepad or crosshair icon) with tooltip "Play Orbit Dodger". On click, transitions the entire page to the game view.
- **Bottom edge of header:** A thin animated gradient line (cyan → orange → cyan) that spans the full width, subtly pulsing

---

## Tab Structure

### Tab 1: "This Week" — Weekly Close Approach Overview
**API:** NeoWs `/feed` (current 7-day window)

**Hero Stats Row (top of tab):**
Five glowing stat cards in a horizontal row:
1. **Total Approaches** — count of all NEOs this week, large number with label
2. **Closest Approach** — name + miss distance in lunar distances of the week's closest flyby
3. **Largest Object** — name + estimated max diameter in meters + H magnitude
4. **Fastest Flyby** — name + relative velocity in km/s
5. **Hazardous Count** — number flagged as potentially hazardous this week (red-accented card)

**Asteroid of the Day Spotlight (below hero stats):**
A featured card highlighting the single most interesting upcoming approach (determined by: closest miss distance, or largest size, or highest velocity — whichever scores highest on a weighted composite). Card includes:
- Asteroid name/designation + full name if available
- **Absolute magnitude (H)** displayed with context tooltip: "H = 22.4 — roughly equivalent to a 140m object"
- Close approach date and time (formatted nicely)
- Miss distance in lunar distances + kilometers
- Relative velocity in km/s
- Estimated diameter range (meters)
- Hazardous status (badge)
- **Sentry cross-reference badge:** If `is_sentry_object` is true, show a pulsing amber "SENTRY TRACKED" badge that links/scrolls to the same object in Tab 3
- **Orbit class badge:** Fetch from `/neo/{id}` detail endpoint on click/expand — show orbit class (Apollo, Aten, Amor) with a one-line description (e.g., "Apollo — Earth-crossing orbit, semi-major axis > 1 AU")
- **Observation confidence indicator:** Show `observations_used` count from orbital data. More observations = more reliable orbit. Display as a small confidence bar (e.g., <50 obs = "Low confidence", 50-200 = "Moderate", 200+ = "High confidence")
- **Size comparator visualization:** A horizontal bar showing the asteroid silhouette scaled next to reference objects (school bus = 12m, football field = 100m, Statue of Liberty = 93m, Empire State Building = 443m, Golden Gate Bridge = 2737m). Only show references that are within a reasonable range of the asteroid's size. SVG-based.
- **Velocity comparator:** A horizontal stacked bar chart showing the asteroid's speed vs. reference speeds (bullet = 1.2 km/s, SR-71 = 0.98 km/s, ISS = 7.66 km/s, Parker Solar Probe = 192 km/s). The asteroid's bar is highlighted in cyan or red depending on hazard status.

**Daily Breakdown (below spotlight):**
A scrollable list or accordion, one section per day (Mon–Sun), each showing:
- Day header with date + count of approaches that day
- Compact card rows for each asteroid that day:
  - Name | H mag | Diameter (m) | Miss Distance (LD) | Velocity (km/s) | Hazardous badge | Sentry badge (if applicable)
  - Each row clickable to expand for more detail (full diameter range, miss distance in km and AU, exact timestamp, orbit class if fetched)
- Color-coded left border per row: red-orange for hazardous, teal-green for non-hazardous

---

### Tab 2: "Close Approaches" — Historical & Future Explorer
**API:** SBDB Close-Approach Data (`cad.api`)

**Filter Controls (top bar):**
- Date range picker: start date / end date (default: past 30 days to next 30 days)
- Distance filter: max miss distance slider (in lunar distances, 0.5 LD to 75 LD, default 10 LD)
- Size filter: dropdown using H magnitude thresholds (Any, H<26 "~20m+", H<24 "~50m+", H<22 "~140m+", H<20 "~500m+", H<18 "~1km+") — maps to `h-max` parameter
- Sort: dropdown (Closest Distance, Largest Size, Fastest Velocity, Soonest Date, Smallest Uncertainty)
- "Apply Filters" button with loading indicator
- **Quick presets row:** Buttons for common queries — "This Month", "Sub-Lunar Passes (< 1 LD)", "City-Killers (>140m)", "Next 365 Days"
- API call uses `diameter=true&fullname=true` for richest data

**Results Table:**
A data table with sortable column headers:
| Full Name | Date | Miss Distance (LD) | Uncertainty Range (LD) | Velocity (km/s) | H Mag | Est. Diameter (m) |
- **Full Name** column uses the `fullname` field — shows numbered designation + common name if it has one (e.g., "99942 Apophis" instead of just "99942")
- **Uncertainty Range** column: shows `dist_min` — `dist_max` converted to LD. Displayed as a horizontal mini-bar spanning from min to max with the nominal `dist` value marked as a dot. Wide bars = poorly known orbit, narrow bars = well-constrained.
- **H Mag** column: shown with color coding — brighter (lower H, larger object) gets bolder styling
- Rows color-coded by proximity: <1 LD = red background tint, 1-5 LD = amber tint, >5 LD = default
- Pagination or infinite scroll (fetch 20 at a time via `limit` parameter)
- Clicking a row expands it to show:
  - Miss distance in multiple units (LD, km, AU, Earth circumferences, NY-to-London flights)
  - **Uncertainty envelope:** "This object's miss distance is known to between {dist_min_LD} and {dist_max_LD} lunar distances. The nominal estimate is {dist_LD} LD." If the range is wide, add a note: "Orbit uncertainty is high — additional observations would narrow this range."
  - Velocity context: `v_rel` shown alongside `v_inf` with explanation ("v_rel = speed at closest approach, v_inf = approach speed before Earth's gravity accelerated it")
  - Velocity comparisons (multiples of speed of sound, comparison to ISS)
  - Size context: H magnitude converted to approximate diameter using `diameter_km = 1329 / sqrt(0.14) * 10^(-H/5)`, shown alongside the actual diameter estimate if available. Note discrepancy if any.
  - `orbit_id` shown as small metadata tag — indicates which orbit solution the prediction is based on

**Record Breakers Panel (sidebar or bottom section):**
Three highlighted cards pulling from SBDB historical data (query with `date-min=1900-01-01&date-max=now&sort=dist&limit=1` etc.):
1. **Closest Recorded Approach** — closest object to ever pass Earth in the database, show its uncertainty range
2. **Fastest Flyby** — highest `v_rel` recorded
3. **Largest Close Visitor** — lowest H magnitude (biggest object) to pass within 1 LD (`dist-max=1LD&sort=h&limit=1`)

---

### Tab 3: "Sentry Watch" — Impact Monitoring
**API:** Sentry API (`sentry.api?all=1`)

**Threat Level Gauge (top of tab):**
A large stylized dial/meter (speedometer aesthetic) showing the current highest cumulative Palermo scale (`ps_cum`) value across all tracked Sentry objects. The gauge ranges from -10 (negligible) to 0+ (concerning). Needle position + color gradient from green through amber to red. Below the gauge:
- One-line interpretation: e.g., "Current maximum cumulative threat level is well below background risk."
- The object driving the max reading is named: "Driven by: {designation} (ps_cum = {value})"
- A secondary smaller gauge or label showing the highest `ps_max` (single-solution peak) for context

**Summary Stats Row (below gauge):**
Three stat cards:
1. **Total Tracked Objects** — count from Sentry response
2. **Objects with Torino > 0** — count of objects where `ts_max >= 1` (these merit monitoring). If zero, display "0 — all clear" in green.
3. **Closest Impact Window** — the nearest `range` start date across all objects (e.g., "Earliest possible impact: 2029")

**Sentry Objects Table:**
Sortable table of all ~1,900 Sentry objects:
| Designation | Diameter (km) | H Mag | Impact Prob. | Palermo (cum) | Palermo (max) | Torino | # Solutions | Velocity (km/s) | Impact Window | Last Observed |
- Default sort: Palermo cumulative (`ps_cum`) descending (highest risk first)
- **Palermo scale columns:** Show both `ps_cum` (cumulative, the overall risk metric) and `ps_max` (single worst-case solution). Color-code: < -3 = dim gray, -3 to -2 = white, -2 to 0 = amber, > 0 = red.
- Torino scale shown as color-coded badges (0 = gray, 1 = green, 2-4 = yellow, 5-7 = orange, 8-10 = red)
- Impact probability shown in scientific notation with hover tooltip showing plain-English odds (e.g., "2.2e-05" → "about 1 in 45,000")
- **Last Observed column:** Shows `last_obs` date. Color-coded by freshness: observed within last year = green text, 1-3 years ago = amber, 3+ years ago = red with tooltip "Stale orbit — risk assessment may be unreliable until new observations are obtained"
- **# Solutions column:** Shows `n_imp` with tooltip: "Number of distinct virtual impactor solutions. More solutions indicates more orbital uncertainty, not necessarily more danger."
- Row expansion shows:
  - Full date range of possible impact windows (`range` field)
  - **Observation status detail:** "Last observed {last_obs}. Orbit based on {n_imp} impact solutions spanning {range}."
  - **Per-solution breakdown (fetched on-demand from `?des={designation}`):** A mini-table showing each individual virtual impactor:
    | Impact Date | Probability | Palermo | Torino | Energy (MT) | Sigma | Keyhole Width (km) |
    - `energy` field directly from API (megatons of TNT) — no calculation needed
    - `sigma_lov` shown with context: lower sigma = closer to nominal orbit = more concerning
    - `width` = impact keyhole width in km (smaller keyhole = less likely to thread)
    - Sorted by probability descending
  - **Energy context line:** "If {designation} impacted at {v_inf} km/s, the estimated energy would be {energy} megatons — equivalent to roughly {energy/0.015:.0f} Hiroshima bombs."
  - Context line: what this Palermo score means relative to background risk ("A Palermo scale of -2.5 means this object poses about 0.3% of the annual background impact risk for an object of similar size.")

**Sentry Risk Timeline (below table):**
A horizontal timeline visualization spanning 100 years into the future (2026–2126). Each Sentry object with impact solutions appears as a dot/mark at its possible impact date range (`range` field). Dots sized by estimated diameter, colored by Palermo cumulative scale. Hovering a dot shows the object name + `ip` probability + `last_obs` date. Clusters of dots reveal which decades have the most flagged impact windows. A vertical "NOW" line marks 2026. The timeline is horizontally scrollable/zoomable.

---

### Tab 4: "3D View" — Interactive Globe (Stretch Challenge)
**API:** NeoWs `/feed` (same data as Tab 1)
**Library:** globe.gl via CDN (`https://unpkg.com/globe.gl`)

**3D Earth Globe:**
- Centered in the tab panel, taking up most of the vertical space
- Earth rendered with a dark/night texture (showing city lights if possible, otherwise a dark blue sphere with continent outlines)
- Auto-rotates slowly, user can drag to spin, scroll to zoom, right-drag to pan

**Asteroid Markers:**
- Each asteroid from this week's NeoWs data appears as a glowing point positioned around the globe
- Distance from globe surface = miss distance in lunar distances, mapped to a **compressed logarithmic scale:**
  - Objects < 1 LD appear very close to the globe surface
  - Objects at 1 LD appear at the Moon reference ring
  - Objects at 10 LD appear roughly 2x the Moon ring distance
  - Objects at 50+ LD appear at the outer edge of the view
  - Formula suggestion: `visualAltitude = baseRadius * Math.log2(1 + missDistanceLD) * scaleFactor`
- Since NeoWs does not provide surface coordinates for closest approach, assign each asteroid a random but deterministic lat/lng (seeded by asteroid ID) so positions are consistent across reloads
- Marker color: red-orange for hazardous, teal-green for non-hazardous
- Marker size: scaled by estimated diameter (larger asteroid = larger dot)
- Markers pulse gently (CSS animation on the point)

**Moon Reference:**
- A larger gray sphere rendered at exactly 1 LD distance from Earth's surface
- Labeled "Moon — 1 LD" with a faint ring/orbit line around Earth at that altitude
- Serves as the primary visual anchor so users instantly see whether asteroids are closer or farther than the Moon

**Interaction:**
- Clicking an asteroid marker opens a detail panel (slide-in from the right side) showing:
  - Asteroid name, date, miss distance (LD + km), velocity, diameter, H magnitude, hazardous status
  - If `is_sentry_object` is true: a pulsing amber "SENTRY TRACKED" badge with link to jump to Tab 3 and highlight that object
  - Same size/velocity comparators from Tab 1
  - A "View in This Week tab" link that switches to Tab 1 and highlights that asteroid
- A legend in the corner explaining the color coding and distance scale

**Asteroid List Sidebar (left side, collapsible):**
- Scrollable list of all asteroids shown on the globe
- Each entry: name, miss distance, hazardous badge
- Clicking an entry spins the globe to center on that asteroid and opens its detail panel
- Active/selected asteroid highlighted in the list

---

## Orbit Dodger — Interactive Game

### Access
- Triggered by the play button in the header (glowing gamepad/crosshair icon)
- On click, the dashboard tabs and content smoothly fade out and the game canvas fades in, taking over the full page
- A small "✕ EXIT" button in the top-left corner returns to the dashboard at any time (ESC key also works)
- Before the game starts, a brief "BRIEFING" screen shows: controls explanation, scoring rules, and a "LAUNCH MISSION" button

### Game Canvas
- Full viewport HTML5 Canvas (or layered canvases for background/game/UI)
- Background: dark starfield with subtle parallax (stars drift slowly outward from center to enhance the radial feel)
- Earth: rendered at the center of the canvas, a detailed circle/sprite with a subtle blue atmospheric glow
- Earth has an HP bar displayed as a ring around it — full = bright cyan ring, as damage accumulates the ring depletes and shifts toward red

### Player Spacecraft
- A small triangular/wedge spacecraft sprite orbiting Earth at a fixed orbital radius (~30% from center to edge)
- **Movement:** A/D or Left/Right arrow keys rotate the spacecraft around Earth (smooth, not snappy — slight acceleration/deceleration for feel)
- **Aiming:** The spacecraft always faces outward from Earth. The mouse cursor controls a targeting reticle that appears further out from the spacecraft. The ship's gun barrel tracks toward the reticle, allowing fine-aim within a ~90° forward arc.
- **Firing:** Left mouse click fires a projectile from the spacecraft toward the reticle. Projectiles are small cyan bolts that travel fast and disappear if they exit the canvas.
- **Fire rate:** ~3 shots per second (cooldown between clicks). Shown as a tiny ammo/cooldown indicator near the ship.

### Asteroids
- Spawn from random positions along the edges of the canvas (all directions)
- Travel inward toward Earth's center
- **Data-driven properties (from NeoWs weekly feed):**
  - Each in-game asteroid corresponds to a real NEO from the current week's data
  - **Sprite size:** Mapped from real estimated diameter. Smallest NEOs (~5-20m) = small sprite, medium (~50-200m) = medium, large (500m+) = large. Use a square-root or log scale so everything is visible but relative size is preserved.
  - **Movement speed:** Mapped from real relative velocity. Real range is roughly 2-30 km/s. Map this to a gameplay pixel-speed range where even the slowest asteroid moves noticeably (e.g., 2 km/s → 1.5 px/frame, 30 km/s → 6 px/frame at 60fps). These values should be tuned for difficulty.
  - **Hits to destroy:** Small = 1 hit, Medium = 2 hits, Large = 3-4 hits. Each hit causes a visible crack/flash on the asteroid sprite.
  - **Hazardous status:** `is_potentially_hazardous_asteroid` from NeoWs determines color and behavior. Hazardous = red/orange glow, must be destroyed. Non-hazardous = blue/green glow, should be ignored.

### Wave System
- **7 waves total**, one per day of the current NeoWs week
- Each wave spawns the asteroids from that day's real close approach data
- Asteroids within a wave don't all spawn at once — they stagger in over the wave duration with randomized entry timing
- **Pacing escalation:**
  - Wave 1-2: Comfortable. 1-3 asteroids per wave, generous spawn spacing (1.5-2s between spawns), slower base speed multiplier (0.8x)
  - Wave 3-4: Building. 3-6 asteroids, tighter spacing (1-1.5s), normal speed (1.0x)
  - Wave 5-6: Intense. 5-10 asteroids, tight spacing (0.5-1s), faster speed (1.2x)
  - Wave 7: Onslaught. All remaining asteroids, rapid spawn (0.3-0.5s), speed boost (1.4x)
  - If a real day has fewer asteroids than the pacing needs, duplicate/echo entries with slight speed variations to maintain tension
- **Between waves:** Brief 3-4 second interlude showing a **Wave Data Card:**
  - "DAY 3 — March 28, 2026"
  - "Approaches: 7 | Closest: (2024 XY) at 0.8 LD | Largest: (2019 AB) at 310m"
  - "WAVE 4 INCOMING" countdown (3, 2, 1...)

### Difficulty Mechanics
- **Decoy pressure:** Non-hazardous asteroids fly in mixed with hazardous ones. Later waves have more non-hazardous asteroids acting as visual clutter — you have to identify threats quickly by color
- **Shielding behavior:** Some hazardous asteroids spawn directly behind a non-hazardous one, so you must wait for a clear shot or reposition
- **Velocity spikes:** ~15% of asteroids get a 2x speed multiplier (representing the real data outliers), preceded by a brief yellow flash warning at their spawn point
- **Multi-angle swarms:** Later waves spawn asteroids from multiple directions simultaneously, forcing rapid orbital repositioning
- **Friendly fire punishment:** Shooting a non-hazardous asteroid doesn't just cost points — it disables your weapon for 1.5 seconds (brief spark/overheat animation on the ship). In later waves, this window is lethal.
- **Near-miss stress:** Asteroids that pass very close to Earth but don't hit it (because they were non-hazardous and correctly ignored) cause a brief camera shake and a "CLOSE CALL" text flash, adding psychological pressure

### Scoring
- **Hazardous asteroid destroyed:** +100 base points × size multiplier (small 1x, medium 2x, large 3x)
- **Speed bonus:** +50 bonus if destroyed in the outer 50% of the canvas (before it gets close)
- **Combo multiplier:** Consecutive correct actions (destroying hazardous OR correctly ignoring non-hazardous) build a combo: 2x, 3x, 4x, max 5x. One mistake (shooting non-hazardous or letting hazardous hit Earth) resets to 1x.
- **Wave clear bonus:** +500 points if zero Earth damage in a wave, +250 if Earth HP stays above 75%
- **Accuracy bonus:** Displayed per-wave. >80% shot accuracy = +200 bonus
- **Non-hazardous shot:** -150 points + weapon disable (1.5s)
- **Hazardous hits Earth:** -300 points + Earth HP damage proportional to asteroid size

### Earth HP
- Starts at 100 HP
- Damage per hazardous impact: Small = 5 HP, Medium = 15 HP, Large = 30 HP
- HP ring around Earth visually depletes and shifts color
- At 50 HP: screen edges get a subtle red vignette, ambient alarm hum begins
- At 25 HP: vignette intensifies, alarm gets louder, screen shakes on each hit
- At 0 HP: **GAME OVER** triggered immediately, Earth cracks/explosion animation

### Asteroid Destruction Feedback
- When a hazardous asteroid is destroyed, it bursts into fragments (particle effect) and a small floating text shows its real name: e.g., "(2024 MK)" + "+300" score popup
- The name and key data (diameter, velocity) flash in a small HUD element at the bottom of the screen for 2 seconds — connecting gameplay to real data

### Game Over Screen
- Triggered when Earth HP reaches 0 OR after clearing all 7 waves
- **Victory screen (all waves cleared):** "EARTH DEFENDED" title, final score, performance grade (S/A/B/C/D based on score thresholds)
- **Defeat screen (HP = 0):** "MISSION FAILED" title, wave reached, final score
- Both screens show:
  - **Score breakdown:** Total points, accuracy %, best combo, waves cleared
  - **Real Data Summary:** "This week, {X} asteroids made close approaches to Earth. {Y} were potentially hazardous. The closest was {name} at {distance} LD."
  - **"PLAY AGAIN"** button (re-fetches live data and restarts)
  - **"RETURN TO DASHBOARD"** button

### Sound Design (Optional Enhancement)
- If implemented, keep it minimal and toggleable (mute button visible):
  - Background: low ambient space hum
  - Shooting: short laser/pulse sound
  - Asteroid hit: crunch/impact
  - Asteroid destroyed: satisfying shatter
  - Non-hazardous shot (mistake): error buzzer
  - Earth hit: deep bass impact + alarm
  - Wave complete: brief chime
  - Game over: dramatic low tone (defeat) or triumphant chord (victory)

---

## Additional Features

### Live Countdown (Header)
- Shows time remaining until the next chronological close approach from NeoWs data
- Formatted as: `Next approach: (2024 XY) in 2d 14h 32m 07s`
- Updates every second via `setInterval`
- When a countdown reaches zero, auto-advances to the next upcoming approach
- Subtle pulse animation on the timer digits

### Loading States
- All tabs show skeleton loading placeholders while API calls are in progress
- Skeletons match the layout of the final content (card shapes, table row shapes)
- Shimmer animation: left-to-right cyan gradient sweep across skeleton elements
- Error state: if an API call fails, show a styled error card with "Unable to reach NASA servers — retrying..." and an auto-retry after 10 seconds. Manual "Retry Now" button available.

### Responsive Behavior
- Minimum supported width: 1024px (tablet landscape)
- Below 1024px: show a "Best viewed on desktop" message
- Tab panels use CSS Grid that collapses from multi-column to single-column at narrower widths
- 3D globe tab maintains aspect ratio and centers in available space
- Game canvas always fills full viewport regardless of screen size

### Performance Considerations
- Cache NeoWs and Sentry API responses in `sessionStorage` with 15-minute TTL to avoid redundant calls
- Debounce filter controls in Tab 2 (300ms) before triggering API calls
- Globe tab: only initialize globe.gl when the tab is first activated (lazy load), destroy/pause animation when switching away
- Game canvas: use `requestAnimationFrame` loop, pause/cleanup on exit
- Starfield background: render to offscreen canvas once, composite with CSS, don't re-render every frame

---

## Technical Implementation Notes

### Single File Architecture
Everything lives in one `index.html`:
- `<style>` block for all CSS (including animations, keyframes, responsive breakpoints)
- `<script>` block(s) for all JS (API calls, tab switching, game engine, globe initialization)
- External CDN imports:
  - Google Fonts (Orbitron, IBM Plex Mono, IBM Plex Sans)
  - globe.gl (`https://unpkg.com/globe.gl`)
  - Lucide icons or similar lightweight icon set via CDN (for tab icons, play button, etc.)

### API Call Strategy
1. **On page load:** Fetch NeoWs weekly feed (`/feed`) + Sentry full list (`sentry.api?all=1`) in parallel. These power Tabs 1, 3, and 4.
2. **On Tab 1 asteroid expand/spotlight click:** Fetch NeoWs detail endpoint (`/neo/{id}`) to get orbital data (orbit class, orbital elements, observation count). Cache per asteroid ID.
3. **On Tab 2 activation (first time):** Fetch SBDB close-approach data with default filters (`cad.api?date-min=-30&date-max=%2B30&dist-max=10LD&diameter=true&fullname=true`). Subsequent filter changes trigger new fetches.
4. **On Tab 3 row expansion:** Fetch Sentry detail endpoint (`sentry.api?des={designation}`) to get per-solution virtual impactor data (individual impact dates, energies, sigma values, keyhole widths). Cache per designation.
5. **On game launch:** Use already-fetched NeoWs data (no additional API call).
6. **Cache all responses** in sessionStorage with keys like `neows_feed_{startDate}`, `sentry_all`, `sentry_detail_{des}`, `neows_detail_{id}`, `cad_{filterHash}`. Check cache freshness (15-minute TTL) before re-fetching.

### Deployment
- Deploy to GitHub Pages within the course organization
- Live URL pattern: `https://aiml-1870-2026.github.io/{gamertag}/`
- Single `index.html` file in the repo root (or `/docs` folder configured for Pages)
- No build step, no dependencies beyond CDN links

---

## Summary of Deliverables

| Component | Description |
|---|---|
| Tab 1: This Week | Weekly overview with hero stats, asteroid of the day spotlight with size/velocity comparators, daily breakdown accordion |
| Tab 2: Close Approaches | Historical/future SBDB explorer with filter controls, sortable table, record breakers panel |
| Tab 3: Sentry Watch | Impact monitoring with threat gauge, full Sentry table with Torino/Palermo badges, 100-year risk timeline |
| Tab 4: 3D View | Interactive globe.gl Earth with asteroid markers at logarithmic miss distances, Moon at 1 LD, detail panel on click |
| Orbit Dodger | Full arcade game using real NeoWs data, 7 waves, radial shooter with difficulty escalation, score system, data cards between waves |
| Header | Project title, tab nav, live countdown to next approach, Orbit Dodger play button |
| Visual Design | Deep space mission control aesthetic, Orbitron + IBM Plex fonts, cyan/orange/green accent system, starfield background, glassmorphism cards |
