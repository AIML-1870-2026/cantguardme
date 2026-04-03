# Drug Safety Explorer — spec.md

## Project Overview

**Project Name:** Drug Safety Explorer — "RxRecon"
**Course:** AIML 1870 — Code Quest
**Deployment:** Single-page web application (HTML/CSS/JS) on GitHub Pages
**Data Source:** OpenFDA API (no API key required, client-side only)
**Author:** Sharish

---

## Concept & Identity

RxRecon is a drug safety reconnaissance tool. The concept: the user is an investigator building a real-time intelligence dossier on medications using live FDA data. The interface treats drug safety exploration as a mission — not a sterile clinical lookup, but an active, engaging investigation.

The name "RxRecon" combines "Rx" (prescription) with "Recon" (reconnaissance). The app lets users investigate individual drugs, compare two drugs side-by-side, and explore entire drug classes — all powered by live OpenFDA API queries across multiple endpoints.

---

## Visual Design & Aesthetic Direction

### Theme: "Clinical Intelligence Terminal"

A dark-mode interface that feels like a professional intelligence dashboard crossed with a high-end medical information system. Not sci-fi — refined, authoritative, and serious. Think Bloomberg Terminal meets clinical decision support.

### Color Palette

```
--bg-primary: #0A0E17          /* Deep navy-black background */
--bg-secondary: #111827        /* Card/panel backgrounds */
--bg-tertiary: #1F2937         /* Elevated surfaces, inputs */
--border-subtle: #374151       /* Subtle borders */
--border-active: #3B82F6       /* Active/focused borders */
--text-primary: #F9FAFB        /* Primary text — near-white */
--text-secondary: #9CA3AF      /* Secondary text — muted gray */
--text-tertiary: #6B7280       /* Tertiary text — dimmer */
--accent-blue: #3B82F6         /* Primary accent — actions, links */
--accent-cyan: #06B6D4         /* Data highlights, chart accent */
--accent-amber: #F59E0B        /* Warnings, Class II recalls */
--accent-red: #EF4444          /* Danger, Class I recalls, serious events */
--accent-green: #10B981        /* Safe, Class III recalls, positive */
--accent-purple: #8B5CF6       /* Drug class exploration accent */
--glass-bg: rgba(17,24,39,0.8) /* Glassmorphism panels */
--glass-border: rgba(255,255,255,0.08)
```

### Typography

- **Display/Headings:** "DM Sans" (Google Fonts) — clean, geometric, modern authority
- **Body/Data:** "IBM Plex Mono" (Google Fonts) — monospace for data readouts, gives terminal/intelligence feel
- **Labels/UI:** "DM Sans" at smaller weights

### Design Details

- **Glassmorphism panels** with subtle backdrop-blur on cards and modals
- **Subtle grid background pattern** on the main bg (CSS repeating-linear-gradient) to evoke a data grid
- **Micro-animations:** Cards fade-slide in on load/search, loading states use a pulsing skeleton, tabs animate with an underline slide, charts animate on render
- **Severity color-coding** used consistently everywhere: red = Class I / death / life-threatening, amber = Class II / hospitalization, green = Class III / mild
- **Focus states and keyboard navigation** for accessibility
- **Responsive layout** — works on desktop and tablet (minimum 768px gracefully, mobile-friendly but desktop-optimized)

---

## Architecture

### Single-File Structure

One `index.html` file containing all HTML, CSS, and JavaScript. No build tools, no frameworks, no dependencies beyond Google Fonts and a charting library loaded via CDN.

### External Dependencies (CDN only)

- **Chart.js** (via cdnjs) — for bar charts, doughnut charts, and timeline visualizations
- **Google Fonts** — DM Sans + IBM Plex Mono

### API Layer

All API calls go through a central `fetchOpenFDA()` utility function that:
- Constructs the correct URL from endpoint, search params, count, limit, skip
- Handles rate limiting (240 req/min) with a simple queue/delay if needed
- Returns parsed JSON or a structured error object
- Logs failed requests to console for debugging

