import React, {useEffect} from 'react';
import {Route, Routes, useNavigate, useLocation} from 'react-router-native';
import {View} from 'react-native';
import Header from 'shared/components/Header';
import Footer from 'shared/components/Footer';
import {useAuth} from 'features/auth/context/AuthContext';
import {getDefaultRouteForUser} from './guards';
import NoResults from 'shared/components/NoResults';
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
import AdminSystemCatalogScreen from 'portals/admin/AdminSystemCatalogScreen';
import AdminEquipmentCatalogScreen from 'portals/admin/AdminEquipmentCatalogScreen';
import AdminExerciseCatalogScreen from 'portals/admin/AdminExerciseCatalogScreen';
import AdminWorkoutPlanCatalogScreen from 'portals/admin/AdminWorkoutPlanCatalogScreen';
import AdminMetricCatalogScreen from 'portals/admin/AdminMetricCatalogScreen';

const AppRoutes = () => {
  const {user, isAuthenticated, sessionLoaded} = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!sessionLoaded) return;

    const publicRoutes = ['/', '/login', '/register'];

    // Unauthenticated user trying to access protected route
    if (!isAuthenticated && !publicRoutes.includes(location.pathname)) {
      navigate('/');
      return;
    }

    // Authenticated user landing on root ("/")
    if (isAuthenticated && location.pathname === '/') {
      navigate(getDefaultRouteForUser(user));
    }
  }, [sessionLoaded, isAuthenticated, user, location.pathname, navigate]);

  return (
    <MetricRegistryProvider>
      <Header />
      <View style={{flex: 1}}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<WelcomeScreen />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/register" element={<RegisterScreen />} />

          {/* User Portal */}
          <Route path="/user" element={<UserDashboardScreen />} />
          <Route path="/user/my-plans" element={<MyWorkoutPlansScreen />} />
          <Route path="/user/log-exercise" element={<StartWorkoutScreen />} />
          <Route
            path="/active-session/:sessionId"
            element={<ActiveWorkoutSessionScreen />}
          />
          <Route path="/gyms" element={<GymsScreen />} />
          <Route path="/gyms/create" element={<GymCreateScreen />} />
          <Route path="/gyms/:gymId" element={<GymDetailScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />
          <Route
            path="/user/exercise-library"
            element={<ExerciseLibraryScreen />}
          />
          <Route
            path="/user/exercise/:exerciseId"
            element={<ExerciseDetailScreen />}
          />
          <Route path="/user/progress" element={<ProgressOverviewScreen />} />
          <Route
            path="/user/view-plan/:id"
            element={<WorkoutPlanViewScreen />}
          />
          <Route
            path="/user/edit-plan"
            element={<WorkoutPlanBuilderScreen />}
          />
          <Route path="/user/friends" element={<FriendsScreen />} />
          <Route path="/user/groups" element={<GroupsScreen />} />
          <Route path="/user/leaderboards" element={<LeaderboardsScreen />} />
          <Route path="/user/messages" element={<MessagesScreen />} />
          <Route
            path="/workout-session"
            element={<WorkoutSessionHistoryScreen />}
          />
          <Route
            path="/workout-session/:sessionId"
            element={<WorkoutSessionDetailScreen />}
          />

          {/* App Management Portal */}
          <Route path="/admin" element={<AppDashboardScreen />} />
          <Route path="/pending-gyms" element={<PendingGymsScreen />} />
          <Route path="/equipment" element={<GlobalEquipmentListScreen />} />
          <Route path="/equipment/create" element={<CreateEquipmentScreen />} />
          <Route path="/equipment/edit/:id" element={<EditEquipmentScreen />} />
          <Route path="/exercise" element={<ExerciseListScreen />} />
          <Route path="/exercise/create" element={<CreateExerciseScreen />} />
          <Route path="/exercise/edit/:id" element={<EditExerciseScreen />} />
          <Route path="/users" element={<UsersScreen />} />
          <Route path="/users/:id" element={<UserDetailScreen />} />
          <Route
            path="/workoutplan/builder"
            element={<WorkoutPlanBuilderScreen />}
          />
          <Route path="/admin/catalog" element={<AdminSystemCatalogScreen />} />
          <Route
            path="/admin/catalog/equipment"
            element={<AdminEquipmentCatalogScreen />}
          />
          <Route
            path="/admin/catalog/exercise"
            element={<AdminExerciseCatalogScreen />}
          />
          <Route
            path="/admin/catalog/workoutplan"
            element={<AdminWorkoutPlanCatalogScreen />}
          />
          <Route
            path="/admin/catalog/metrics"
            element={<AdminMetricCatalogScreen />}
          />

          {/* Gym Management Portal */}
          <Route path="/gym-admin" element={<GymAdminDashboard />} />
          <Route
            path="/gym-admin/gyms/:gymId"
            element={<GymManagementScreen />}
          />
          <Route
            path="/gym-admin/gyms/:gymId/equipment"
            element={<GymEquipmentListScreen />}
          />

          {/* Trainer Portal */}
          <Route path="/trainer" element={<TrainerDashboardScreen />} />

          {/* Fallback */}
          <Route path="*" element={<NoResults message="Page not found." />} />
        </Routes>
      </View>
      <Footer />
    </MetricRegistryProvider>
  );
};

export default AppRoutes;
