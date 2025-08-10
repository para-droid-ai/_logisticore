# Logisticore: AI vs AI Wargaming Simulation

## Overview

Logisticore is a full-stack, turn-based wargame where two AI factions (GEM-Q and AXIOM) battle across a node-based map using operational plans and tactical actions driven by LLMs. Inspired by Risk, 4X, and Alpha Centauri, it features a structured "scratchpad" reasoning framework for explainable AI, an evolving doctrine system, and an experimental generative music engine (Lyria).

**Tech stack:**
- Frontend: React 19, TypeScript, Vite, Tailwind CSS
- Backend: Node.js/Express (TypeScript)
- AI: Google Gemini API via @google/genai in frontend, @google/generative-ai in backend
- Build/Dev: Vite 6, ts-node-dev for backend
- Container (optional): Node 20-slim base with Gemini CLI sandbox Dockerfile.txt

**Status:** Active WIP. Core backend scaffolding and game logic migration completed; frontend refactor and AI integration in progress.

## Key Features

### Two AI Factions with Distinct Personas and Doctrines
- **AXIOM:** methodical attrition strategist
- **GEM-Q:** adaptive, opportunistic attacker
- See `docs/faction_personas.md` for lore, styles, and messaging examples.

### Structured AI "Scratchpad" Reasoning
- 9-section analytical framework informs operational plans (OpPlans) with transparent, inspectable rationale.
- UI surfaces scratchpad under "AI Strategic Analysis (CoT)" for OpPlans.

### Strategic Doctrine System
- Periodic doctrine choices influence strategy and economics; backend implements DOCTRINE phase flow and selection.

### Veteran Cadre System
- Train/promo veterans, upkeep modifiers, combat bonuses, and promotion logic interwoven throughout phases.

### Reconnaissance, Artillery, Infiltration, Fortification, and Resource Systems
- Constants define costs, limits, bonuses, upkeep, and rules across subsystems.

### Lyria Music Engine
- Live prompts and config drive generative soundtrack; backend exposes Lyria endpoints; frontend hook manages UI controls.

## Repository Structure

### Root (Frontend)
- `App.tsx`: main React app, orchestrates UI, panels, modals, and backend API calls
- `components/`: UI modules for game map, console, reports, modals, UI kit, Lyria
- `hooks/`: useLyriaAI custom hook
- `data/`: doctrines and multiple map data sets
- `utils/`: helper utilities (e.g., lyria utils)
- `types.ts`: comprehensive shared types (GameState, actions, OpPlan, scratchpad, Lyria)
- `constants.ts`: game rules, costs, UI colors, Lyria defaults
- Vite/TypeScript/Tailwind configs: `vite.config.ts`, `tsconfig.json`, `tailwind.config.js`
- `package.json`: frontend scripts (dev/build/preview) and deps

### Backend
- `backend/src/server.ts`: Express app, routes, Gemini initialization, CORS, JSON
- `backend/src/game/`: game.ts (init and stats), phases, utils (per project plan)
- `backend/src/routes/`: gameRoutes, lyriaRoutes
- `backend/src/services/`: geminiService (moved backend per plan)
- `backend/package.json`: scripts (start/build), deps

### Docs
- `PROJECT_PLAN.md`: evolution plan, phases, features, testing roadmap
- `docs/SCRATCHPAD_DESIGN_AND_GUIDE.md`: 9-section scratchpad spec and implementation notes
- `docs/faction_personas.md`: faction lore and style guide
- `GEMINI.md`: high-level overview, standard commands, and scratchpad prompt format

## Getting Started

### Prerequisites
- Node.js 18+ recommended (Dockerfile uses node:20-slim)
- Gemini API Key (GEMINI_API_KEY)
  - Do not commit keys. Use environment variables per Vite and backend process env.
  - Frontend expects `.env.local` with GEMINI_API_KEY; backend also reads `process.env.GEMINI_API_KEY`.

### Setup

1. **Clone and install**
   ```bash
   npm install  # at repo root to install frontend deps
   cd backend && npm install  # for backend deps
   ```

2. **Configure environment**
   - Frontend: create `.env.local` in repo root with:
     ```
     GEMINI_API_KEY=your_key_here
     ```
   - Backend: export GEMINI_API_KEY in your shell or create a backend-local env (e.g., using a process manager) so backend can initialize GoogleGenAI
   - Note: `.gitignore` excludes `*.local`; keep secrets out of VCS

3. **Run in development**
   - In one terminal (backend):
     ```bash
     cd backend
     npm run start
     # Starts Express on http://localhost:3001
     ```
   - In another terminal (frontend):
     ```bash
     npm run dev
     # Starts Vite dev server
     ```
