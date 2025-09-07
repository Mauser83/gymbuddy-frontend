import React, {useEffect} from 'react';
import {Route, Routes, useNavigate, useLocation} from 'react-router-native';
import {View} from 'react-native';
import Header from 'shared/components/Header';
import Footer from 'shared/components/Footer';
import {useAuth} from 'features/auth/context/AuthContext';
import {useRole} from 'features/auth/context/RoleContext';
import {getDefaultRouteForRole} from './guards';
import NoResults from 'shared/components/NoResults';
import RequireRole from './RequireRole';
import {MetricRegistryProvider} from 'shared/context/MetricRegistry';

// Screens
import WelcomeScreen from 'portals/public/WelcomeScreen';
import LoginScreen from 'portals/public/LoginScreen';
import RegisterScreen from 'portals/public/RegisterScreen';

import GymsScreen from 'portals/user/GymsScreen';
import GymCreateScreen from 'portals/user/GymCreateScreen';
import GymDetailScreen from 'portals/user/GymDetailScreen';

import UsersScreen from 'portals/admin/UsersScreen';
import UserDetailScreen from 'portals/admin/UserDetailScreen';
import ProfileScreen from 'portals/user/ProfileScreen';

import AppDashboardScreen from 'portals/admin/AppManagementDashboardScreen';
import PendingGymsScreen from 'portals/admin/PendingGymsScreen';
import GlobalEquipmentListScreen from 'portals/admin/GlobalEquipmentListScreen';

import GymAdminDashboard from 'portals/gym-admin/GymManagementDashboardScreen';
import GymManagementScreen from 'portals/gym-admin/GymManagementScreen';
import CreateEquipmentScreen from 'portals/admin/CreateEquipmentScreen';
import EditEquipmentScreen from 'portals/admin/EditEquipmentScreen';
import GymEquipmentListScreen from 'portals/gym-admin/GymEquipmentListScreen';
import GymEquipmentDetailScreen from 'portals/gym-admin/GymEquipmentDetailScreen';
import GymTrainingCandidatesScreen from 'portals/gym-admin/GymTrainingCandidatesScreen';
import ExerciseListScreen from 'portals/admin/ExerciseListScreen';
import CreateExerciseScreen from 'portals/admin/CreateExerciseScreen';
import EditExerciseScreen from 'portals/admin/EditExerciseScreen';
import UserDashboardScreen from 'portals/user/UserDashboardScreen';
import MyWorkoutPlansScreen from 'portals/user/MyWorkoutPlansScreen';
import StartWorkoutScreen from 'portals/user/StartWorkoutScreen';
import ActiveWorkoutSessionScreen from 'portals/user/ActiveWorkoutSessionScreen';
import ExerciseLibraryScreen from 'portals/user/ExerciseLibraryScreen';
import ExerciseDetailScreen from 'portals/user/ExerciseDetailScreen';
import ProgressOverviewScreen from 'portals/user/ProgressOverviewScreen';
import WorkoutPlanBuilderScreen from 'portals/user/WorkoutPlanBuilderScreen';
import WorkoutPlanViewScreen from 'portals/user/WorkoutPlanViewScreen';
import WorkoutSessionHistoryScreen from 'portals/user/WorkoutSessionHistoryScreen';
import WorkoutSessionDetailScreen from 'portals/user/WorkoutSessionDetailScreen';
import TrainerDashboardScreen from 'portals/trainer/TrainerDashboardScreen';
import FriendsScreen from 'portals/user/FriendsScreen';
import GroupsScreen from 'portals/user/GroupsScreen';
import LeaderboardsScreen from 'portals/user/LeaderboardsScreen';
import MessagesScreen from 'portals/user/MessagesScreen';
import EquipmentRecognitionCaptureScreen from 'portals/user/EquipmentRecognitionCaptureScreen';
import AdminSystemCatalogScreen from 'portals/admin/AdminSystemCatalogScreen';
import AdminEquipmentCatalogScreen from 'portals/admin/AdminEquipmentCatalogScreen';
import AdminExerciseCatalogScreen from 'portals/admin/AdminExerciseCatalogScreen';
import AdminWorkoutPlanCatalogScreen from 'portals/admin/AdminWorkoutPlanCatalogScreen';
import AdminMetricCatalogScreen from 'portals/admin/AdminMetricCatalogScreen';
import TaxonomiesScreen from 'portals/admin/TaxonomiesScreen';
import EquipmentRecognitionDashboardScreen from 'portals/admin/EquipmentRecognitionDashboardScreen';
import BatchCaptureScreen from 'portals/admin/BatchCaptureScreen';
import KnnPlaygroundScreen from 'portals/admin/KnnPlaygroundScreen';
import WorkerTasksScreen from 'portals/admin/WorkerTasksScreen';
import ImageManagementScreen from 'portals/admin/ImageManagementScreen';
import GlobalCurationScreen from 'portals/admin/GlobalCurationScreen';
import SigningVerifierScreen from 'portals/admin/SigningVerifierScreen';
import RoleSelectScreen from 'portals/user/RoleSelectScreen';

