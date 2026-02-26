/**
 * ============================================================
 * AUTH UTILITIES
 * ------------------------------------------------------------
 * JWT Structure (Backend):
 * 
 * {
 *   "sub": "1",          // user_id as string
 *   "role": "Manager",   // additional claim
 *   "exp": 1234567890
 * }
 *
 * - sub is now ALWAYS a string (user ID)
 * - role is stored at top-level
 * ============================================================
 */


/**
 * Safely decode a JWT token
 * Returns parsed payload or null if invalid
 */
const decodeToken = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload;
  } catch (e) {
    console.warn("Failed to decode JWT:", e);
    return null;
  }
};


/**
 * Get current user role from JWT
 * Reads role from top-level claim
 * Returns: "Manager", "Employee", or null
 */
export const getUserRole = () => {
  const payload = decodeToken();
  if (!payload) return null;

  return payload.role || null;
};


/**
 * Get current user ID from JWT
 * sub is stored as string → convert to number if needed
 * Returns: number or null
 */
export const getUserId = () => {
  const payload = decodeToken();
  if (!payload) return null;

  return payload.sub ? parseInt(payload.sub) : null;
};


/**
 * Check if current user is Manager
 * Returns: true / false
 */
export const isManager = () => {
  return getUserRole() === 'Manager';
};


/**
 * Check if user is authenticated
 * (Token existence only — does not verify expiration)
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};


/**
 * Authenticated fetch wrapper
 * Automatically:
 *  - Adds Authorization Bearer header
 *  - Adds JSON Content-Type
 *  - Handles expired/invalid token responses
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
    const response = await fetch(url, {
      ...options,
      headers
    });

    // Optional: Auto-logout on invalid/expired token
    if (response.status === 401 || response.status === 422) {
      console.warn("Authentication error. Logging out.");
      localStorage.removeItem('token');
      window.location.href = '/';
      return;
    }

    return response;

  } catch (error) {
    console.error("Network error:", error);
    throw error;
  }
};