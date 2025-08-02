let logoutCallback: (() => void) | null = null;

export const registerLogoutCallback = (cb: () => void) => {
  logoutCallback = cb;
};

export const triggerLogout = () => {
  console.log('logoutTrigger: triggerLogout called');
  if (logoutCallback) logoutCallback();
};
