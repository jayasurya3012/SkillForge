# SkillForge — Circuit Learning Simulator

An interactive Arduino circuit learning platform that combines a 3D simulator, AI-powered project generation, step-by-step mentoring, and AI-generated tutorial videos to teach electronics from scratch.

## What It Does

SkillForge lets users describe a circuit in plain English (e.g., "Blink an LED with Arduino"), then generates a full guided tutorial with:

- A 3D interactive canvas where you drag, drop, and wire components
- Step-by-step mentor guidance with visual arrows showing exactly where to connect
- AI-generated tutorial videos (via OpenAI Sora) for each step
- Real-time validation that checks your circuit as you build
- Circuit simulation to test your completed project

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (Vite + React)            │
│                                                     │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────┐ │
│  │ AI Chat  │  │ 3D Simulator │  │ Mentor Panel  │ │
│  │ Panel    │  │ (Three.js)   │  │ (Steps/Guide) │ │
│  └────┬─────┘  └──────────────┘  └───────────────┘ │
│       │                                             │
│  ┌────┴──────────────────────────────────────────┐  │
│  │              Zustand Store                     │  │
│  └────┬──────────────────────────────────────────┘  │
│       │                                             │
│  ┌────┴─────┐  ┌────────────┐  ┌────────────────┐  │
│  │ Groq LLM │  │ Validation │  │ Video Service  │  │
│  │ (browser)│  │ Engine     │  │ (calls backend)│  │
│  └──────────┘  └────────────┘  └───────┬────────┘  │
└────────────────────────────────────────┼────────────┘
                                         │
