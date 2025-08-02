// auth.service.ts
import {useMutation} from '@apollo/client';
import { LOGIN_MUTATION, REGISTER_MUTATION } from '../graphql/auth.mutations';
import {useNavigate} from 'react-router-native';
import {useAuth} from '../../../features/auth/context/AuthContext';
import {triggerLogout} from 'features/auth/utils/logoutTrigger'; // ✅ use this
import {GymRole} from 'features/gyms/types/gym.types';
import {storage} from 'features/auth/utils/storage';

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
              role.role === 'GYM_ADMIN' || role.role === 'GYM_MODERATOR',
          ) ?? false;

        if (isGymManager) {
          navigate('/gym-admin');
        } else {
          navigate('/user');
        }
      },
    });

  const [registerMutation, {loading: registerLoading, error: registerError}] =
    useMutation(REGISTER_MUTATION, {
      onCompleted: async data => {
        const {user, accessToken, refreshToken} = data.register;
        await setSession({user, accessToken, refreshToken});
        navigate('/user');
      },
    });

  const logout = async () => {
    console.log('useAuthService: logout called');
    triggerLogout();
    if (clearSession) clearSession(); // if you maintain local context too
  };

  return {
    login: async (values: {email: string; password: string}) => {
      const result = await loginMutation({variables: {input: values}});

      // This check is misleading; loginError from Apollo already contains the real error
      if (!result.data) {
        // Do nothing here — the loginError will be handled via Apollo's built-in error handling
        return;
      }

      return result;
    },
    register: async (values: {
      username: string;
      email: string;
      password: string;
    }) => {
      await registerMutation({
        variables: {input: values},
      });
    },
    logout,
    loginLoading,
    registerLoading,
    loginError,
    registerError,
  };
};
