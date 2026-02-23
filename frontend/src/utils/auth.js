/**
 * Decode JWT token and safely extract user role
 * Handles sub as object or string
 * Returns null if token is invalid or role cannot be determined
 */
export const getUserRole = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const sub = payload.sub;

    if (!sub) return null;

    // If sub is already an object, just return role
    if (typeof sub === 'object' && sub !== null) {
      return sub.role || null;
    }

    // If sub is a string, parse it as JSON
    if (typeof sub === 'string') {
      const subObj = JSON.parse(sub);
      return subObj.role || null;
    }

    return null;
  } catch (e) {
    console.warn("Failed to decode JWT:", e);
    return null;
  }
};

/**
 * Decode JWT token and safely extract user ID
 * Useful for future use if you need user ID from token
 */
export const getUserId = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const sub = payload.sub;

    if (!sub) return null;

    if (typeof sub === 'object' && sub !== null) {
      return sub.id || null;
    }

    if (typeof sub === 'string') {
      const subObj = JSON.parse(sub);
      return subObj.id || null;
    }

    return null;
  } catch (e) {
    console.warn("Failed to decode JWT:", e);
    return null;
  }
};

/**
 * Authenticated fetch wrapper
 * Automatically adds Bearer token and JSON headers
 * Returns a standard fetch Promise
 */
export const authFetch = async (url, options = {}) => {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, { ...options, headers });
    return res;
  } catch (err) {
    console.error("Network or fetch error:", err);
    throw err;
  }
};

/**
 * Optional: Helper to check if current user is Manager
 */
export const isManager = () => getUserRole() === 'Manager';

/**
 * Optional: Helper to check if user is authenticated
 */
export const isAuthenticated = () => !!localStorage.getItem('token');