```
Base URL: https://api.fda.gov/drug/
Endpoints used:
  - /drug/label.json
  - /drug/event.json
  - /drug/enforcement.json
```

---

## Page Layout

### Top Section: Header Bar

- App logo/name "RxRecon" with a small Rx icon (SVG, inline)
- Subtitle: "Drug Safety Intelligence Dashboard"
- Right side: three small buttons — "How to Read This Data" (opens general help modal), "About" (opens about/disclaimer modal), theme/mode indicator

### Search & Input Area

Two modes accessible via toggle:

**Mode 1: Drug Comparison (default)**
- Two search input fields side by side: "Drug A" and "Drug B"
- Each input has **autocomplete** — as the user types (debounced 300ms), query `/drug/label.json?search=openfda.brand_name:{input}*+openfda.generic_name:{input}*&limit=10` and display a dropdown of matching drug names (show both brand and generic)
- A prominent "Investigate" button that triggers all API calls for both drugs
- Pre-populated on page load with **Warfarin** and **Ibuprofen** — results load automatically so users see data immediately

**Mode 2: Drug Class Explorer**
- A dropdown selector listing major drug classes:
  - SSRIs (Selective Serotonin Reuptake Inhibitors)
  - Statins (HMG-CoA Reductase Inhibitors)
  - ACE Inhibitors
  - NSAIDs (Nonsteroidal Anti-inflammatory Drugs)
  - Fluoroquinolones
  - Benzodiazepines
  - Proton Pump Inhibitors
  - Beta Blockers
- When a class is selected, the app queries OpenFDA for drugs in that pharmacologic class using `patient.drug.openfda.pharm_class_epc` and displays a comparative safety fingerprint view

### Tab Navigation

Below the search area, a horizontal tab bar with animated underline indicator:

1. **Overview** — Summary cards and key safety signals
2. **Adverse Events** — FAERS data visualizations and tables
3. **Drug Labels** — Official FDA labeling information (warnings, interactions, contraindications)
4. **Recalls** — Enforcement/recall history with timeline
5. **Co-Administration** — Analysis of combined drug reports (only visible in Drug Comparison mode)

### Main Content Area

Content changes based on the active tab. Each tab is described in detail below.

### Footer

- Required OpenFDA attribution: *"This product uses publicly available data from the U.S. Food and Drug Administration (FDA). FDA is not responsible for the product and does not endorse or recommend this or any other product."*
- Educational disclaimer: *"RxRecon is an educational tool built for AIML 1870 at the University of Nebraska at Omaha. It is NOT a substitute for professional medical advice, diagnosis, or treatment. Always consult a healthcare professional before making any medical decisions."*
- Data source links: OpenFDA, FAERS Public Dashboard
- Copyright line

---

## Tab 1: Overview

### What it shows

A high-level intelligence briefing on the selected drug(s). This is the landing view after a search.

### Components

**Drug Identity Cards (one per drug, side by side in comparison mode)**
Each card displays:
- Drug name (brand + generic)
- Drug class / pharmacologic category (from `openfda.pharm_class_epc`)
- Route of administration (from label data)
- Whether it has a **boxed warning** (bold red indicator if `boxed_warning` field exists)
- Total FAERS report count (from event endpoint with count query)
- Recall status — number of recalls found

**Key Safety Signals Panel**
- Top 5 most reported adverse events for each drug (horizontal bar chart, side by side for comparison)
- Seriousness breakdown — doughnut chart showing proportion of reports that are serious vs non-serious (`serious` field: "1" = serious, "2" = not serious)
- Outcome distribution — stacked bar showing death, life-threatening, hospitalization, disability, other (`seriousnessdeath`, `seriousnesslifethreatening`, `seriousnesshospitalization`, `seriousnessdisabling`, `seriousnessother`)