const AppRoutes = () => {
  const {user, isAuthenticated, sessionLoaded} = useAuth();
  const {activeRole, loaded} = useRole();
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
      <View style={{flex: 1}}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<WelcomeScreen />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/register" element={<RegisterScreen />} />
          <Route path="/select-role" element={<RoleSelectScreen />} />

          {/* User Portal */}
          <Route path="/user" element={<RequireRole roles={['user']}><UserDashboardScreen /></RequireRole>} />
          <Route path="/user/my-plans" element={<RequireRole roles={['user']}><MyWorkoutPlansScreen /></RequireRole>} />
          <Route path="/user/log-exercise" element={<RequireRole roles={['user']}><StartWorkoutScreen /></RequireRole>} />
          <Route path="/active-session/:sessionId" element={<RequireRole roles={['user']}><ActiveWorkoutSessionScreen /></RequireRole>} />
          <Route path="/gyms" element={<GymsScreen />} />
          <Route path="/gyms/create" element={<GymCreateScreen />} />
          <Route path="/gyms/:gymId" element={<GymDetailScreen />} />
          <Route path="/profile" element={<RequireRole roles={['user','admin','gym-manager','trainer']}><ProfileScreen /></RequireRole>} />
          <Route path="/user/exercise-library" element={<RequireRole roles={['user']}><ExerciseLibraryScreen /></RequireRole>} />
          <Route path="/user/exercise/:exerciseId" element={<RequireRole roles={['user']}><ExerciseDetailScreen /></RequireRole>} />
          <Route path="/user/progress" element={<RequireRole roles={['user']}><ProgressOverviewScreen /></RequireRole>} />
          <Route path="/user/view-plan/:id" element={<RequireRole roles={['user']}><WorkoutPlanViewScreen /></RequireRole>} />
          <Route path="/user/edit-plan" element={<RequireRole roles={['user']}><WorkoutPlanBuilderScreen /></RequireRole>} />
          <Route path="/user/friends" element={<RequireRole roles={['user']}><FriendsScreen /></RequireRole>} />
          <Route path="/user/groups" element={<RequireRole roles={['user']}><GroupsScreen /></RequireRole>} />
          <Route path="/user/leaderboards" element={<RequireRole roles={['user']}><LeaderboardsScreen /></RequireRole>} />
          <Route path="/user/messages" element={<RequireRole roles={['user']}><MessagesScreen /></RequireRole>} />
          <Route
            path="/user/recognize-equipment"
            element={
              <RequireRole roles={['user']}>
                <EquipmentRecognitionCaptureScreen />
              </RequireRole>
            }
          />
          <Route path="/workout-session" element={<RequireRole roles={['user']}><WorkoutSessionHistoryScreen /></RequireRole>} />
          <Route path="/workout-session/:sessionId" element={<RequireRole roles={['user']}><WorkoutSessionDetailScreen /></RequireRole>} />

          {/* App Management Portal */}
          <Route path="/admin" element={<RequireRole roles={['admin']}><AppDashboardScreen /></RequireRole>} />
          <Route path="/pending-gyms" element={<RequireRole roles={['admin']}><PendingGymsScreen /></RequireRole>} />
          <Route path="/equipment" element={<RequireRole roles={['admin']}><GlobalEquipmentListScreen /></RequireRole>} />
          <Route path="/equipment/create" element={<RequireRole roles={['admin']}><CreateEquipmentScreen /></RequireRole>} />
          <Route path="/equipment/edit/:id" element={<RequireRole roles={['admin']}><EditEquipmentScreen /></RequireRole>} />
          <Route path="/exercise" element={<RequireRole roles={['admin']}><ExerciseListScreen /></RequireRole>} />
          <Route path="/exercise/create" element={<RequireRole roles={['admin']}><CreateExerciseScreen /></RequireRole>} />
          <Route path="/exercise/edit/:id" element={<RequireRole roles={['admin']}><EditExerciseScreen /></RequireRole>} />
          <Route path="/users" element={<RequireRole roles={['admin']}><UsersScreen /></RequireRole>} />
          <Route path="/users/:id" element={<RequireRole roles={['admin']}><UserDetailScreen /></RequireRole>} />
          <Route path="/admin/global-curation" element={<RequireRole roles={['admin']}><GlobalCurationScreen /></RequireRole>} />
          <Route path="/workoutplan/builder" element={<RequireRole roles={['user']}><WorkoutPlanBuilderScreen /></RequireRole>} />
          <Route path="/admin/catalog" element={<RequireRole roles={['admin']}><AdminSystemCatalogScreen /></RequireRole>} />
          <Route path="/admin/catalog/equipment" element={<RequireRole roles={['admin']}><AdminEquipmentCatalogScreen /></RequireRole>} />
          <Route path="/admin/catalog/exercise" element={<RequireRole roles={['admin']}><AdminExerciseCatalogScreen /></RequireRole>} />
          <Route path="/admin/catalog/workoutplan" element={<RequireRole roles={['admin']}><AdminWorkoutPlanCatalogScreen /></RequireRole>} />
          <Route path="/admin/catalog/metrics" element={<RequireRole roles={['admin']}><AdminMetricCatalogScreen /></RequireRole>} />
          <Route path="/admin/taxonomies" element={<RequireRole roles={['admin']}><TaxonomiesScreen /></RequireRole>} />
          <Route path="/admin/equipment-recognition" element={<RequireRole roles={['admin']}><EquipmentRecognitionDashboardScreen /></RequireRole>} />
          <Route path="/admin/equipment-recognition/batch-capture" element={<RequireRole roles={['admin']}><BatchCaptureScreen /></RequireRole>} />
          <Route path="/admin/equipment-recognition/taxonomies" element={<RequireRole roles={['admin']}><TaxonomiesScreen /></RequireRole>} />
          <Route path="/admin/equipment-recognition/knn" element={<RequireRole roles={['admin']}><KnnPlaygroundScreen /></RequireRole>} />
          <Route path="/admin/equipment-recognition/worker-tasks" element={<RequireRole roles={['admin']}><WorkerTasksScreen /></RequireRole>} />
          <Route path="/admin/equipment-recognition/images" element={<RequireRole roles={['admin']}><ImageManagementScreen /></RequireRole>} />
          <Route path="/admin/equipment-recognition/signing" element={<RequireRole roles={['admin']}><SigningVerifierScreen /></RequireRole>} />

          {/* Gym Management Portal */}
          <Route path="/gym-admin" element={<RequireRole roles={['gym-manager']}><GymAdminDashboard /></RequireRole>} />
          <Route path="/gym-admin/gyms/:gymId" element={<RequireRole roles={['gym-manager']} checkGymId><GymManagementScreen /></RequireRole>} />
          <Route path="/gym-admin/gyms/:gymId/equipment" element={<RequireRole roles={['gym-manager']} checkGymId><GymEquipmentListScreen /></RequireRole>} />
          <Route path="/gym-admin/gyms/:gymId/equipment/:gymEquipmentId" element={<RequireRole roles={['gym-manager']} checkGymId><GymEquipmentDetailScreen /></RequireRole>} />
          <Route path="/gym-admin/gyms/:gymId/training-candidates" element={<RequireRole roles={['gym-manager']} checkGymId><GymTrainingCandidatesScreen /></RequireRole>} />

          {/* Trainer Portal */}
          <Route path="/trainer" element={<RequireRole roles={['trainer']}><TrainerDashboardScreen /></RequireRole>} />

          {/* Fallback */}
          <Route path="*" element={<NoResults message="Page not found." />} />
        </Routes>
      </View>
      <Footer />
    </MetricRegistryProvider>
  );
};

export default AppRoutes;
