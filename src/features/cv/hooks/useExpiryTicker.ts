import React from 'react';

export function useExpiryTicker(expiresAt?: string | null) {
  const [remaining, setRemaining] = React.useState(0);

  React.useEffect(() => {
    if (!expiresAt) {
      setRemaining(0);
      return;
    }
    const end = new Date(expiresAt).getTime();
    const update = () => {
      const diff = Math.max(0, Math.floor((end - Date.now()) / 1000));
      setRemaining(diff);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return remaining;
}

export default useExpiryTicker;