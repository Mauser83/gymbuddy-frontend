import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Route, Routes, useNavigate, useLocation } from 'react-router-native';

import { useAuth } from 'src/features/auth/context/AuthContext';
import { useRole } from 'src/features/auth/context/RoleContext';

// Screens
import AdminEquipmentCatalogScreen from 'src/portals/admin/AdminEquipmentCatalogScreen';
import AdminExerciseCatalogScreen from 'src/portals/admin/AdminExerciseCatalogScreen';
import AdminMetricCatalogScreen from 'src/portals/admin/AdminMetricCatalogScreen';
import AdminSystemCatalogScreen from 'src/portals/admin/AdminSystemCatalogScreen';
import AdminWorkoutPlanCatalogScreen from 'src/portals/admin/AdminWorkoutPlanCatalogScreen';
import AppDashboardScreen from 'src/portals/admin/AppManagementDashboardScreen';
import BatchCaptureScreen from 'src/portals/admin/BatchCaptureScreen';
import CreateEquipmentScreen from 'src/portals/admin/CreateEquipmentScreen';
import CreateExerciseScreen from 'src/portals/admin/CreateExerciseScreen';
import EditEquipmentScreen from 'src/portals/admin/EditEquipmentScreen';
import EditExerciseScreen from 'src/portals/admin/EditExerciseScreen';
import EquipmentRecognitionDashboardScreen from 'src/portals/admin/EquipmentRecognitionDashboardScreen';
import ExerciseListScreen from 'src/portals/admin/ExerciseListScreen';
import GlobalCurationScreen from 'src/portals/admin/GlobalCurationScreen';
import GlobalEquipmentListScreen from 'src/portals/admin/GlobalEquipmentListScreen';
import ImageManagementScreen from 'src/portals/admin/ImageManagementScreen';
import KnnPlaygroundScreen from 'src/portals/admin/KnnPlaygroundScreen';
import PendingGymsScreen from 'src/portals/admin/PendingGymsScreen';
import SigningVerifierScreen from 'src/portals/admin/SigningVerifierScreen';
import TaxonomiesScreen from 'src/portals/admin/TaxonomiesScreen';
import UserDetailScreen from 'src/portals/admin/UserDetailScreen';
import UsersScreen from 'src/portals/admin/UsersScreen';
import WorkerTasksScreen from 'src/portals/admin/WorkerTasksScreen';
import GymEquipmentDetailScreen from 'src/portals/gym-admin/GymEquipmentDetailScreen';
import GymEquipmentListScreen from 'src/portals/gym-admin/GymEquipmentListScreen';
import GymAdminDashboard from 'src/portals/gym-admin/GymManagementDashboardScreen';
import GymManagementScreen from 'src/portals/gym-admin/GymManagementScreen';
import GymTrainingCandidatesScreen from 'src/portals/gym-admin/GymTrainingCandidatesScreen';
import LoginScreen from 'src/portals/public/LoginScreen';
import RegisterScreen from 'src/portals/public/RegisterScreen';
import WelcomeScreen from 'src/portals/public/WelcomeScreen';
import TrainerDashboardScreen from 'src/portals/trainer/TrainerDashboardScreen';
import ActiveWorkoutSessionScreen from 'src/portals/user/ActiveWorkoutSessionScreen';
import EquipmentRecognitionCaptureScreen from 'src/portals/user/EquipmentRecognitionCaptureScreen';
import ExerciseDetailScreen from 'src/portals/user/ExerciseDetailScreen';
import ExerciseLibraryScreen from 'src/portals/user/ExerciseLibraryScreen';
import FriendsScreen from 'src/portals/user/FriendsScreen';
import GroupsScreen from 'src/portals/user/GroupsScreen';
import GymCreateScreen from 'src/portals/user/GymCreateScreen';
import GymDetailScreen from 'src/portals/user/GymDetailScreen';
import GymsScreen from 'src/portals/user/GymsScreen';
import LeaderboardsScreen from 'src/portals/user/LeaderboardsScreen';
import MessagesScreen from 'src/portals/user/MessagesScreen';
import MyWorkoutPlansScreen from 'src/portals/user/MyWorkoutPlansScreen';
import ProfileScreen from 'src/portals/user/ProfileScreen';
import ProgressOverviewScreen from 'src/portals/user/ProgressOverviewScreen';
import RoleSelectScreen from 'src/portals/user/RoleSelectScreen';
import StartWorkoutScreen from 'src/portals/user/StartWorkoutScreen';
import UserDashboardScreen from 'src/portals/user/UserDashboardScreen';
import WorkoutPlanBuilderScreen from 'src/portals/user/WorkoutPlanBuilderScreen';
import WorkoutPlanViewScreen from 'src/portals/user/WorkoutPlanViewScreen';
import WorkoutSessionDetailScreen from 'src/portals/user/WorkoutSessionDetailScreen';
import WorkoutSessionHistoryScreen from 'src/portals/user/WorkoutSessionHistoryScreen';
import Footer from 'src/shared/components/Footer';
import Header from 'src/shared/components/Header';
import NoResults from 'src/shared/components/NoResults';
import { MetricRegistryProvider } from 'src/shared/context/MetricRegistry';

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
            path="/user/recognize-equipment"
            element={
              <RequireRole roles={['user']}>
                <EquipmentRecognitionCaptureScreen />
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
            path="/admin/global-curation"
            element={
              <RequireRole roles={['admin']}>
                <GlobalCurationScreen />
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
          <Route
            path="/admin/taxonomies"
            element={
              <RequireRole roles={['admin']}>
                <TaxonomiesScreen />
              </RequireRole>
            }
          />
          <Route
            path="/admin/equipment-recognition"
            element={
              <RequireRole roles={['admin']}>
                <EquipmentRecognitionDashboardScreen />
              </RequireRole>
            }
          />
          <Route
            path="/admin/equipment-recognition/batch-capture"
            element={
              <RequireRole roles={['admin']}>
                <BatchCaptureScreen />
              </RequireRole>
            }
          />
          <Route
            path="/admin/equipment-recognition/taxonomies"
            element={
              <RequireRole roles={['admin']}>
                <TaxonomiesScreen />
              </RequireRole>
            }
          />
          <Route
            path="/admin/equipment-recognition/knn"
            element={
              <RequireRole roles={['admin']}>
                <KnnPlaygroundScreen />
              </RequireRole>
            }
          />
          <Route
            path="/admin/equipment-recognition/worker-tasks"
            element={
              <RequireRole roles={['admin']}>
                <WorkerTasksScreen />
              </RequireRole>
            }
          />
          <Route
            path="/admin/equipment-recognition/images"
            element={
              <RequireRole roles={['admin']}>
                <ImageManagementScreen />
              </RequireRole>
            }
          />
          <Route
            path="/admin/equipment-recognition/signing"
            element={
              <RequireRole roles={['admin']}>
                <SigningVerifierScreen />
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
          <Route
            path="/gym-admin/gyms/:gymId/equipment/:gymEquipmentId"
            element={
              <RequireRole roles={['gym-manager']} checkGymId>
                <GymEquipmentDetailScreen />
              </RequireRole>
            }
          />
          <Route
            path="/gym-admin/gyms/:gymId/training-candidates"
            element={
              <RequireRole roles={['gym-manager']} checkGymId>
                <GymTrainingCandidatesScreen />
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
