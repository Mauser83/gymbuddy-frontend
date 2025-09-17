/**
 * Format date to localized string
 */
export const formatDate = (timestamp?: string) => {
  if (!timestamp || isNaN(parseInt(timestamp))) return 'Unknown';
  return new Date(parseInt(timestamp)).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Capitalize first letter of a string
 */
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Format time in HH:MM format
 */
export const formatTime = (date: Date | string): string => {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
