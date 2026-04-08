# LLM Switchboard — spec.md

> A single-page web application (`index.html`) that lets users interact with large language models through their APIs, compare model outputs, manage prompts, and validate structured responses.

---

## 1. Overview

The LLM Switchboard is a full-dashboard web app for sending prompts to LLM APIs (OpenAI and Anthropic), viewing responses in unstructured or structured (JSON schema) modes, comparing models side-by-side, tracking response metrics, saving prompts to an in-memory library, and validating structured outputs against user-defined schemas.

**Single file**: Everything lives in one `index.html` — HTML, CSS, and JavaScript. No frameworks, no build tools, no external dependencies beyond CDN-hosted fonts.

---

## 2. Visual Design System

### 2.1 Aesthetic Direction

**Dark mode, spacious, purple-accented, smooth animations.**

The UI should feel like a premium developer tool — not a generic chatbot interface. Think Linear, Raycast, or Warp terminal. Deep blacks, generous whitespace, and a cohesive purple/violet accent system. Every interaction should feel intentional and polished.

### 2.2 Color Palette

```
/* Backgrounds */
--bg-primary:       #0d0d12;     /* Main background */
--bg-secondary:     #13131a;     /* Panels, sidebars */
--bg-tertiary:      #1a1a24;     /* Cards, inputs, hover states */
--bg-elevated:      #22222e;     /* Elevated surfaces, active states */

/* Purple Accent Ramp */
--accent-50:        #EEEDFE;     /* Lightest — subtle fills */
--accent-100:       #CECBF6;
--accent-200:       #AFA9EC;     /* Text on dark surfaces */
--accent-400:       #7F77DD;     /* Primary accent — buttons, active states */
--accent-600:       #534AB7;     /* Borders, secondary emphasis */
--accent-800:       #3C3489;     /* Deep accent */

/* Text */
--text-primary:     #e2e2e8;     /* Main text */
--text-secondary:   #9999a8;     /* Labels, descriptions */
--text-muted:       #55555f;     /* Placeholders, hints */
--text-disabled:    #3a3a44;     /* Disabled elements */

/* Borders */
--border-subtle:    rgba(255, 255, 255, 0.06);
--border-default:   rgba(255, 255, 255, 0.10);
--border-emphasis:  rgba(255, 255, 255, 0.16);

/* Status Colors */
--status-success:   #5DCAA5;     /* Key loaded, valid, pass */
--status-error:     #F09595;     /* Key missing, invalid, fail */
--status-warning:   #EF9F27;     /* Wrong type, partial match */
--status-info:      #85B7EB;     /* Informational, CORS notice */
```

### 2.3 Typography

Use a distinctive, non-generic font stack. Load from Google Fonts CDN:

- **Display / Headings**: `"JetBrains Mono"` — weight 500. Used for the app title, section headers, model names, and metric values. Gives the tool a technical, precise character.
- **Body / UI**: `"DM Sans"` — weights 400 and 500. Used for all body text, labels, buttons, descriptions. Clean and highly legible.
- **Code / JSON**: `"JetBrains Mono"` — weight 400. Used for JSON schema editor, structured responses, code blocks.

Font sizes: 11px (micro labels, uppercase), 12px (small UI), 13px (body), 14px (emphasis), 15px (section headers), 18px (app title).

### 2.4 Spacing & Layout

- **Generous padding**: minimum 16px inside panels, 20px inside content areas
- **Border radius**: 8px for buttons/inputs, 10px for cards/panels, 12px for the main container
- **Gap rhythm**: 4px (tight), 8px (compact), 12px (default), 16px (section), 24px (major)
- **Panel widths**: Left sidebar fixed at 260px, everything else fluid

### 2.5 Animation & Transitions

All interactions should be smooth and fluid:

- **Transitions**: `all 0.2s ease` on interactive elements (buttons, toggles, hover states)
- **Panel reveals**: `0.3s ease` slide + fade for schema editor, compare mode split, prompt library drawer
- **Loading state**: subtle purple pulse animation on the response area while waiting for API response
- **Toggle switches**: smooth `0.2s ease` thumb slide with background color transition
- **Response streaming**: if the API supports streaming, text should appear progressively. If not, fade in the complete response with `0.3s ease` opacity transition.

---

## 3. Layout Architecture

Full-dashboard layout. Everything visible at once — no page scrolling to reach controls.