**Info button (ⓘ)** next to the adverse events section opens the "How to Interpret Adverse Event Data" help popup.

---

## Tab 2: Adverse Events

### What it shows

Deep dive into FAERS adverse event data for the selected drug(s).

### API Queries

For each drug:
1. **Top reactions:** `search=patient.drug.openfda.generic_name:"{drug}"&count=patient.reaction.reactionmeddrapt.exact` — returns top 1000 reactions with counts
2. **Seriousness counts:** `search=patient.drug.openfda.generic_name:"{drug}"&count=serious` — serious vs not
3. **Outcome counts:** Separate count queries on `seriousnessdeath`, `seriousnesshospitalization`, etc.
4. **Reports over time:** `search=patient.drug.openfda.generic_name:"{drug}"&count=receivedate` — returns report counts by date for timeline
5. **Reporter type:** `search=patient.drug.openfda.generic_name:"{drug}"&count=primarysource.qualification` — who submitted (physician, pharmacist, consumer, etc.)
6. **Patient age distribution:** `search=patient.drug.openfda.generic_name:"{drug}"&count=patient.patientonsetage` — age distribution
7. **Patient sex:** `search=patient.drug.openfda.generic_name:"{drug}"&count=patient.patientsex` — sex distribution

### Components

**Top Adverse Events Chart**
- Horizontal bar chart showing top 20 reactions ranked by report count
- In comparison mode: grouped bars (Drug A vs Drug B) for the union of both drugs' top 15 reactions
- Color-coded by drug
- Hoverable with tooltip showing exact count

**Adverse Event Timeline Heatmap**
- X-axis: time (years, grouped by quarter or month depending on data density)
- Y-axis: top 10 adverse events for the drug
- Cell color intensity = report count for that event in that time period
- This surfaces temporal patterns — spikes in certain reactions at certain times
- Rendered using Chart.js matrix chart or a custom canvas/div-based heatmap
- Overlay: vertical dashed lines marking any recall dates for that drug (pulled from enforcement endpoint) so users can see if recalls correlate with report spikes

**Seriousness Breakdown**
- Doughnut chart: serious vs non-serious
- Below it, a severity cascade: death → life-threatening → hospitalization → disability → other, each as a small stat card with count and percentage

**Demographics Panel**
- Patient sex distribution (pie chart)
- Reporter type distribution (who filed: physician, consumer, pharmacist, etc.) — bar chart
- Age distribution — histogram or bar chart of age buckets

**Info buttons:**
- (ⓘ) "How to Interpret Adverse Event Data" — explains voluntary reporting, correlation ≠ causation, reporting bias
- (ⓘ) "Why Some Drugs Have More Reports Than Others" — explains that popular drugs naturally accumulate more reports

---

## Tab 3: Drug Labels

### What it shows

Official FDA-approved labeling data — the most authoritative source of drug safety info.

### API Queries

For each drug:
1. `search=openfda.generic_name:"{drug}"&limit=1` — returns the full label record

### Components

**Label Sections Display**
Render the following label sections in expandable/collapsible accordion panels:
- **Boxed Warning** (`boxed_warning`) — displayed with red left border and warning icon if present
- **Warnings & Precautions** (`warnings`, `warnings_and_cautions`)
- **Adverse Reactions** (`adverse_reactions`) — the official listed reactions, distinct from FAERS reports
- **Drug Interactions** (`drug_interactions`) — critical section, highlight this
- **Contraindications** (`contraindications`)
- **Indications & Usage** (`indications_and_usage`)
- **Dosage & Administration** (`dosage_and_administration`)
- **Overdosage** (`overdosage`)
- **Description** (`description`)
- **Mechanism of Action** (`mechanism_of_action`)
- **Clinical Pharmacology** (`clinical_pharmacology`)
- **Use in Specific Populations** (`use_in_specific_populations`) — pregnancy, pediatric, geriatric

