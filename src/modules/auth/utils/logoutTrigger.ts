let logoutCallback: (() => void) | null = null;

export const registerLogoutCallback = (cb: () => void) => {
  logoutCallback = cb;
};

export const triggerLogout = () => {
  if (logoutCallback) logoutCallback();
};