```
┌─────────────────────────────────────────────────────────────────┐
│  TOP BAR: App title  ·  Key status indicators                   │
├──────────────┬──────────────────────────────────────────────────┤
│              │  PROMPT INPUT                                    │
│              │  [textarea]                          [Send]      │
│  LEFT PANEL  ├──────────────────────────────────────────────────┤
│              │                                                  │
│  Provider    │  RESPONSE AREA                                   │
│  Model       │  (single or side-by-side when compare mode on)   │
│  Output mode │                                                  │
│  Compare     │                                                  │
│  API key     │                                                  │
│  Examples    │                                                  │
│              ├──────────────────────────────────────────────────┤
│  [Library]   │  METRICS BAR: time · tokens · chars · copy btn   │
└──────────────┴──────────────────────────────────────────────────┘

         ┌────────────────────────────────────┐
         │  PROMPT LIBRARY DRAWER (slide-up)  │
         │  (shown when prompt library opens) │
         └────────────────────────────────────┘
```

### 3.1 Top Bar

- Left: app name ("LLM Switchboard") with a small purple dot indicator
- Right: API key status indicators — green dot + "OpenAI key loaded" / red dot + "Anthropic — no key" (updates dynamically as keys are added/removed)

### 3.2 Left Panel (260px fixed width)

Vertically stacked controls, each section separated by 16px gap:

1. **Provider selector** — segmented toggle: OpenAI | Anthropic. Active state uses `--accent-400` background at 15% opacity with `--accent-200` text. Inactive uses `--bg-tertiary` with muted text.

2. **Model dropdown** — styled select showing current model. Options change based on provider:
   - OpenAI: `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo`, `gpt-3.5-turbo`
   - Anthropic: `claude-sonnet-4-20250514`, `claude-haiku-4-20250414`

3. **Output mode toggle** — segmented toggle: Unstructured | Structured. When "Structured" is selected, the schema editor section slides in smoothly below this toggle (see section 5).

4. **Compare mode toggle** — row with label + toggle switch. Off by default. When toggled on:
   - The response area splits into two columns with a smooth animation
   - A second model selector appears below the first model dropdown (labeled "Model B")
   - The second model can be from the same or different provider
   - If a different provider is selected for Model B, a second API key may be needed

5. **API key input** — shows masked key if loaded (`sk-...7xmQ`). Click reveals options:
   - "Paste key" — opens a small inline text input
   - "Upload file" — accepts `.env` or `.csv` file upload
   - Keys are stored **in-memory only** — never to localStorage, cookies, or any persistent storage
   - A small lock icon and "in-memory only" label reinforces the privacy guarantee
   - `.env` parsing: looks for `OPENAI_API_KEY=...` and `ANTHROPIC_API_KEY=...`
   - `.csv` parsing: expects `provider,key` rows

6. **Example prompts** — clickable list items. Clicking one populates the prompt textarea. Examples should change based on current output mode:
   - **Unstructured examples**:
     - "Explain quantum entanglement in simple terms"
     - "What are the key differences between RNA and DNA polymerase?"
     - "Write a short analysis of the prisoner's dilemma"
     - "Describe how a neural network learns"
   - **Structured examples** (auto-load both a prompt and a schema template):
     - "Describe the element Tungsten" → element schema
     - "Analyze the sentiment of this review" → sentiment schema
     - "Generate a character for a fantasy RPG" → character schema
     - "Classify this as a biological threat level" → classification schema

7. **Prompt library button** — pinned to the bottom of the panel. Opens the slide-up drawer (see section 7).

### 3.3 Prompt Input Area

- Full-width textarea spanning the top of the right area
- Placeholder text: "Enter your prompt..."
- Minimum height: 60px, resizable vertically up to 200px
- **Send button**: solid purple (`--accent-400`), white text, positioned at the bottom-right of the input area
- Keyboard shortcut: `Ctrl+Enter` / `Cmd+Enter` to send
- **Save to library button**: small icon button next to Send, saves current prompt (and schema if in structured mode) to the prompt library
- While a request is in-flight, the Send button shows a subtle spinner and is disabled

### 3.4 Response Area

**Default (single model):**
- Full width of the right panel below the prompt input
- Model name displayed at top-left in accent color
- Response text rendered with good line-height (1.7) and comfortable font size (13.5px)
- Supports markdown-style formatting in unstructured mode (bold, italic, code blocks, lists)
- In structured mode, the JSON response is displayed in a syntax-highlighted code block with `JetBrains Mono`
- A "Validate" button appears below structured responses (see section 6)