In comparison mode, show both drugs' labels side by side with synchronized accordions (open the same section on both sides).

**Text formatting:** The label text from OpenFDA comes as plain text strings, sometimes with HTML-like artifacts. Clean and render with basic paragraph breaks. Long sections should be scrollable within their accordion panel (max-height with overflow).

**Info button:**
- (ⓘ) "What Drug Labels Actually Tell You" — explains that label data is FDA-reviewed prescribing information, the gold standard

---

## Tab 4: Recalls

### What it shows

Drug recall and enforcement history — when and why drugs were pulled from the market.

### API Queries

For each drug:
1. `search=openfda.generic_name:"{drug}"+openfda.brand_name:"{drug}"&limit=99&sort=report_date:desc` on `/drug/enforcement.json` — returns recall records
2. Count by classification: `search=openfda.generic_name:"{drug}"+openfda.brand_name:"{drug}"&count=classification.exact`

### Components

**Recall Summary Cards**
- Total recalls found
- Breakdown by classification with color coding:
  - **Class I** (red) — dangerous or defective products that could cause serious health problems or death
  - **Class II** (amber) — products that might cause temporary health problems, or pose slight threat of serious nature
  - **Class III** (green) — products unlikely to cause adverse health reaction, but violate FDA labeling or manufacturing laws
- Breakdown by voluntary vs mandated

**Recall Timeline**
- Vertical timeline visualization (CSS-based, not chart)
- Each recall is a node on the timeline showing:
  - Date (report_date)
  - Classification (color-coded badge)
  - Reason for recall (reason_for_recall field, truncated with expand)
  - Recalling firm
  - Distribution pattern
  - Status (ongoing, completed, terminated)
- In comparison mode: two parallel timelines side by side

**Recall Detail Cards**
- Expandable cards for each individual recall with full details
- Fields: reason_for_recall, classification, recalling_firm, voluntary_mandated, product_description, distribution_pattern, status, city, state

**Info button:**
- (ⓘ) "Understanding Recall Classifications" — explains Class I, II, III with real-world examples

---

## Tab 5: Co-Administration Analysis

*Only visible in Drug Comparison mode (not Drug Class Explorer mode)*

### What it shows

Analyzes FAERS reports where both selected drugs appear together in the same report. This surfaces potential interaction signals — adverse events that emerge when the two drugs are taken concurrently.

### API Queries

1. **Co-administration reports — top reactions:** `search=patient.drug.openfda.generic_name:"{drugA}"+AND+patient.drug.openfda.generic_name:"{drugB}"&count=patient.reaction.reactionmeddrapt.exact` — reactions reported when both drugs are present
2. **Co-administration seriousness:** `search=patient.drug.openfda.generic_name:"{drugA}"+AND+patient.drug.openfda.generic_name:"{drugB}"&count=serious`
3. **Total co-administration report count:** Same search with `&limit=1` to get the `meta.results.total`

### Components

**Co-Administration Summary**
- Total FAERS reports where both drugs appear together
- Seriousness rate for co-administration reports vs each drug alone (displayed as a comparison stat)

**Reaction Comparison: Combined vs Individual**
- Three-column grouped bar chart:
  - Drug A alone — top reactions
  - Drug B alone — top reactions
  - Drug A + Drug B together — top reactions
- Highlight reactions that appear in the combined profile but NOT in either individual profile (these are potential interaction signals) — mark these with a special "⚠ Emerging Signal" badge

**Known Interaction Context**
- Pull the `drug_interactions` field from Drug A's label and search for Drug B's name in the text (and vice versa)
- If found, display the relevant interaction warning text from the official label
- This cross-references real FAERS data with official FDA labeling

**Info button:**
- (ⓘ) "Drug Pairs with Known Dangerous Interactions" — explains classic examples: Warfarin + NSAIDs (bleeding risk), MAO inhibitors + serotonergic drugs (serotonin syndrome), Methotrexate + NSAIDs (methotrexate toxicity)

