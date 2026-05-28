// Decode JWT token and extract user data
export const decodeToken = (token) => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (err) {
    console.error('Token decode error:', err);
    return null;
  }
};

// Get current user role from localStorage
export const getUserRole = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return String(user.role || user.role_id || 'guest').toLowerCase();
  } catch (err) {
    return 'guest';
  }
};

// Get current user info
export const getUserInfo = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch (err) {
    return {};
  }
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  return !!(token && user);
};

// Check if user has required role
export const hasRole = (requiredRoles) => {
  const userRole = getUserRole();
  if (typeof requiredRoles === 'string') {
    return userRole === requiredRoles.toLowerCase();
  }
  return requiredRoles.map(r => r.toLowerCase()).includes(userRole);
};

// Logout user
export const logout = () => {
  localStorage.clear();
  window.location.href = '/';
};
