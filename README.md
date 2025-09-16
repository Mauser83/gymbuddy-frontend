# GymBuddy — Frontend (Stable / No CV)

React Native + Expo app for managing gyms, equipment, exercises, workout plans, and workout sessions.

> **Showcase only.** This repository is a portfolio showcase and is **not runnable** without the private backend. If you’d like to test the app, request **TestFlight** access.

## Highlights (what this branch actually does)
- **Auth + roles** (login required) → feature access is gated.
- **CRUD domains**
  - **Exercises** CRUD
  - **Global equipment** CRUD
  - **Gyms** CRUD + **approval workflow** for newly submitted gyms
  - **Gym-specific equipment** CRUD (**allowed before approval**) so the creator can set up the gym immediately
- **Workout plans** CRUD (create, edit, create from session, delete)
- **Workout sessions**
  - **Ad-hoc** session in any gym (log sets; optionally save as a plan)
  - **Guided** sessions from a chosen plan (step-through flow)

## Branch strategy
- **master** — stable app without CV features (this branch)
- **CV_dev** — ongoing Computer Vision work (WIP): **[README](https://github.com/Mauser83/gymbuddy-frontend/blob/CV_dev/README.md)**

## Tech stack (frontend)
- **Expo / React Native / TypeScript**
- Navigation, forms, and local state with lightweight utilities (no secrets in JS)
- EAS build profiles (e.g., `production`) — used internally to ship store builds

## Architecture (how to read the code)
- **Entry**: app bootstrap + providers → navigation → screens
- **Domain modules**: `/features/{exercises|equipment|gyms|workout-plans|workout-sessions}`
- **API layer**: minimal fetch wrappers targeting the private backend
- **Shared UI**: reusable inputs, list cards, banners, toasts
- Start with:
  1. `App.tsx` — providers + navigation
  2. `src/routes/*` — route tree and guards
  3. `src/features/gyms/*` — gyms + approval + gym equipment
  4. `src/features/workout-plans/*` — for building plans
  5. `src/features/workout-sessions/*` — ad-hoc and guided sessions
  6. `src/config/env.ts` — environment wiring

## Directory layout (short)
```
assets/  # fonts, icons
src/
  config/    # env helpers
  features/  # domain modules (exercises, equipment, gyms, workout-plans, workout-sessions)
  routes/    # navigation + guards
  services/  # API helpers
  shared/    # UI components, theme, hooks
  types/     # shared TS types
```

## Screens & flows (flagship)
- **Gyms**: list, create, submit for approval, manage **gym equipment** even without approval.
- **Equipment (global)**: create & categorize equipment used across gyms.
- **Exercises**: define/edit exercises and equipment associations.
- **Workout Plans**: build plans; clone from a session or hand-craft.
- **Workout Session**
  - **Ad-hoc**: pick a gym, log sets; “Save as plan” option
  - **Guided**: follow a plan with step-through

## Environment variables
See [`.env.example`](./.env.example). Do not commit real credentials.

| NAME | Purpose | Required | Scope |
| --- | --- | --- | --- |
| `API_URL` | Backend API base URL (prod) | Yes | web / iOS / Android |
| `API_DEV_URL` | Backend API base URL (dev) | No | web / iOS / Android |
| `GOOGLE_MAPS_API_KEY` | Google Places API key | Yes | iOS / Android |
| `EXPO_PUBLIC_API_URL` | Backend API base URL (public runtime) | Yes | web / iOS / Android |

> Use `env.ts` to shim alternate public var names if needed.

## Run locally
This repository is a **showcase**. The app **does not run** without the private backend.

- Local runs are **not supported**.
- If you’d like to try the app, request **TestFlight access**.

```bash
# For contributors with backend access only:
npm ci
npx expo start
```

## Build & profiles
- `production` — EAS internal profile used to produce store/TestFlight builds.
- Submit uses App Store Connect API key (no Apple ID in repo).

## Security notes
- No secrets in repo; frontend reads only public env vars.
- Master uses a client Places key — restrict to required APIs and set quotas.
- Backend endpoints enforce auth; CORS is handled server-side.

## Limitations & roadmap (for master)
- Not self-hostable; backend is private.
- Add more stats dashboards and filters.
- Offline caching for recent sessions and plans.
- Add lint/test workflows on master (basic build already covered).
- Planned analytics: aggregate views (e.g., exercise/equipment usage, total volume, recency by gym) powered by the existing relationships. (Not yet in the UI.)

## License
All Rights Reserved (showcase only).

## Contact
Mauno Elo — mauser83@hotmail.com  
**TestFlight:** access on request.