**Compare mode (two models):**
- Response area splits into two equal columns separated by a 0.5px vertical border
- Each column has its own model name label and metrics
- Both requests fire simultaneously on Send
- Each column has its own loading state — they resolve independently
- If one model is Anthropic and CORS blocks it, that column shows the CORS explanation card (see section 8) while the other column shows its response normally

**Loading state:**
- A subtle purple pulsing gradient bar appears at the top of the response area
- Response area shows "Waiting for response..." in muted text
- The pulsing bar disappears and the response fades in when complete

### 3.5 Metrics Bar

Fixed at the bottom of the right panel area. Displays:

- **Response time**: measured client-side from request send to response complete (e.g., "1.2s")
- **Tokens used**: pulled from the API response `usage` field if available (prompt + completion tokens). If the API doesn't return this, display "N/A"
- **Character count**: `response.length`
- **Copy response** button: copies the raw response text to clipboard with a brief "Copied!" confirmation

In compare mode, each response column shows its own inline metrics (compact pills), and the bottom bar shows a side-by-side summary.

---

## 4. API Integration

### 4.1 OpenAI

**Endpoint**: `https://api.openai.com/v1/chat/completions`

**Unstructured request:**
```js
{
  model: selectedModel,
  messages: [{ role: "user", content: promptText }],
  temperature: 0.7
}
```

**Structured request (JSON mode):**
```js
{
  model: selectedModel,
  messages: [
    {
      role: "system",
      content: "You must respond with valid JSON matching this schema: " + JSON.stringify(schema)
    },
    { role: "user", content: promptText }
  ],
  response_format: { type: "json_object" }
}
```

**Headers:**
```
Authorization: Bearer <api_key>
Content-Type: application/json
```

**Response parsing:**
- Text: `response.choices[0].message.content`
- Tokens: `response.usage.total_tokens`, `response.usage.prompt_tokens`, `response.usage.completion_tokens`

### 4.2 Anthropic

**Endpoint**: `https://api.anthropic.com/v1/messages`

**Important**: Anthropic's API does not send CORS headers, so direct browser requests will be blocked. The app must detect this gracefully (see section 8).

**Request format (for reference — will be CORS blocked from browser):**
```js
{
  model: selectedModel,
  max_tokens: 1024,
  messages: [{ role: "user", content: promptText }]
}
```

**Headers:**
```
x-api-key: <api_key>
anthropic-version: 2023-06-01
Content-Type: application/json
```

### 4.3 Error Handling

All API calls wrapped in try/catch. Handle these cases with user-friendly messages displayed in the response area:

- **No API key**: "Please add your API key in the left panel to get started."
- **Invalid API key (401)**: "Invalid API key. Please check your key and try again."
- **Rate limit (429)**: "Rate limit reached. Please wait a moment and try again."
- **CORS error (Anthropic)**: Show the CORS explanation card (section 8).
- **Network error**: "Network error. Please check your connection."
- **Timeout (30s)**: "Request timed out. The model may be under heavy load."
- **Malformed JSON (structured mode)**: "The model returned invalid JSON. Try simplifying your schema or rephrasing your prompt."

Error messages should appear in the response area with a subtle red/coral accent, not as browser alerts.

---

## 5. Structured Output Mode

When the user toggles to "Structured" mode:

### 5.1 Schema Editor