---

## Drug Class Explorer Mode

When the user switches to Drug Class Explorer mode and selects a class:

### API Queries

1. Query the label endpoint to find drugs in the class: `search=openfda.pharm_class_epc:"{class_name}"&limit=100&count=openfda.generic_name.exact` — returns the most common generic names in that class
2. For each of the top 5-8 drugs in the class, run the standard adverse event count queries

### Components

**Class Overview**
- List of drugs found in the class with total FAERS report counts
- Brief description of the drug class (hardcoded educational text for each of the listed classes)

**Safety Fingerprint Radar Charts**
- For each drug in the class, create a radar/spider chart with axes representing adverse event categories:
  - Cardiac (events containing "cardiac", "heart", "arrhythmia", etc.)
  - Hepatic (events containing "hepat", "liver", etc.)
  - Neurological (events containing "headache", "dizzy", "seizure", "neuro", etc.)
  - Gastrointestinal (events containing "nausea", "vomit", "diarr", "abdominal", etc.)
  - Dermatological (events containing "rash", "pruritus", "skin", etc.)
  - Renal (events containing "renal", "kidney", etc.)
- Overlay multiple drugs on the same radar chart so users can visually compare safety profiles within the class
- Each drug gets a distinct color

**Class Adverse Event Comparison Table**
- Rows: top 15 adverse events across all drugs in the class
- Columns: each drug in the class
- Cells: report count (with heat-map coloring — darker = more reports)
- Sortable by any column

**Class Recall Comparison**
- Simple table showing recall counts by classification for each drug in the class

---

## Help System — Educational Popups

All help popups share a common modal design:
- Triggered by small (ⓘ) buttons placed inline next to relevant sections
- Modal appears with backdrop blur overlay
- Smooth fade-in animation
- Dismissible via: click outside, press Escape, click X button
- Clean typography, plain language, no jargon without explanation

### Help Popup Content

**1. How to Interpret Adverse Event Data**
- FAERS reports are voluntarily submitted by patients, healthcare professionals, and drug manufacturers
- A report linking a drug to an adverse event does NOT prove the drug caused the event — it only indicates a temporal association
- Report counts cannot be used to estimate how common an event actually is in the population
- Many factors influence whether an event gets reported: media coverage, regulatory attention, time on market
- Higher report counts do not necessarily mean a drug is more dangerous
- Use this data to identify potential signals and patterns, not to make clinical decisions

**2. Understanding Recall Classifications**
- **Class I:** Situations where there is a reasonable probability that use of the product will cause serious adverse health consequences or death. Example: contamination with a dangerous substance, incorrect active ingredient
- **Class II:** Situations where use of the product may cause temporary or medically reversible adverse health consequences, or where the probability of serious consequences is remote. Example: labeling mix-ups, minor contamination
- **Class III:** Situations where use of the product is not likely to cause adverse health consequences. Example: minor labeling errors, cosmetic defects in packaging

**3. Drug Pairs with Known Dangerous Interactions**
- **Warfarin + NSAIDs** (e.g., Ibuprofen): Greatly increased risk of gastrointestinal bleeding. NSAIDs inhibit platelet aggregation and damage the GI mucosa, compounding warfarin's anticoagulant effect.
- **MAO Inhibitors + Serotonergic Drugs** (e.g., SSRIs): Risk of serotonin syndrome — a potentially fatal condition involving hyperthermia, rigidity, and autonomic instability.
- **Methotrexate + NSAIDs**: NSAIDs reduce renal clearance of methotrexate, leading to toxic accumulation and potentially fatal bone marrow suppression.
- **Statins + Grapefruit Juice**: Grapefruit inhibits CYP3A4, dramatically increasing statin blood levels and the risk of rhabdomyolysis (muscle breakdown).
- **ACE Inhibitors + Potassium-Sparing Diuretics**: Risk of life-threatening hyperkalemia.

