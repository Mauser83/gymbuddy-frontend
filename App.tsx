import React from 'react';
import {ActivityIndicator, StatusBar} from 'react-native';
import {useFonts} from 'expo-font';
import {Host} from 'react-native-portalize';
import {
  ThemeProvider as CustomThemeProvider,
  useTheme,
} from './src/shared/theme/ThemeProvider';
import {AuthProvider, useAuth} from './src/modules/auth/context/AuthContext';
import RoleSubscriptionWatcher from 'modules/auth/components/RoleSubscriptionWatcher';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {NativeRouter} from 'react-router-native';
import {ApolloProvider} from '@apollo/client';
import AppRoutes from './src/routes/AppRoutes';
import StatusBarManager from 'shared/components/StatusBarManager';
import ToastContainer from 'shared/components/ToastContainer';
import {useApolloClient} from './src/services/apollo/hooks/useApolloClient'; // adjust path if needed
import LoadingState from 'shared/components/LoadingState';
import ContentContainer from 'shared/components/ContentContainer';

const AppContent = () => {
  const {sessionLoaded, isAuthenticated} = useAuth();
  const client = useApolloClient();
  const {theme} = useTheme();

  StatusBar.setBarStyle(theme.mode === 'dark' ? 'light-content' : 'dark-content')

  if (!sessionLoaded || !client) {
    return (
      <>
        <StatusBar/>
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
    BebasNeue: require('./src/assets/fonts/BebasNeue-Regular.ttf'),
    Inter: require('./src/assets/fonts/Inter-VariableFont.ttf'),
  });

  if (!fontsLoaded) {
    return (
      <ActivityIndicator size="large" color="#f97316" style={{marginTop: 50}} />
    );
  }

  return (
    <AuthProvider>
      <CustomThemeProvider>
        <NativeRouter>
          <AppContent />
        </NativeRouter>
      </CustomThemeProvider>
    </AuthProvider>
  );
};

export default App;
