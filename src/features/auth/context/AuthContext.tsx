// ✅ UPDATED: AuthContext.tsx
import React, {createContext, useContext, useEffect, useState} from 'react';
import {refreshAccessToken} from '../../../services/apollo/tokenManager';
import {isTokenExpired} from '../utils/isTokenExpired';
import type { AuthContextType } from '../types/auth';
import type { User } from 'features/users/types/user';
import {storage} from '../utils/storage';
import {useNavigate} from 'react-router-native';
import {registerLogoutCallback} from 'features/auth/utils/logoutTrigger'; // adjust path if needed

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [loginInProgress, setLoginInProgress] = useState(false);

  const logout = async () => {
    await storage.multiRemove(['accessToken', 'refreshToken', 'user']);
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  useEffect(() => {
    const loadTokens = async () => {
      const token = await storage.getItem('accessToken');
      const refresh = await storage.getItem('refreshToken');

      // No refresh token means user must log in again
      if (!refresh) {
        await logout();
        return;
      }

      // If access token is missing or expired, try refreshing
      if (!token || isTokenExpired(token)) {
        const newToken = await refreshAccessToken();
        if (!newToken) {
          await logout();
          return;
        }
      }

      // optionally: re-fetch user profile here if needed
    };

    loadTokens();
  }, []);

  useEffect(() => {
    registerLogoutCallback(() => {
      logout(); // ✅ now the trigger will cleanly log out
    });
  }, []);

  const login = async (
    userData: User,
    tokens: {accessToken: string; refreshToken: string},
  ) => {
    await storage.setItem('accessToken', tokens.accessToken);
    await storage.setItem('refreshToken', tokens.refreshToken);
    await storage.setItem('user', JSON.stringify(userData));

    setAccessToken(tokens.accessToken);
    setRefreshToken(tokens.refreshToken);
    setUser(userData);
    setIsAuthenticated(true);
  };

  const setSession = async ({
    user,
    accessToken,
    refreshToken,
  }: {
    user: User;
    accessToken: string;
    refreshToken: string;
  }) => {
    setLoginInProgress(true);
    await storage.setItem('accessToken', accessToken);
    await storage.setItem('refreshToken', refreshToken);
    await storage.setItem('user', JSON.stringify(user));
    setAccessToken(accessToken);
    setRefreshToken(refreshToken);
    setUser(user);
    setIsAuthenticated(true);
    await new Promise(res => setTimeout(res, 50));
    setLoginInProgress(false);
  };

  useEffect(() => {
    const loadSession = async () => {
      try {
        const storedAccess = await storage.getItem('accessToken');
        const storedRefresh = await storage.getItem('refreshToken');
        const userStr = await storage.getItem('user');

        if (!storedAccess && !storedRefresh) {
          await logout();
          return;
        }

        let validAccessToken = storedAccess;

        if (!storedAccess || isTokenExpired(storedAccess)) {
          if (!storedRefresh) {
            await logout();
            return;
          }

          try {
            validAccessToken = await refreshAccessToken();
            if (validAccessToken) {
              await storage.setItem('accessToken', validAccessToken);
            }
          } catch {
            await logout();
            return;
          }
        }

        setAccessToken(validAccessToken);
        setRefreshToken(storedRefresh);
        setUser(userStr ? JSON.parse(userStr) : null);
        setIsAuthenticated(true);
      } finally {
        setSessionLoaded(true);
      }
    };

    loadSession();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        accessToken,
        refreshToken,
        user,
        login,
        logout,
        setSession,
        clearSession: logout,
        sessionLoaded,
        loginInProgress,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
