# Roots & Echoes — Interactive 3D Family Tree & Living Archive

A high-craft, Framer-inspired interactive 3D web application for exploring and preserving a living generational family archive. Built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Three.js (`@react-three/fiber` & `@react-three/drei`)**, and **Framer Motion**, structured for zero-config deployment on Vercel.

## Features

- **Interactive 3D "Tree of Life" (WebGL / R3F)**
  - **3D Organic Tree Mode**: Volumetric curved `TubeGeometry` branches, sculpted root network, partner bridges, and drifting bioluminescent pollen particles.
  - **Radial "Tree of Life" Map**: Phylogenetic circular hierarchy radiating outward from the earliest ancestors in the center to the youngest generation on the outer ring, with smooth animated node interpolation between layouts.
  - **Cinematic Camera Flight**: Clicking any relative glides the camera smoothly (`OrbitControls` + lerp) to frame them while illuminating their entire direct lineage (ancestors, descendants, and partner) in warm gold and dimming unrelated branches.
  - **Instant Search & Generation Filters**: Floating search bar (`/` shortcut) to jump directly to any relative, plus generation filter pills.
- **Family Member Dossier (Slide-Over Glass Drawer)**
  - **Header**: Circular portrait medallion, full & maiden name, lifespan / calculated age, birthplace, occupation, clickable relationship chips (Parents, Partner, Children), and quick **Link Relative** action.
  - **Life & Stories**: Narrative biography, chronological milestone timeline, interactive memory photo gallery with lightbox, and inline **Add Memory** photo uploader.
  - **Beliefs & Ideologies**: Core values, editorial life philosophy, favorite quotes, cultural/spiritual outlook, and a letter written for future generations.
  - **Health & Genetics**: Structured hereditary log, blood type, longevity notes, and guidance for descendants concealed behind a privacy-gated **"Sensitive Health Info — Click to Reveal"** toggle.
  - **Digital Echo (AI Persona)**: Interactive *"Converse with [First Name]"* chat synthesizing their stories, beliefs, era, and family ties. Works immediately out of the box with a built-in persona synthesizer, and upgrades automatically when `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` is configured in Vercel environment variables.
- **Frictionless Contribution & Archive Backup**
  - **3-Step Guided Wizard (`+ Add to the Tree`)**: Identity & lineage linking, drag-and-drop portrait uploader with client-side square zoom cropping + multi-photo gallery upload, and inviting story/beliefs/genetics prompts.
  - **Instant Local Persistence & JSON Backup**: All additions and uploaded memories persist automatically in `localStorage`, with **Export / Import Family Archive (`.json`)** and **Reset Demo Archive** inside Settings.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Optional Live AI Persona Configuration (Vercel)

The **Digital Echo** tab works out of the box in zero-config Archival Echo mode. To enable live LLM responses via `/api/chat`, set either of the following environment variables in `.env.local` or your Vercel project settings:

```env
# Option A: OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

# Option B: Anthropic
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-5-haiku-latest
```

## Architecture

```text
app/
  api/chat/route.ts          # OpenAI / Anthropic / Simulated Persona endpoint
  globals.css                # Obsidian-forest & bioluminescent gold tokens
  layout.tsx                 # Instrument Serif + Plus Jakarta Sans fonts
  page.tsx                   # Entry point
components/
  tree/                      # WebGL TreeCanvas, OrganicBranches, MemberNode, AmbientPollen, TreeViewport (ssr: false)
  dossier/                   # MemberDossier + LifeStories, Beliefs, HealthGenetics, DigitalClone tabs
  wizard/                    # 3-step AddMemberWizard with client-side portrait cropping
  hud/                       # Floating TopBar & BottomControls
  modals/                    # ArchiveSettingsModal (JSON Export/Import/Reset)
data/
  seedFamily.ts              # 4-generation, 14-member Vance–Moreau–Sato–Okafor archive (1918–Present)
lib/
  lineage.ts                 # Dynamic 3D Organic & Radial layout engine + lineage traversal
  persona.ts                 # Persona system prompt builder & simulated echo engine
  portraits.ts               # Era-styled archival portrait & memory plate generators
  storage.ts                 # SSR-safe localStorage persistence & JSON export/import
types/
  family.ts                  # Strict TypeScript interfaces
```
