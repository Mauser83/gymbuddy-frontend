import { User } from "../../user/types/user";

export interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  login: (
    user: User,
    tokens: { accessToken: string; refreshToken: string }
  ) => Promise<void>;
  logout: () => Promise<void>;
  setSession: (session: {
    user: User;
    accessToken: string;
    refreshToken: string;
  }) => Promise<void>;
  clearSession: () => Promise<void>;
  sessionLoaded: boolean;
  loginInProgress: boolean;
}