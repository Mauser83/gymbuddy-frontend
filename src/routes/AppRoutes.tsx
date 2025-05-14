import React, {useEffect} from 'react';
import {Route, Routes, useNavigate, useLocation} from 'react-router-native';
import {View} from 'react-native';
import Header from 'shared/components/Header';
import Footer from 'shared/components/Footer';
import {useAuth} from 'modules/auth/context/AuthContext';
import {setNavigate} from 'shared/utils/navigation';
import {getDefaultRouteForUser} from './guards';
import NoResults from 'shared/components/NoResults';

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
import ContentContainer from 'shared/components/ContentContainer';
import CreateEquipmentScreen from 'modules/equipment/screens/CreateEquipmentScreen';
import EditEquipmentScreen from 'modules/equipment/screens/EditEquipmentScreen';
import GymEquipmentListScreen from 'modules/gym/screens/GymEquipmentListScreen';

const AppRoutes = () => {
  const {user, isAuthenticated, sessionLoaded} = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setNavigate(navigate);
  }, [navigate]);

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
    <ContentContainer>
      <Header />
      <View style={{flex: 1}}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<WelcomeScreen />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/register" element={<RegisterScreen />} />

          {/* Users */}
          <Route path="/users" element={<UsersScreen />} />
          <Route path="/users/:id" element={<UserDetailScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />

          {/* Gyms */}
          <Route path="/gyms" element={<GymsScreen />} />
          <Route path="/gyms/create" element={<GymCreateScreen />} />
          <Route path="/gyms/:gymId" element={<GymDetailScreen />} />

          {/* App Management Portal */}
          <Route path="/admin" element={<AppDashboardScreen />} />
          <Route path="/pending-gyms" element={<PendingGymsScreen />} />
          <Route path="/equipment" element={<GlobalEquipmentListScreen />} />
          <Route path="/equipment/create" element={<CreateEquipmentScreen />} />
          <Route path="/equipment/edit/:id" element={<EditEquipmentScreen />} />

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
    </ContentContainer>
  );
};

export default AppRoutes;