**4. What Drug Labels Actually Tell You**
- Drug labels (prescribing information) are the FDA-approved documents that come with every prescription drug
- They are reviewed and approved by the FDA before a drug can be marketed
- They represent the most authoritative source of information about a drug's safety, efficacy, dosage, and risks
- The label is a legal document — manufacturers are required to include known risks
- Label data in this tool comes from the Structured Product Labeling (SPL) format maintained by the FDA

**5. Why Some Drugs Have More Reports Than Others**
- Reporting bias is the biggest confounder in FAERS data
- A drug prescribed to 50 million people will naturally accumulate far more adverse event reports than one prescribed to 50,000 — even if both drugs are equally safe
- Media coverage of a drug's side effects can cause a spike in reporting (the "notoriety bias")
- Newer drugs may have fewer reports simply because they haven't been on the market long enough
- Some drug classes (e.g., cancer drugs) have higher reporting rates because of mandatory manufacturer reporting requirements
- Always consider a drug's market share and patient population when interpreting report counts

**6. About This Tool**
- RxRecon is a student project for AIML 1870 at the University of Nebraska at Omaha
- It queries live data from the OpenFDA API, which provides access to FDA public datasets
- The tool is for educational and informational purposes only
- It is NOT a substitute for professional medical advice
- Data limitations: FAERS is voluntary, labels may not reflect the most current version, recall data goes back to 2004
- Always consult a healthcare professional before making any decisions about medications
- Required OpenFDA attribution (full text)

---

## Edge Case Handling

The app must handle all of these gracefully:

- **Drug not found:** Display a clear message: "No results found for '{query}'. Try searching by generic name (e.g., 'ibuprofen' instead of 'Advil')."
- **No adverse events:** Display: "No adverse event reports found for this drug in the FAERS database. This may mean the drug has few reports, or it may be listed under a different name."
- **No recalls:** Display: "No recall records found for this drug. This is a good sign, but does not guarantee the drug has never been recalled — enforcement data in OpenFDA goes back to 2004."
- **No label data:** Display: "FDA labeling data not available for this drug in the OpenFDA database."
- **No co-administration reports:** Display: "No FAERS reports found where both drugs appear together. This doesn't mean the combination is safe — it may simply mean co-administration hasn't been reported through this system."
- **API errors / rate limiting:** Display a non-alarming error message with a retry button. "The FDA data service is temporarily unavailable. This can happen during peak usage. Please try again in a moment."
- **Sparse data:** When a drug has very few reports (< 10), display a context note: "This drug has very few reports in the FAERS database. Results may not be meaningful."
- **Autocomplete with no matches:** Show "No matching drugs found" in dropdown

---

## Loading & State Management

### Loading States

- **Initial page load:** Skeleton placeholders for all card areas, then auto-load Warfarin + Ibuprofen data
- **Search in progress:** Each section shows an animated skeleton loader independently (sections can load at different speeds since they hit different endpoints)
- **Autocomplete loading:** Small spinner inside the input field

### State Management

Simple vanilla JS state object:

```javascript
const state = {
  mode: 'comparison', // 'comparison' or 'class'
  activeTab: 'overview',
  drugA: { name: '', data: { label: null, events: null, recalls: null } },
  drugB: { name: '', data: { label: null, events: null, recalls: null } },
  coAdmin: { data: null },
  drugClass: { selected: '', drugs: [], data: {} },
  loading: { drugA: false, drugB: false, coAdmin: false, drugClass: false },
  errors: {}
};
```

---

## Animations & Micro-Interactions

