# Screen Relationships

This document describes how screens in the current project relate to each other based on `src/routes/AppRoutes.tsx` and the navigation calls inside major screens.

## Public Flow
- **`/` – `WelcomeScreen`**
  - Links to `LoginScreen` (`/login`) and `RegisterScreen` (`/register`).
- **`/login` – `LoginScreen`**
- **`/register` – `RegisterScreen`**

## User Portal
- **`/user` – `UserDashboardScreen`**
  - Continue active workout → `/active-session/:sessionId`
  - "Log Exercise" → `/user/log-exercise`
  - "My Plans" → `/user/my-plans`
  - "Progress" → `/user/progress`
  - "Workout History" → `/workout-session`
  - "Browse Exercises" → `/user/exercise-library`
- **`/user/my-plans` – `MyWorkoutPlansScreen`** (links to view/edit workout plans)
- **`/user/log-exercise` – `StartWorkoutScreen`** (creates a new active session)
- **`/active-session/:sessionId` – `ActiveWorkoutSessionScreen`**
- **`/gyms` – `GymsScreen`**
  - Create a gym → `/gyms/create`
  - View a gym → `/gyms/:gymId`
- **`/gyms/create` – `GymCreateScreen`**
- **`/gyms/:gymId` – `GymDetailScreen`**
  - Manage equipment (for managers) → `/gym-admin/gyms/:gymId/equipment`
- **`/profile` – `ProfileScreen`**
- **`/user/exercise-library` – `ExerciseLibraryScreen`**
  - View exercise → `/user/exercise/:exerciseId`
- **`/user/exercise/:exerciseId` – `ExerciseDetailScreen`**
- **`/user/progress` – `ProgressOverviewScreen`**
- **`/user/view-plan/:id` – `WorkoutPlanViewScreen`**
- **`/user/edit-plan` – `WorkoutPlanBuilderScreen`**
- **`/workout-session` – `WorkoutSessionHistoryScreen`**
  - Session detail → `/workout-session/:sessionId`
- **`/workout-session/:sessionId` – `WorkoutSessionDetailScreen`**

## App Management Portal (Admin)
- **`/admin` – `AppManagementDashboardScreen`**
  - Review pending gyms → `/pending-gyms`
  - Manage global equipments → `/equipment`
  - Manage global exercises → `/exercise`
  - Manage workout plans → `/workoutplan/builder`
  - Manage system catalogs → `/admin/catalog`
- **`/pending-gyms` – `PendingGymsScreen`**
- **`/equipment` – `GlobalEquipmentListScreen`**
  - Create → `/equipment/create`
  - Edit → `/equipment/edit/:id`
- **`/exercise` – `ExerciseListScreen`**
  - Create → `/exercise/create`
  - Edit → `/exercise/edit/:id`
- **`/users` – `UsersScreen`**
  - User detail → `/users/:id`
- **`/users/:id` – `UserDetailScreen`**
- **`/admin/catalog` – `AdminSystemCatalogScreen`**
  - Equipment catalog → `/admin/catalog/equipment`
  - Exercise catalog → `/admin/catalog/exercise`
  - Workout plan catalog → `/admin/catalog/workoutplan`
  - Metric catalog → `/admin/catalog/metrics`

## Gym Management Portal
- **`/gym-admin` – `GymManagementDashboardScreen`**
  - Select gym → `/gym-admin/gyms/:gymId`
- **`/gym-admin/gyms/:gymId` – `GymManagementScreen`**
  - Edit gym → `/gym-admin/gyms/:gymId/edit`
  - Manage equipment → `/gym-admin/gyms/:gymId/equipment`
  - Manage staff → `/gym-admin/gyms/:gymId/staff`
- **`/gym-admin/gyms/:gymId/equipment` – `GymEquipmentListScreen`**
- **`/gym-admin/gyms/:gymId/equipment/:gymEquipmentId` – `GymEquipmentDetailScreen`**

## Fallback
- Any unknown route renders `NoResults` ("Page not found.")

## Default Route by Role
The helper in `src/routes/guards.ts` chooses the landing route:
- Admin/Moderator → `/admin`
- Gym manager → `/gym-admin`
- Regular user → `/user`
- Unauthenticated → `/`

# Proposed Module Reorganization
The current `src/modules` folder mixes feature logic (e.g., `exercise`) with "portals" that group screens by user role. A clearer structure can separate **features** from **portals** and keep all domain logic in one place.

Example layout:

```
src/
  features/
    auth/
    users/
    gyms/
    equipment/
    exercises/
    workout-plans/
    workout-sessions/
  portals/
    public/        # Welcome / login / register
    user/          # User dashboard and related flows
    gym-admin/     # Gym management screens
    admin/         # Application management screens
  shared/
    components/
    hooks/
    context/
    theme/
```

**Features** contain GraphQL files, hooks, and domain-specific components and screens. **Portals** are thin wrappers that compose feature screens based on the user role. This keeps each feature self-contained while letting portals assemble the screens needed for a particular role.