┌────────────────────────────────────────┼────────────┐
│              Backend (Express.js)       │            │
│                                        ▼            │
│  ┌──────────┐  ┌──────────┐  ┌─────────────────┐   │
│  │ Chat API │  │ Image API│  │ Video API       │   │
│  │ (Groq)   │  │(Replicate│  │ (OpenAI Sora)   │   │
│  └──────────┘  └──────────┘  └─────────────────┘   │
│                                                     │
│  ┌──────────┐  ┌──────────┐                         │
│  │PostgreSQL│  │  Redis   │                         │
│  └──────────┘  └──────────┘                         │
└─────────────────────────────────────────────────────┘
```

## Tech Stack

**Frontend:**
- React 19 + TypeScript
- Three.js / React Three Fiber — 3D circuit simulator
- Zustand — state management
- Tailwind CSS v4 — styling
- Groq SDK — LLM calls directly from browser for project generation
- Vite — build tool
- Vitest + fast-check — testing (property-based)

**Backend:**
- Express.js (Node.js, ES modules)
- OpenAI API — Sora video generation
- Replicate API — image generation (FLUX.1 schnell)
- PostgreSQL (Neon) — persistent storage
- Redis (Upstash) — caching/sessions
- Helmet + CORS + rate limiting — security

## Project Structure

```
├── src/                          # Frontend source
│   ├── components/
│   │   ├── chat/                 # AI Assistant chat panel
│   │   ├── layout/               # App layout (header, sidebar)
│   │   ├── library/              # Component library drawer
│   │   ├── simulator/            # 3D simulator canvas & models
│   │   │   ├── models/           # 3D component models (Arduino, LED, etc.)
│   │   │   ├── SimulatorCanvas3D.tsx
│   │   │   ├── Wire3D.tsx
│   │   │   ├── Terminal3D.tsx
│   │   │   └── GuidanceOverlay3D.tsx
│   │   └── steps/                # Step instructions & mentor panel
│   ├── services/
│   │   ├── ChatbotService.ts     # Groq LLM integration + video orchestration
│   │   ├── VideoGenerationService.ts  # Calls backend for Sora videos
│   │   ├── ComponentLibrary.ts   # Available circuit components registry
│   │   ├── MentorService.ts      # Step guidance logic
│   │   ├── ValidationEngine.ts   # Circuit validation
│   │   ├── SimulatorEngine.ts    # Simulator state management
│   │   ├── CircuitSimulator.ts   # Circuit simulation logic
│   │   └── DemoProjects.ts       # Pre-built demo tutorials
│   ├── store/index.ts            # Zustand global state
│   ├── types/index.ts            # TypeScript interfaces
│   └── test/                     # Test suites
│
├── backend/                      # Backend API server
│   └── src/
│       ├── index.js              # Express app entry point
│       ├── routes/
│       │   ├── videos.js         # POST /api/videos/generate (Sora)
│       │   ├── images.js         # POST /api/images/generate (Replicate)
│       │   ├── chat.js           # Chat endpoints
│       │   ├── tutorials.js      # Tutorial CRUD
│       │   ├── components.js     # Component data
│       │   └── sessions.js       # Session management
│       ├── lib/
│       │   ├── db.js             # PostgreSQL connection
│       │   ├── redis.js          # Redis connection
│       │   ├── groq.js           # Groq client
│       │   └── replicate.js      # Replicate client
│       └── db/
│           ├── schema.sql        # Database schema
│           └── migrate.js        # Migration runner
│
├── .env                          # Frontend env vars
├── backend/.env                  # Backend env vars
├── vite.config.ts                # Vite configuration
└── package.json                  # Frontend dependencies
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### 1. Install dependencies

```bash
# Frontend
npm install

# Backend
cd backend
npm install
```

### 2. Configure environment variables

**Frontend** (`.env` in project root):
```env
VITE_GROQ_API_KEY=your_groq_api_key
VITE_BACKEND_URL=http://localhost:3001
```

**Backend** (`backend/.env`):
```env
PORT=3001
GROQ_API_KEY=your_groq_api_key
REPLICATE_API_TOKEN=your_replicate_token
OPENAI_API_KEY=your_openai_api_key
DATABASE_URL=postgresql://user:pass@host:5432/dbname
REDIS_URL=rediss://default:token@host:6379
CORS_ORIGIN=http://localhost:5173
```

### 3. Run the app

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
npm run dev
```

Open the URL shown by Vite (typically `http://localhost:5173`).

## How It Works

### 1. Project Generation
Type a circuit description in the AI chat panel. The Groq LLM (llama-3.3-70b) generates a structured `CircuitProject` JSON with components, steps, connections, and expected states.

### 2. Step-by-Step Mentor
Each step focuses on one action — either placing a component or making a single wire connection. The mentor panel shows:
- Checklist of components needed
- Connection checklist with source → target terminals
- Next action banner highlighting what to do
- Progress bar per step

### 3. 3D Simulator
Drag components from the library onto the Three.js canvas. Click terminals to create wire connections. The simulator renders:
- Arduino Uno, resistors, LEDs, buzzers, PIR sensors, breadboards
- Animated terminal highlights showing where to connect
- 3D guidance arrows between source and target terminals
- Color-coded wires

### 4. Video Generation
When a project loads, tutorial videos are generated in parallel via OpenAI Sora (`sora-2` model, 8-second clips at 1280x720). The backend:
1. Submits all video jobs to `POST /v1/videos` simultaneously
2. Polls each job every 10 seconds until completed
3. Proxies the video content through `GET /api/videos/:id/content`

Videos appear in the mentor panel with autoplay and loop.

### 5. Validation
Click "Validate Step" to check your circuit against the expected state. The validation engine verifies:
- All required components are placed
- All required connections exist (bidirectional matching)
- Reports missing connections with hints

On success, it auto-advances to the next step.

### 6. Circuit Simulation
Click "Run Simulation" to simulate the completed circuit. The engine traces current flow and reports component states (LED on/off, buzzer active, etc.).

## Available Components

| Component | ID | Terminals |
|---|---|---|
| Arduino Uno | `arduino-uno` | 5V, GND, D9-D13, A0-A1 |
| 220Ω Resistor | `resistor-220` | Lead 1, Lead 2 |
| 10kΩ Resistor | `resistor-10k` | Lead 1, Lead 2 |
| Red LED | `led-red` | Anode (+), Cathode (-) |
| Green LED | `led-green` | Anode (+), Cathode (-) |
| Buzzer | `buzzer` | Positive, Negative |
| PIR Sensor | `pir-sensor` | VCC, GND, OUT |
| Breadboard | `breadboard` | Row connections |

## Demo Project

Click "Try Demo Tutorial" in the chat panel to load a pre-built LED Blink circuit with 6 steps:
1. Place Arduino Uno
2. Place 220Ω Resistor
3. Place Red LED
4. Connect D13 → Resistor Lead 1
5. Connect Resistor Lead 2 → LED Anode
6. Connect LED Cathode → GND

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/videos/generate` | Generate tutorial video (Sora) |
| GET | `/api/videos/:id/content` | Proxy video content from OpenAI |
| POST | `/api/images/generate` | Generate circuit diagram (Replicate) |
| POST | `/api/chat` | Chat with AI tutor |
| GET | `/api/tutorials` | List tutorials |
| GET | `/api/components` | List available components |
| GET | `/health` | Health check |

## Running Tests

```bash
npm run test:run
```

Tests use Vitest with fast-check for property-based testing of the validation engine, simulator engine, component library, and progress tracker.

## License

MIT