- **Page load:** Staggered fade-in of header → search bar → tabs → content (animation-delay cascade)
- **Tab switch:** Content fades out (150ms), tab underline slides to new position (300ms ease), new content fades in (200ms)
- **Card appearance:** Cards slide up 20px and fade in with stagger (50ms between cards)
- **Chart render:** Chart.js animations enabled — bars grow from 0, doughnuts sweep clockwise
- **Search autocomplete:** Dropdown slides down from input with subtle shadow
- **Modal open:** Backdrop fades in, modal scales from 0.95 to 1.0 with fade
- **Modal close:** Reverse of open
- **Hover states:** Cards lift slightly with shadow increase, buttons have subtle color shift
- **Loading skeletons:** Shimmer animation (gradient sweep left to right)
- **Severity badges:** Slight pulse animation on Class I recall badges

---

## Accessibility

- All interactive elements are keyboard-focusable with visible focus indicators
- Tab navigation works logically through the interface
- Modals trap focus when open and return focus to trigger on close
- Charts have aria-labels describing the data
- Color is never the only indicator — severity levels use both color AND text labels
- Sufficient contrast ratios (WCAG AA minimum)
- Alt text for any icons or decorative elements
- Escape key closes modals and dropdowns

---

## Performance Considerations

- **Debounced autocomplete** (300ms) to avoid hammering the API on every keystroke
- **Parallel API calls** — when investigating a drug, fire all endpoint requests simultaneously with `Promise.allSettled()` rather than sequentially
- **Caching** — store API responses in a simple in-memory cache keyed by query URL. If the user searches the same drug twice in one session, return cached data instantly
- **Lazy tab loading** — only fetch data for a tab when the user first navigates to it (except Overview, which loads immediately). Once fetched, cache the results
- **Chart destruction** — properly destroy Chart.js instances before re-rendering to prevent memory leaks
- **Image-free** — no images to load; all visual elements are CSS/SVG/canvas

---

## File Structure for Deployment

```
/
├── index.html          (single file — all HTML, CSS, JS)
└── README.md           (brief project description for GitHub)
```

Everything in one `index.html`. CSS in a `<style>` block. JS in a `<script>` block. No separate files needed.

---

## Required Disclaimers & Attribution

These MUST appear in the footer and in the "About This Tool" help popup:

1. **Educational Disclaimer:** "RxRecon is an educational tool built for AIML 1870 at the University of Nebraska at Omaha. It is NOT a substitute for professional medical advice, diagnosis, or treatment. Always consult a healthcare professional before making any medical decisions."

2. **OpenFDA Attribution:** "This product uses publicly available data from the U.S. Food and Drug Administration (FDA). FDA is not responsible for the product and does not endorse or recommend this or any other product."

3. **FAERS Data Disclaimer (on Overview and Adverse Events tabs):** "FAERS reports are voluntarily submitted. A report linking a drug to an adverse event does not prove the drug caused the event. Report counts cannot be used to estimate how common an event actually is."

---

## OpenFDA API Reference (Quick Reference for Implementation)

### Base URL
```
https://api.fda.gov/drug/{endpoint}.json
```

### Query Parameters
```
search=field:term                     Filter by field
search=field:term+AND+field:term      AND condition
search=field:term+field:term          OR condition
count=field.exact                     Count unique values (max 1000 returned)
limit=N                               Results per request (max 1000)
skip=N                                Pagination offset
sort=field:desc                       Sort order
```

### Key Fields by Endpoint

**Event endpoint** (`/drug/event.json`):
- `patient.drug.openfda.generic_name` — drug generic name
- `patient.drug.openfda.brand_name` — drug brand name
- `patient.drug.openfda.pharm_class_epc` — pharmacologic class
- `patient.reaction.reactionmeddrapt` — adverse reaction (MedDRA term)
- `serious` — "1" = serious, "2" = not serious
- `seriousnessdeath` — "1" if death
- `seriousnesslifethreatening` — "1" if life-threatening
- `seriousnesshospitalization` — "1" if hospitalized
- `seriousnessdisabling` — "1" if disability
- `receivedate` — date report received (YYYYMMDD)
- `primarysource.qualification` — reporter type (1=physician, 2=pharmacist, 3=other health professional, 4=lawyer, 5=consumer)
- `patient.patientsex` — 0=unknown, 1=male, 2=female
- `patient.patientonsetage` — age at onset

