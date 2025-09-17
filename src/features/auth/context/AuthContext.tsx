// ✅ UPDATED: AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-native';

import { registerLogoutCallback } from 'features/auth/utils/logoutTrigger'; // adjust path if needed
import type { User } from 'features/users/types/user';

import { refreshAccessToken } from '../../../services/apollo/tokenManager';
import type { AuthContextType } from '../types/auth';
import { isTokenExpired } from '../utils/isTokenExpired';
import { storage } from '../utils/storage';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [loginInProgress, setLoginInProgress] = useState(false);

  const logout = async () => {
    // console.log('Logging out and clearing stored tokens');
    await storage.multiRemove(['accessToken', 'refreshToken', 'user']);
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  useEffect(() => {
    registerLogoutCallback(() => {
      logout(); // ✅ now the trigger will cleanly log out
    });
  }, []);

  const login = async (userData: User, tokens: { accessToken: string; refreshToken: string }) => {
    await storage.setItem('accessToken', tokens.accessToken);
    await storage.setItem('refreshToken', tokens.refreshToken);
    await storage.setItem('user', JSON.stringify(userData));

    const storedToken = await storage.getItem('accessToken');
    // console.log('Access token after login:', storedToken);

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
    await new Promise<void>((resolve) => {
      setTimeout(() => resolve(), 50);
    });
    setLoginInProgress(false);
  };

  useEffect(() => {
    const loadSession = async () => {
      try {
        const storedAccess = await storage.getItem('accessToken');
        const storedRefresh = await storage.getItem('refreshToken');
        const userStr = await storage.getItem('user');

        if (!storedAccess && !storedRefresh) {
          // console.log('AuthContext: no stored tokens found; logging out');
          await logout();
          return;
        }

        let validAccessToken = storedAccess;

        if (!storedAccess || isTokenExpired(storedAccess)) {
          if (!storedRefresh) {
            // console.log('AuthContext: missing refresh token; logging out');
            await logout();
            return;
          }

          try {
            validAccessToken = await refreshAccessToken();
            if (validAccessToken) {
              await storage.setItem('accessToken', validAccessToken);
            }
          } catch (err) {
            // console.log('AuthContext: refreshAccessToken failed; logging out');
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