A schema editor section slides in smoothly below the output mode toggle in the left panel (or alternatively, appears as a collapsible section above the prompt textarea — implementer's choice based on what feels less cramped).

**Schema template selector**: dropdown of pre-loaded templates:
- **Element card**: `{ name: string, symbol: string, atomic_number: integer, fun_fact: string }`
- **Sentiment analysis**: `{ sentiment: string, confidence: number, key_phrases: string[], reasoning: string }`
- **RPG character**: `{ name: string, class: string, level: integer, stats: { strength: integer, dexterity: integer, intelligence: integer }, backstory: string }`
- **Threat classification**: `{ threat_level: string, agent: string, transmission: string, risk_factors: string[], recommended_action: string }`
- **Custom**: blank editor for user-defined schemas

**Schema editor textarea**: displays the JSON schema with syntax highlighting (or at minimum, monospace font). Users can edit schemas directly. The editor should validate that the schema is valid JSON in real-time — show a small green checkmark or red X indicator.

**Behavior**: when structured mode is active, the system prompt is automatically prepended to instruct the model to respond in JSON matching the schema. The user only sees and edits their prompt — the schema injection is handled by the app.

### 5.2 Structured Response Display

- JSON response displayed in a syntax-highlighted code block
- Pretty-printed with 2-space indentation
- Color coding: strings in green, numbers in amber, booleans in blue, keys in purple, null in gray
- **Copy JSON** button
- **Validate** button (triggers the schema validator — see section 6)

---

## 6. Structured Output Validator

When the user clicks "Validate" on a structured response:

### 6.1 Validation Logic

The validator compares the JSON response against the user's provided schema:

- **Field presence**: check every `required` field exists in the response
- **Type checking**: verify each field's value matches the declared type (`string`, `number`, `integer`, `boolean`, `array`, `object`)
- **Extra fields**: note any fields in the response that aren't in the schema (informational, not an error)

### 6.2 Validation Report Card

Expands inline below the response with a smooth slide-down animation. Shows a per-field breakdown:

```
┌─────────────────────────────────────────────┐
│  Schema Validation Report                   │
│                                             │
│  ✓ name         string    "Tungsten"   PASS │
│  ✓ symbol       string    "W"          PASS │
│  ✓ atomic_number integer  74           PASS │
│  ✓ fun_fact     string    "Tungsten…"  PASS │
│                                             │
│  Result: 4/4 fields passed                  │
└─────────────────────────────────────────────┘
```

Visual indicators:
- **Pass (correct type, present)**: green checkmark + `--status-success` background tint
- **Fail (missing required field)**: red X + `--status-error` background tint + "MISSING" label
- **Wrong type**: orange warning + `--status-warning` background tint + "Expected: string, Got: number"
- **Extra field (not in schema)**: blue info icon + `--status-info` tint + "Extra field"

Summary line at the bottom: "4/4 fields passed" (or "2/4 fields passed — 1 missing, 1 wrong type").

---

## 7. Prompt Library

### 7.1 Drawer UI

The prompt library is a **slide-up drawer** that overlays the bottom portion of the screen:

- Triggered by the "Prompt library" button in the left panel
- Slides up from the bottom with a `0.3s ease` animation
- Semi-transparent dark backdrop behind it (click backdrop to close)
- Maximum height: 50% of viewport
- Close button (X) in top-right corner

### 7.2 Library Contents

Each saved prompt is a card in a grid or list layout:

- **Prompt title**: auto-generated from first ~40 characters of the prompt, or user-editable
- **Prompt text**: truncated preview
- **Mode**: badge showing "Unstructured" or "Structured"
- **Schema**: if structured, the schema is saved alongside the prompt
- **Timestamp**: when it was saved (time only, since everything is in-memory and session-scoped)
- **Actions**: Load (populates the prompt textarea + schema if applicable), Delete (removes from library)

### 7.3 Storage

All in-memory. Stored in a JavaScript array. Resets on page refresh. No localStorage, no cookies, no persistence.

### 7.4 Empty State

When the library is empty, show: "No saved prompts yet. Click the save icon next to the Send button to add prompts here."

---

## 8. CORS Handling for Anthropic

When the user selects Anthropic as a provider and sends a prompt, the browser will block the request due to CORS. The app must:

1. **Detect the CORS error**: wrap the fetch in try/catch. A CORS failure typically manifests as a `TypeError: Failed to fetch` with no response body.

2. **Display a friendly explanation card** in the response area instead of a cryptic error:

```
┌─────────────────────────────────────────────────────┐
│  ⓘ  Browser Security Restriction (CORS)             │
│                                                     │
│  Anthropic's API doesn't allow direct requests      │
│  from web browsers — this is a security feature     │
│  called CORS (Cross-Origin Resource Sharing).       │
│                                                     │
│  OpenAI's API includes headers that permit browser  │
│  requests. Anthropic's is designed to be called     │
│  from a backend server.                             │
│                                                     │
│  → Try this prompt with an OpenAI model instead.    │
│  → In a production app, you'd route Anthropic       │
│    requests through your own backend server.        │
└─────────────────────────────────────────────────────┘
```

Style this card with `--status-info` blue accent, not red — it's informational, not an error. The user should understand what happened and what to do about it.

---

## 9. Side-by-Side Comparison Mode

### 9.1 Activation

Toggle switch in the left panel labeled "Compare mode." When activated:

- Smooth transition: response area splits from one column into two equal columns
- A **second model selector** ("Model B") appears below the first model dropdown in the left panel
- Model B can be any model from any provider (including the same provider as Model A)
- If Model B is from a different provider than Model A, the user may need to enter a second API key

### 9.2 Behavior

- **Send** fires both requests simultaneously (`Promise.all` or parallel fetches)
- Each column has its own:
  - Model name label (accent color)
  - Loading state (independent — one may resolve before the other)
  - Response text
  - Inline metrics pills (response time, tokens, chars)
- If one request fails (e.g., CORS for Anthropic), that column shows the error/CORS card while the other shows its response normally
- In structured mode with compare on, both columns show JSON responses, and each has its own "Validate" button

### 9.3 Deactivation

Toggling compare mode off smoothly merges back to single-column. The last Model A response is retained; Model B response is discarded.

---

## 10. Response Metrics Dashboard

### 10.1 Metrics Tracked

For every API response, capture:

- **Response time**: `performance.now()` delta from request send to response received, displayed in seconds (1 decimal)
- **Token count**: from `response.usage.total_tokens` (OpenAI). Display prompt/completion breakdown if available. Show "N/A" if the API doesn't return usage data.
- **Character count**: `response.text.length`
- **Response length**: word count (split on whitespace)

### 10.2 Display

**Metrics bar** fixed at the bottom of the response area:
- Four metric cells with muted label above and bold value below
- Separated by thin vertical dividers
- In compare mode, show metrics inline within each response column as compact pills, plus a comparative summary in the bottom bar (e.g., "Model A: 1.2s / Model B: 0.8s")

### 10.3 Copy Functionality

- "Copy response" button in the metrics bar
- Copies raw text (unstructured) or raw JSON (structured) to clipboard
- Brief "Copied!" confirmation that fades out after 1.5s

---

## 11. Interaction Details

### 11.1 Keyboard Shortcuts

- `Ctrl+Enter` / `Cmd+Enter`: Send prompt
- `Escape`: Close prompt library drawer

### 11.2 State Transitions

All mode switches should animate smoothly:

- **Unstructured → Structured**: schema editor slides in (0.3s ease), example prompts update
- **Structured → Unstructured**: schema editor slides out, example prompts revert
- **Compare off → on**: response area splits with a smooth column expansion
- **Compare on → off**: columns merge back to single view
- **Prompt library open**: drawer slides up from bottom (0.3s ease), backdrop fades in
- **Prompt library close**: drawer slides down, backdrop fades out

### 11.3 Empty / Initial States

- **No API key**: response area shows a centered message: "Add an API key to get started" with a subtle arrow pointing toward the left panel
- **No prompt sent yet**: response area shows: "Send a prompt to see the model's response here"
- **Empty prompt library**: message + instruction to use the save button
- **Structured mode, no schema**: default schema template auto-loads (element card)

---

## 12. File Structure

Single file: `index.html`

Internal organization:
```
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LLM Switchboard</title>
  <!-- Google Fonts: JetBrains Mono + DM Sans -->
  <style>
    /* CSS variables, reset, layout, components, animations */
  </style>
</head>
<body>
  <!-- All HTML structure -->
  <script>
    /* All JavaScript: state management, API calls, DOM manipulation, 
       prompt library, schema validation, metrics tracking */
  </script>
</body>
</html>
```

---

## 13. Technical Constraints

- **No frameworks**: vanilla HTML/CSS/JS only
- **No build tools**: must work by opening the file directly or serving via GitHub Pages
- **No persistent storage**: all data (keys, prompts, responses) in-memory only
- **No external API proxies**: direct browser-to-API calls only (which is why Anthropic will CORS-fail, and that's expected)
- **Single file**: everything in `index.html`
- **Responsive**: should remain functional down to ~1024px width. Below that, a graceful message suggesting a wider viewport is acceptable.

---

## 14. Deployment

1. Push `index.html` to the GitHub Organization repository
2. Enable GitHub Pages from the repository settings
3. Submit the live GitHub Pages URL to Canvas

---

## 15. Summary of All Features

| Feature | Status | Details |
|---|---|---|
| API key handling (paste + file upload) | Core | In-memory only, .env and .csv parsing |
| Provider selection (OpenAI + Anthropic) | Core | Segmented toggle |
| Model selection | Core | Dropdown per provider |
| Unstructured output mode | Core | Free-text response display |
| Structured output mode | Core | JSON schema editor + formatted response |
| Example prompts + schema templates | Core | Mode-aware, clickable |
| CORS handling for Anthropic | Core | Friendly explanation card |
| Side-by-side comparison | Stretch | Toggle, dual model selectors, parallel requests |
| Response metrics | Stretch | Time, tokens, chars, word count |
| Prompt library | Stretch | Slide-up drawer, save/load/delete, in-memory |
| Structured output validator | Stretch | Per-field type/presence check, visual report card |
