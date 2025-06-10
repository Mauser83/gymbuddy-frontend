import React, {useEffect} from 'react';
import {Route, Routes, useNavigate, useLocation} from 'react-router-native';
import {View} from 'react-native';
import Header from 'shared/components/Header';
import Footer from 'shared/components/Footer';
import {useAuth} from 'modules/auth/context/AuthContext';
import {getDefaultRouteForUser} from './guards';
import NoResults from 'shared/components/NoResults';
import {MetricRegistryProvider} from 'shared/context/MetricRegistry';

// Screens
import WelcomeScreen from 'modules/portals/unauthenticated/screens/WelcomeScreen';
import LoginScreen from 'modules/auth/screens/LoginScreen';
import RegisterScreen from 'modules/auth/screens/RegisterScreen';

import GymsScreen from 'modules/gym/screens/GymsScreen';
import GymCreateScreen from 'modules/gym/screens/GymCreateScreen';
import GymDetailScreen from 'modules/gym/screens/GymDetailScreen';

import UsersScreen from 'modules/user/screens/UsersScreen';
import UserDetailScreen from 'modules/user/screens/UserDetailScreen';
import ProfileScreen from 'modules/user/screens/ProfileScreen';

import AppDashboardScreen from 'modules/portals/appManagement/screens/AppManagementDashboardScreen';
import PendingGymsScreen from 'modules/portals/appManagement/screens/PendingGymsScreen';
import GlobalEquipmentListScreen from 'modules/equipment/screens/GlobalEquipmentListScreen';

import GymAdminDashboard from 'modules/portals/gymManagement/screens/GymManagementDashboardScreen';
import GymManagementScreen from 'modules/portals/gymManagement/screens/GymManagementScreen';
import CreateEquipmentScreen from 'modules/equipment/screens/CreateEquipmentScreen';
import EditEquipmentScreen from 'modules/equipment/screens/EditEquipmentScreen';
import GymEquipmentListScreen from 'modules/gym/screens/GymEquipmentListScreen';
import ExerciseListScreen from 'modules/exercise/screens/ExerciseListScreen';
import CreateExerciseScreen from 'modules/exercise/screens/CreateExerciseScreen';
import EditExerciseScreen from 'modules/exercise/screens/EditExerciseScreen';
import UserDashboardScreen from 'modules/portals/users/screens/UserDashboardScreen';
import MyWorkoutPlansScreen from 'modules/portals/users/screens/MyWorkoutPlansScreen';
import StartWorkoutScreen from 'modules/portals/users/screens/StartWorkoutScreen';
import ActiveWorkoutSessionScreen from 'modules/portals/users/screens/ActiveWorkoutSessionScreen';
import ExerciseLibraryScreen from 'modules/portals/users/screens/ExerciseLibraryScreen';
import ExerciseDetailScreen from 'modules/portals/users/screens/ExerciseDetailScreen';
import ProgressOverviewScreen from 'modules/portals/users/screens/ProgressOverviewScreen';
import WorkoutPlanBuilderScreen from 'modules/workoutplan/screens/WorkoutPlanBuilderScreen';
import WorkoutPlanViewScreen from 'modules/workoutplan/screens/WorkoutPlanViewScreen';
import WorkoutSessionHistoryScreen from 'modules/portals/users/screens/WorkoutSessionHistoryScreen';
import WorkoutSessionDetailScreen from 'modules/portals/users/screens/WorkoutSessionDetailScreen';
import AdminSystemCatalogScreen from 'modules/portals/appManagement/screens/AdminSystemCatalogScreen';
import AdminEquipmentCatalogScreen from 'modules/portals/appManagement/screens/AdminEquipmentCatalogScreen';
import AdminExerciseCatalogScreen from 'modules/portals/appManagement/screens/AdminExerciseCatalogScreen';
import AdminWorkoutPlanCatalogScreen from 'modules/portals/appManagement/screens/AdminWorkoutPlanCatalogScreen';

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
            <Route
              path="/equipment/create"
              element={<CreateEquipmentScreen />}
            />
            <Route
              path="/equipment/edit/:id"
              element={<EditEquipmentScreen />}
            />
            <Route path="/exercise" element={<ExerciseListScreen />} />
            <Route path="/exercise/create" element={<CreateExerciseScreen />} />
            <Route path="/exercise/edit/:id" element={<EditExerciseScreen />} />
            <Route path="/users" element={<UsersScreen />} />
            <Route path="/users/:id" element={<UserDetailScreen />} />
            <Route
              path="/workoutplan/builder"
              element={<WorkoutPlanBuilderScreen />}
            />
            <Route
              path="/admin/catalog"
              element={<AdminSystemCatalogScreen />}
            />
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

            {/* Fallback */}
            <Route path="*" element={<NoResults message="Page not found." />} />
          </Routes>
        </View>
        <Footer />
    </MetricRegistryProvider>
  );
};

export default AppRoutes;
