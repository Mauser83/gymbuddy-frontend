# GymBuddy — Frontend (CV_dev / Computer Vision WIP)

This branch extends **master** with computer vision features for gym equipment recognition and curation. It keeps all of master’s CRUD and workout flows and layers CV on top.

> **Showcase only.** This repository is a portfolio showcase and is **not runnable** without the private backend and CV infrastructure. For access, request **TestFlight**.

> Looking for the stable app? Browse **[master branch](https://github.com/Mauser83/gymbuddy-frontend/tree/master)**.

## What’s different vs `master`

- Camera/image-based **equipment recognition** powered by KNN over embeddings
- **Admin portal** tools for taxonomy, ingestion, moderation, inspection
- **Gym-admin portal** tools for per-gym image management and approvals
- **User portal** capture flow with optional **training contribution** (opt-in)

## Implementation timeline (how we built it)

- **Admin portal (first)**
  - **TaxonomiesScreen** — manage CV taxonomies (angle, distance, lighting, etc.)
  - **BatchCaptureScreen** — upload batches (no camera) to a chosen gym/equipment
  - **WorkerTasksScreen** — monitor pipeline jobs (**hash → safety → embed**), inspect failures
  - **ImageManagementScreen** — approve/reject; surface safety flags (hasPerson/NSFW); approved images become searchable in **gym-specific KNN** and may be **promoted to global**
  - **KnnPlaygroundScreen** — test nearest-neighbor queries interactively
  - **SigningVerifierScreen** — verify R2 upload signing, TTL, and access rules
- **User portal**
  - **EquipmentRecognitionCaptureScreen** — capture for recognition; uploads to a short-TTL “recognition” area
  - User can **opt-in** to submit the capture as training material for that gym’s equipment
- **Gym-admin portal**
  - **GymEquipmentDetailScreen** — upload/capture images for a gym’s equipment; images enter the **hash → safety → embed** pipeline automatically (no central approval needed for gym-specific images managed by the gym)
  - **GymTrainingCandidatesScreen** — review user-submitted images; approve to include in gym-specific KNN; if global inventory is sparse, candidate may be **promoted to global** as well
- **Admin portal (global curation)**
  - **GlobalCurationScreen** — approve/reject **global equipment images** for use in the global KNN

## Architecture (CV path)

**Data model**

- **Global images** represent canonical equipment visuals (used across gyms).
- **Gym-specific images** tailor recognition to local conditions (lighting, layout, angles).

**Processing pipeline** (server-side):  
**ingest → hash → safety → embed → index**

- **Hash**: dedupe
- **Safety**: flag hasPerson/NSFW; block if needed
- **Embed**: generate vector embeddings (current server model)
- **Index**: update **KNN** structures (global and/or per-gym)

**Recognition flow**

1. Capture (user or gym-admin)
2. Upload (signed URL / R2; TTL enforced)
3. Server computes embedding and queries **KNN(global ∪ gym)**
   - gym-specific images increase accuracy under local variation
   - globals act as canonical references
4. Return top matches; user/admin confirms/overrides

**Approval & promotion**

- **Gym-specific approval**:
  - Admin-added gym images: **no central approval required** (gym manages its own images)
  - User-submitted images: reviewed in **GymTrainingCandidatesScreen**
- **Promotion to global**:
  - If a gym-approved image fills diversity gaps (e.g., fewer than N globally with sufficient KNN spacing), it’s queued for **global** review in **GlobalCurationScreen**

**Tooling**

- **Taxonomies**: capture conditions (angle/distance/lighting) attached to images
- **KNN playground**: rapid iteration on search & thresholds
- **Signing verifier**: validates upload policies and TTLs

## Current behavior & guarantees

- A **new gym** can add equipment images **before approval**; approval only controls visibility to other users.
- Recognition considers both **global** and **gym-specific** images; gym-specific images bias results toward local conditions.
- User captures for recognition are short-lived unless the user **opts-in** to submit for training.

## Roadmap

- **Auto-promotion on gym-admin uploads**: if global inventory < threshold and KNN diversity is low, flag for global promotion automatically.
- **Gym-admin “recognize to add”**: use recognition (global KNN) to add equipment to a gym.
- **On-device model**: ship a smaller model + adapter; bundle embeddings for global + per-gym data; perform recognition locally.
- **Real-time recognition UX**: live camera hints (“last workout on this equipment”, “exercises you can do”, “use this equipment” to start a session).
- **Quality & UX**: confidence visualization, fallback flows, better error surfacing in WorkerTasks.

## Tech stack (frontend deltas)

- **Expo / React Native / TypeScript** (same base as master)
- CV UI components for capture/preview/result & admin workflows
- EAS profile **`cvdev`** (side-by-side install; distinct bundle IDs/scheme)
- iOS submit via **App Store Connect API key** (no Apple ID in repo)

## Key paths (where to read the code)

- `src/src/features/cv/*` — CV UI (capture, results, admin tools) _(WIP)_
- `src/src/features/workout-sessions/*` — integrates recognition into session flows _(future)_
- `src/src/features/gyms/*` — gym equipment mgmt; training candidates review
- `src/config/env.ts` — env wiring for cvdev profile

## Environment variables

See [`.env.example`](./.env.example). Values are intentionally **blank**.

| NAME                      | Purpose                                           | Required | Scope               |
| ------------------------- | ------------------------------------------------- | -------- | ------------------- |
| `EXPO_PUBLIC_API_URL`     | Backend API base URL (current primary)            | Yes      | web / iOS / Android |
| `EXPO_PUBLIC_API_DEV_URL` | Legacy dev API base URL (kept for history/compat) | No       | web / iOS / Android |

> Historically we used **two backends** (prod & dev). Today both vars typically point to the same backend, but we keep the dev var for clarity and backward compatibility. These are **public** build-time vars; no secrets here.

## Run locally

This branch is a **showcase**. It **does not run** without the private backend and CV model hosting.

- Local runs are **not supported**.
- For device evaluation, request **TestFlight** access.

```bash
# For contributors with backend access only:
npm ci
npx expo start
```

## Build & profiles

- EAS profile **`cvdev`** (side-by-side install; distinct bundle IDs/scheme)
- iOS submit via **App Store Connect API key** (no Apple ID in repo)

## Security notes

- No client secrets in the app; API base URL only.
- Uploads use signed URLs with TTL; images pass **safety** checks (hasPerson/NSFW) before embedding.
- Places/other third-party calls are proxied by the backend.

## License

All Rights Reserved (showcase only).

## Contact

Mauno Elo — mauser83@hotmail.com  
**TestFlight:** access on request.
