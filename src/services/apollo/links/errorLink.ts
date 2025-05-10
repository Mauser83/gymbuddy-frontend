// errorLink.ts
import {onError} from '@apollo/client/link/error';
import {refreshAccessToken} from '../tokenManager';
import {logoutFromContext} from 'modules/auth/context/AuthContext';
import Toast from 'react-native-toast-message';
import {Observable} from '@apollo/client';

type MaybeServerError = Error & {
  statusCode?: number;
  bodyText?: string;
};

function fromPromise(promise: Promise<any>) {
  return new Observable(observer => {
    promise
      .then(value => {
        observer.next(value);
        observer.complete();
      })
      .catch(observer.error);
  });
}

export const errorLink = onError(({graphQLErrors, networkError, operation, forward}) => {
  if (graphQLErrors) {
    for (const err of graphQLErrors) {
      const code = err.extensions?.code || '';
      const msg = err.message?.toLowerCase() || '';

      if (code === 'UNAUTHENTICATED' || msg.includes('token')) {
        return fromPromise(
          refreshAccessToken().then(newToken => {
            if (!newToken) throw new Error('No new token');
            operation.setContext(({headers = {}}) => ({
              headers: {
                ...headers,
                authorization: `Bearer ${newToken}`,
              },
            }));
          })
        ).flatMap(() => forward(operation));
      }
    }
  }

  if (networkError) {
    const err = networkError as MaybeServerError;
    const msg = err.message?.toLowerCase() || '';
    const isAuthFailure =
      err.statusCode === 401 ||
      err.statusCode === 403 ||
      msg.includes('socket closed with event 4500');

    if (isAuthFailure) {
      logoutFromContext().then(() => {
        Toast.show({
          type: 'error',
          text1: 'Authentication failed',
          text2: 'Please log in again.',
        });
      });
    } else if (
      msg.includes('failed to fetch') ||
      msg.includes('network request failed') ||
      msg.includes('socket closed') ||
      msg.includes('timeout') ||
      !navigator.onLine
    ) {
      logoutFromContext().then(() => {
        Toast.show({
          type: 'error',
          text1: 'Server unreachable',
          text2: 'Try again in a few minutes.',
        });
      });
    } else {
      console.error('[Network error]:', err);
    }
  }
});
