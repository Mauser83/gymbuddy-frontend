import * as jwt_decode from 'jwt-decode';

export const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true;

  try {
    const decoded: any = jwt_decode.jwtDecode(token);
    const exp = decoded.exp;
    if (!exp) return true;

    const now = Date.now() / 1000; // JWT exp is in seconds
    return exp < now;
  } catch (err) {
    console.error('Failed to decode token', err);
    return true;
  }
};
