import {onError} from '@apollo/client/link/error';
import {refreshAccessToken} from '../tokenManager';
import {getAccessToken} from 'features/auth/utils/tokenStorage';
import {triggerLogout} from 'features/auth/utils/logoutTrigger'; // ✅ use this
import Toast from 'react-native-toast-message';
import {Observable} from '@apollo/client';

let isRefreshing = false;
let pendingRequests: (() => void)[] = [];

const resolvePendingRequests = () => {
  pendingRequests.forEach(callback => callback());
  pendingRequests = [];
};

function fromPromise<T>(promise: Promise<T>): Observable<T> {
  return new Observable(observer => {
    promise
      .then(value => {
        observer.next(value);
        observer.complete();
      })
      .catch(observer.error);
  });
}

export const errorLink = onError(
  ({graphQLErrors, networkError, operation, forward}) => {
    let shouldLogout = false;

    if (graphQLErrors) {
      for (const err of graphQLErrors) {
        const code = err.extensions?.code || '';
        const msg = err.message?.toLowerCase() || '';

        if (
          code === 'UNAUTHENTICATED' ||
          msg.includes('token') ||
          msg.includes('authorization header missing')
        ) {
          if (!isRefreshing) {
            isRefreshing = true;

            return fromPromise<void>(
              refreshAccessToken().then(newToken => {
                isRefreshing = false;

                if (!newToken) {
                  shouldLogout = true;
                  return;
                }

                resolvePendingRequests();

                operation.setContext(({headers = {}}) => ({
                  headers: {
                    ...headers,
                    authorization: `Bearer ${newToken}`,
                  },
                }));

                return;
              }),
            ).flatMap(() => {
              if (shouldLogout) {
                console.log(
                  'errorLink: refresh token missing or invalid; triggering logout',
                );
                triggerLogout();
                Toast.show({
                  type: 'error',
                  text1: 'Session expired',
                  text2: 'Please log in again.',
                });
                return Observable.of(); // Empty observable
              }

              return fromPromise(getAccessToken()).flatMap(token => {
                operation.setContext(({headers = {}}) => ({
                  headers: {
                    ...headers,
                    authorization: `Bearer ${token}`,
                  },
                }));
                return forward(operation);
              });
            });
          }

          // Queue the request while refresh is in progress
          return fromPromise<void>(
            new Promise<void>(resolve => {
              pendingRequests.push(() => resolve());
            }),
          ).flatMap(() => {
            return fromPromise(getAccessToken()).flatMap(token => {
              operation.setContext(({headers = {}}) => ({
                headers: {
                  ...headers,
                  authorization: `Bearer ${token}`,
                },
              }));
              return forward(operation);
            });
          });
        }
      }
    }

    if (networkError) {
      const err = networkError as any;
      const msg = err.message?.toLowerCase() || '';
      const status = err.statusCode || 0;

      const isAuthFailure = status === 401 || status === 403;
      const isConnectionIssue =
        msg.includes('failed to fetch') ||
        msg.includes('network request failed') ||
        msg.includes('connection refused') ||
        msg.includes('socket closed') ||
        msg.includes('timeout') ||
        !navigator.onLine;

      if (isConnectionIssue) {
        console.log('errorLink: network connection issue');
        Toast.show({
          type: 'error',
          text1: 'Server unreachable',
          text2: 'Try again in a few minutes.',
        });
        return forward(operation);
      }

      if (isAuthFailure && !isRefreshing) {
        console.log('errorLink: authentication failure, triggering logout');
        triggerLogout();
        Toast.show({
          type: 'error',
          text1: 'Authentication failed',
          text2: 'Please log in again.',
        });
      }
    }
  },
);
