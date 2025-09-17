import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Route, Routes, useNavigate, useLocation } from 'react-router-native';

import { useAuth } from 'features/auth/context/AuthContext';
import { useRole } from 'features/auth/context/RoleContext';

// Screens
import AdminEquipmentCatalogScreen from 'portals/admin/AdminEquipmentCatalogScreen';
import AdminExerciseCatalogScreen from 'portals/admin/AdminExerciseCatalogScreen';
import AdminMetricCatalogScreen from 'portals/admin/AdminMetricCatalogScreen';
import AdminSystemCatalogScreen from 'portals/admin/AdminSystemCatalogScreen';
import AdminWorkoutPlanCatalogScreen from 'portals/admin/AdminWorkoutPlanCatalogScreen';
import AppDashboardScreen from 'portals/admin/AppManagementDashboardScreen';
import CreateEquipmentScreen from 'portals/admin/CreateEquipmentScreen';
import CreateExerciseScreen from 'portals/admin/CreateExerciseScreen';
import EditEquipmentScreen from 'portals/admin/EditEquipmentScreen';
import EditExerciseScreen from 'portals/admin/EditExerciseScreen';
import ExerciseListScreen from 'portals/admin/ExerciseListScreen';
import GlobalEquipmentListScreen from 'portals/admin/GlobalEquipmentListScreen';
import PendingGymsScreen from 'portals/admin/PendingGymsScreen';
import UserDetailScreen from 'portals/admin/UserDetailScreen';
import UsersScreen from 'portals/admin/UsersScreen';
import GymEquipmentListScreen from 'portals/gym-admin/GymEquipmentListScreen';
import GymAdminDashboard from 'portals/gym-admin/GymManagementDashboardScreen';
import GymManagementScreen from 'portals/gym-admin/GymManagementScreen';
import LoginScreen from 'portals/public/LoginScreen';
import RegisterScreen from 'portals/public/RegisterScreen';
import WelcomeScreen from 'portals/public/WelcomeScreen';
import TrainerDashboardScreen from 'portals/trainer/TrainerDashboardScreen';
import ActiveWorkoutSessionScreen from 'portals/user/ActiveWorkoutSessionScreen';
import ExerciseDetailScreen from 'portals/user/ExerciseDetailScreen';
import ExerciseLibraryScreen from 'portals/user/ExerciseLibraryScreen';
import FriendsScreen from 'portals/user/FriendsScreen';
import GroupsScreen from 'portals/user/GroupsScreen';
import GymCreateScreen from 'portals/user/GymCreateScreen';
import GymDetailScreen from 'portals/user/GymDetailScreen';
import GymsScreen from 'portals/user/GymsScreen';
import LeaderboardsScreen from 'portals/user/LeaderboardsScreen';
import MessagesScreen from 'portals/user/MessagesScreen';
import MyWorkoutPlansScreen from 'portals/user/MyWorkoutPlansScreen';
import ProfileScreen from 'portals/user/ProfileScreen';
import ProgressOverviewScreen from 'portals/user/ProgressOverviewScreen';
import RoleSelectScreen from 'portals/user/RoleSelectScreen';
import StartWorkoutScreen from 'portals/user/StartWorkoutScreen';
import UserDashboardScreen from 'portals/user/UserDashboardScreen';
import WorkoutPlanBuilderScreen from 'portals/user/WorkoutPlanBuilderScreen';
import WorkoutPlanViewScreen from 'portals/user/WorkoutPlanViewScreen';
import WorkoutSessionDetailScreen from 'portals/user/WorkoutSessionDetailScreen';
import WorkoutSessionHistoryScreen from 'portals/user/WorkoutSessionHistoryScreen';
import Footer from 'shared/components/Footer';
import Header from 'shared/components/Header';
import NoResults from 'shared/components/NoResults';
import { MetricRegistryProvider } from 'shared/context/MetricRegistry';