**Label endpoint** (`/drug/label.json`):
- `openfda.generic_name` / `openfda.brand_name` — search by name
- `boxed_warning` — black box warning text
- `warnings` / `warnings_and_cautions` — warnings
- `adverse_reactions` — listed adverse reactions
- `drug_interactions` — interaction warnings
- `contraindications` — contraindications
- `indications_and_usage` — approved uses
- `dosage_and_administration` — dosing info
- `overdosage` — overdose info
- `description` — drug description
- `mechanism_of_action` — how the drug works
- `clinical_pharmacology` — clinical pharm info
- `use_in_specific_populations` — pregnancy, pediatric, geriatric

**Enforcement endpoint** (`/drug/enforcement.json`):
- `openfda.generic_name` / `openfda.brand_name` — search by name
- `classification` — "Class I", "Class II", "Class III"
- `reason_for_recall` — why recalled
- `report_date` — date (YYYYMMDD)
- `recalling_firm` — company
- `voluntary_mandated` — who initiated
- `product_description` — what was recalled
- `distribution_pattern` — where distributed
- `status` — Ongoing, Completed, Terminated

### Important Notes
- Use `.exact` suffix on count fields to count full phrases
- Use `"quotes"` around multi-word search terms
- Use `+` instead of spaces in query strings
- Use `*` wildcard for autocomplete searches
- Not all records have `openfda` harmonized fields — some searches may miss records
- Date ranges use bracket syntax: `[20040101+TO+20231231]`

---

## Summary of All Features

### Core (Required)
- [x] Live OpenFDA API queries (label, event, enforcement endpoints)
- [x] Investigate at least two drugs
- [x] Single-page HTML/CSS/JS app
- [x] Educational disclaimer
- [x] OpenFDA attribution

### Ideas to Explore (All Included)
- [x] Side-by-side comparison view with tabs
- [x] Pre-populated Warfarin + Ibuprofen on page load
- [x] Visual charts of most common adverse events
- [x] Recall timeline with dates and reasons
- [x] Color-coded recall severity (Class I, II, III)
- [x] Autocomplete drug search via label endpoint
- [x] Co-administration analysis (FAERS reports where both drugs appear)
- [x] Graceful edge case handling for all failure modes

### Stretch Challenge 1: Help Buttons & Educational Popups (All Included)
- [x] (ⓘ) How to Interpret Adverse Event Data
- [x] (ⓘ) Understanding Recall Classifications
- [x] (ⓘ) Drug Pairs with Known Dangerous Interactions
- [x] (ⓘ) What Drug Labels Actually Tell You
- [x] (ⓘ) Why Some Drugs Have More Reports Than Others
- [x] (ⓘ) About This Tool
- [x] Modal design: backdrop blur, smooth animations, easy dismissal
- [x] "How to Read This Data" button in header

### Stretch Challenge 2: Visual Storytelling (All Included)
- [x] Adverse event timeline heatmap with recall date overlays
- [x] Frequency charts ranking most common reactions
- [x] Severity breakdowns (serious vs mild, outcome distribution)
- [x] Demographics visualizations (age, sex, reporter type)
- [x] Co-administration reaction emergence analysis

### Stretch Challenge 3: Drug Class Exploration (All Included)
- [x] Drug class selector with 8 major classes
- [x] Safety fingerprint radar charts comparing drugs within a class
- [x] Class-wide adverse event comparison heatmap table
- [x] Class recall comparison

---

*This spec is the complete contract for building RxRecon. Every feature described above should be implemented. The design should be bold, polished, and distinctly not generic. The data should be live, the disclaimers should be prominent, and the help system should make complex pharmacovigilance data accessible to anyone.*
