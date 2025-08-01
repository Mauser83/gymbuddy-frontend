import React, {createContext, useContext, useEffect, useState} from 'react';
import {useAuth} from './AuthContext';
import {storage} from '../utils/storage';
import * as jwt_decode from 'jwt-decode';

export type Role = 'user' | 'gym-manager' | 'trainer' | 'admin';
export type AppScopeRole = 'admin' | 'moderator';

export type RoleContextState = {
  role: Role;
  gymId?: string;
  appScopeRole?: AppScopeRole;
  isPremiumUser?: boolean;
};

interface RoleContextType {
  activeRole: RoleContextState | null;
  setActiveRole: (ctx: RoleContextState) => void;
  clearRole: () => void;
  loaded: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);
const STORAGE_KEY = 'activeRoleContext';

const parseClaims = (token: string | null) => {
  try {
    if (!token) return {};
    const decoded: any = jwt_decode.jwtDecode(token);
    return {
      isPremiumUser: !!decoded.premium,
      appScopeRole: decoded.appScopeRole as AppScopeRole | undefined,
    };
  } catch {
    return {};
  }
};

export const RoleProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const {user, accessToken} = useAuth();
  const [activeRole, setActiveRole] = useState<RoleContextState | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      const stored = await storage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          setActiveRole(JSON.parse(stored));
        } catch {}
      }
      setLoaded(true);
    };
    load();
  }, []);

  useEffect(() => {
    if (activeRole) {
      storage.setItem(STORAGE_KEY, JSON.stringify(activeRole));
    }
  }, [activeRole]);

  useEffect(() => {
    if (!user) {
      setActiveRole(null);
      storage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  useEffect(() => {
    const claims = parseClaims(accessToken);
    setActiveRole(prev =>
      prev ? {...prev, ...claims} : prev,
    );
  }, [accessToken]);

  const handleSetRole = (ctx: RoleContextState) => setActiveRole(ctx);
  const clearRole = () => {
    setActiveRole(null);
    storage.removeItem(STORAGE_KEY);
  };

  return (
    <RoleContext.Provider value={{activeRole, setActiveRole: handleSetRole, clearRole, loaded}}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used within RoleProvider');
  return ctx;
};