import { getDefaultRouteForRole } from './guards';
import RequireRole from './RequireRole';

const AppRoutes = () => {
  const { user, isAuthenticated, sessionLoaded } = useAuth();
  const { activeRole, loaded } = useRole();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!sessionLoaded || !loaded) return;

    const publicRoutes = ['/', '/login', '/register'];

    // Unauthenticated user trying to access protected route
    if (!isAuthenticated && !publicRoutes.includes(location.pathname)) {
      navigate('/');
      return;
    }

    // Authenticated user landing on root ("/")
    if (isAuthenticated && location.pathname === '/') {
      navigate(getDefaultRouteForRole(activeRole));
    }
  }, [sessionLoaded, loaded, isAuthenticated, activeRole, location.pathname, navigate]);

  return (
    <MetricRegistryProvider>
      <Header />
      <View style={{ flex: 1 }}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<WelcomeScreen />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/register" element={<RegisterScreen />} />
          <Route path="/select-role" element={<RoleSelectScreen />} />

          {/* User Portal */}
          <Route
            path="/user"
            element={
              <RequireRole roles={['user']}>
                <UserDashboardScreen />
              </RequireRole>
            }
          />
          <Route
            path="/user/my-plans"
            element={
              <RequireRole roles={['user']}>
                <MyWorkoutPlansScreen />
              </RequireRole>
            }
          />
          <Route
            path="/user/log-exercise"
            element={
              <RequireRole roles={['user']}>
                <StartWorkoutScreen />
              </RequireRole>
            }
          />
          <Route
            path="/active-session/:sessionId"
            element={
              <RequireRole roles={['user']}>
                <ActiveWorkoutSessionScreen />
              </RequireRole>
            }
          />
          <Route path="/gyms" element={<GymsScreen />} />
          <Route path="/gyms/create" element={<GymCreateScreen />} />
          <Route path="/gyms/:gymId" element={<GymDetailScreen />} />
          <Route
            path="/profile"
            element={
              <RequireRole roles={['user', 'admin', 'gym-manager', 'trainer']}>
                <ProfileScreen />
              </RequireRole>
            }
          />
          <Route
            path="/user/exercise-library"
            element={
              <RequireRole roles={['user']}>
                <ExerciseLibraryScreen />
              </RequireRole>
            }
          />
          <Route
            path="/user/exercise/:exerciseId"
            element={
              <RequireRole roles={['user']}>
                <ExerciseDetailScreen />
              </RequireRole>
            }
          />
          <Route
            path="/user/progress"
            element={
              <RequireRole roles={['user']}>
                <ProgressOverviewScreen />
              </RequireRole>
            }
          />
          <Route
            path="/user/view-plan/:id"
            element={
              <RequireRole roles={['user']}>
                <WorkoutPlanViewScreen />
              </RequireRole>
            }
          />
          <Route
            path="/user/edit-plan"
            element={
              <RequireRole roles={['user']}>
                <WorkoutPlanBuilderScreen />
              </RequireRole>
            }
          />
          <Route
            path="/user/friends"
            element={
              <RequireRole roles={['user']}>
                <FriendsScreen />
              </RequireRole>
            }
          />
          <Route
            path="/user/groups"
            element={
              <RequireRole roles={['user']}>
                <GroupsScreen />
              </RequireRole>
            }
          />
          <Route
            path="/user/leaderboards"
            element={
              <RequireRole roles={['user']}>
                <LeaderboardsScreen />
              </RequireRole>
            }
          />
          <Route
            path="/user/messages"
            element={
              <RequireRole roles={['user']}>
                <MessagesScreen />
              </RequireRole>
            }
          />
          <Route
            path="/workout-session"
            element={
              <RequireRole roles={['user']}>
                <WorkoutSessionHistoryScreen />
              </RequireRole>
            }
          />
          <Route
            path="/workout-session/:sessionId"
            element={
              <RequireRole roles={['user']}>
                <WorkoutSessionDetailScreen />
              </RequireRole>
            }
          />

          {/* App Management Portal */}
          <Route
            path="/admin"
            element={
              <RequireRole roles={['admin']}>
                <AppDashboardScreen />
              </RequireRole>
            }
          />
          <Route
            path="/pending-gyms"
            element={
              <RequireRole roles={['admin']}>
                <PendingGymsScreen />
              </RequireRole>
            }
          />
          <Route
            path="/equipment"
            element={
              <RequireRole roles={['admin']}>
                <GlobalEquipmentListScreen />
              </RequireRole>
            }
          />
          <Route
            path="/equipment/create"
            element={
              <RequireRole roles={['admin']}>
                <CreateEquipmentScreen />
              </RequireRole>
            }
          />
          <Route
            path="/equipment/edit/:id"
            element={
              <RequireRole roles={['admin']}>
                <EditEquipmentScreen />
              </RequireRole>
            }
          />
          <Route
            path="/exercise"
            element={
              <RequireRole roles={['admin']}>
                <ExerciseListScreen />
              </RequireRole>
            }
          />
          <Route
            path="/exercise/create"
            element={
              <RequireRole roles={['admin']}>
                <CreateExerciseScreen />
              </RequireRole>
            }
          />
          <Route
            path="/exercise/edit/:id"
            element={
              <RequireRole roles={['admin']}>
                <EditExerciseScreen />
              </RequireRole>
            }
          />
          <Route
            path="/users"
            element={
              <RequireRole roles={['admin']}>
                <UsersScreen />
              </RequireRole>
            }
          />
          <Route
            path="/users/:id"
            element={
              <RequireRole roles={['admin']}>
                <UserDetailScreen />
              </RequireRole>
            }
          />
          <Route
            path="/workoutplan/builder"
            element={
              <RequireRole roles={['user']}>
                <WorkoutPlanBuilderScreen />
              </RequireRole>
            }
          />
          <Route
            path="/admin/catalog"
            element={
              <RequireRole roles={['admin']}>
                <AdminSystemCatalogScreen />
              </RequireRole>
            }
          />
          <Route
            path="/admin/catalog/equipment"
            element={
              <RequireRole roles={['admin']}>
                <AdminEquipmentCatalogScreen />
              </RequireRole>
            }
          />
          <Route
            path="/admin/catalog/exercise"
            element={
              <RequireRole roles={['admin']}>
                <AdminExerciseCatalogScreen />
              </RequireRole>
            }
          />
          <Route
            path="/admin/catalog/workoutplan"
            element={
              <RequireRole roles={['admin']}>
                <AdminWorkoutPlanCatalogScreen />
              </RequireRole>
            }
          />
          <Route
            path="/admin/catalog/metrics"
            element={
              <RequireRole roles={['admin']}>
                <AdminMetricCatalogScreen />
              </RequireRole>
            }
          />

          {/* Gym Management Portal */}
          <Route
            path="/gym-admin"
            element={
              <RequireRole roles={['gym-manager']}>
                <GymAdminDashboard />
              </RequireRole>
            }
          />
          <Route
            path="/gym-admin/gyms/:gymId"
            element={
              <RequireRole roles={['gym-manager']} checkGymId>
                <GymManagementScreen />
              </RequireRole>
            }
          />
          <Route
            path="/gym-admin/gyms/:gymId/equipment"
            element={
              <RequireRole roles={['gym-manager']} checkGymId>
                <GymEquipmentListScreen />
              </RequireRole>
            }
          />

          {/* Trainer Portal */}
          <Route
            path="/trainer"
            element={
              <RequireRole roles={['trainer']}>
                <TrainerDashboardScreen />
              </RequireRole>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<NoResults message="Page not found." />} />
        </Routes>
      </View>
      <Footer />
    </MetricRegistryProvider>
  );
};

export default AppRoutes;
