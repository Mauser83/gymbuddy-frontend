// auth.service.ts
import {useMutation} from '@apollo/client';
import {LOGIN_MUTATION, REGISTER_MUTATION} from '../graphql/auth.mutations';
import {useNavigate} from 'react-router-native';
import {useAuth} from '../context/AuthContext';
import { logoutFromContext } from '../context/AuthContext';
import {GymRole} from 'modules/gym/types/gym.types';
import { storage } from 'modules/auth/utils/storage';

export const useAuthService = () => {
  const navigate = useNavigate();
  const {setSession, clearSession} = useAuth(); // if you have clearSession

  const [loginMutation, {loading: loginLoading, error: loginError}] =
    useMutation(LOGIN_MUTATION, {
      onCompleted: async data => {
        const {user, accessToken, refreshToken} = data.login;

        await setSession({user, accessToken, refreshToken});

        const saved = await storage.getItem('refreshToken');
        if (user.appRole === 'ADMIN' || user.appRole === 'MODERATOR') {
          navigate('/admin');
          return;
        }
        
        const isGymManager =
          user?.gymManagementRoles?.some(
            (role: GymRole) =>
              role.role === 'GYM_ADMIN' || role.role === 'GYM_MODERATOR'
          ) ?? false;
        
        if (isGymManager) {
          navigate('/gym-admin');
        } else {
          navigate('/gyms');
        }
      },
    });

  const [registerMutation, {loading: registerLoading, error: registerError}] =
    useMutation(REGISTER_MUTATION, {
      onCompleted: async data => {
        const {user, accessToken, refreshToken} = data.register;
        await setSession({user, accessToken, refreshToken});
        navigate('/gyms');
      },
    });

  const logout = async () => {
    await logoutFromContext();
    if (clearSession) clearSession(); // if you maintain local context too
  };

  return {
    login: async (values: {email: string; password: string}) => {
      const result = await loginMutation({ variables: { input: values } });
      if (!result.data) throw new Error('No data received from server');
      return result;
    },
    register: async (values: {
      username: string;
      email: string;
      password: string;
    }) => {
      await registerMutation({
        variables: { input: values },
      });
    },
    logout,
    loginLoading,
    registerLoading,
    loginError,
    registerError,
  };
};
