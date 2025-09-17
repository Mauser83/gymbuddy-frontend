import 'react-native-reanimated';
import { ApolloProvider } from '@apollo/client';
import { useFonts } from 'expo-font';
import React from 'react';
import { ActivityIndicator, StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Host } from 'react-native-portalize';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NativeRouter } from 'react-router-native';

import BebasNeue from './src/assets/fonts/BebasNeue-Regular.ttf';
import Inter from './src/assets/fonts/Inter-VariableFont.ttf';
import RoleSubscriptionWatcher from './src/features/auth/components/RoleSubscriptionWatcher';
import { AuthProvider, useAuth } from './src/features/auth/context/AuthContext';
import { RoleProvider } from './src/features/auth/context/RoleContext';
import AppRoutes from './src/routes/AppRoutes';
import { useApolloClient } from './src/services/apollo/hooks/useApolloClient';
import ContentContainer from './src/shared/components/ContentContainer';
import LoadingState from './src/shared/components/LoadingState';
import StatusBarManager from './src/shared/components/StatusBarManager';
import ToastContainer from './src/shared/components/ToastContainer';
import { ThemeProvider as CustomThemeProvider, useTheme } from './src/shared/theme/ThemeProvider';

const AppContent = () => {
  const { sessionLoaded, isAuthenticated } = useAuth();
  const client = useApolloClient();
  const { theme } = useTheme();

  StatusBar.setBarStyle(theme.mode === 'dark' ? 'light-content' : 'dark-content');

  if (!sessionLoaded || !client) {
    return (
      <>
        <StatusBar />

        <ContentContainer>
          <LoadingState text="Connecting to backend..." />
        </ContentContainer>
      </>
    );
  }

  return (
    <ApolloProvider client={client}>
      <SafeAreaProvider>
        <Host>
          {isAuthenticated && <RoleSubscriptionWatcher />}
          <StatusBarManager />
          <AppRoutes />
          <ToastContainer />
        </Host>
      </SafeAreaProvider>
    </ApolloProvider>
  );
};

const App = () => {
  const [fontsLoaded] = useFonts({
    BebasNeue,
    Inter,
  });

  if (!fontsLoaded) {
    return <ActivityIndicator size="large" color="#f97316" style={{ marginTop: 50 }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <RoleProvider>
          <CustomThemeProvider>
            <NativeRouter>
              <AppContent />
            </NativeRouter>
          </CustomThemeProvider>
        </RoleProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
};

export default App;
