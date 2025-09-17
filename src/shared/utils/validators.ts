/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/**
 * Validate password strength
 * Requires: 8+ chars, 1 number, 1 special char
 */
export const validatePassword = (password: string): boolean => {
  const re = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/;
  return re.test(password);
};

/**
 * Validate required field
 */
export const validateRequired = (value: string): boolean => {
  return value.trim().length > 0;
};

/**
 * Validate minimum length
 */
export const validateMinLength = (value: string, min: number): boolean => {
  return value.length >= min;
};
