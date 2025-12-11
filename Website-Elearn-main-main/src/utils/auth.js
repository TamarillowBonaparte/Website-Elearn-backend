// src/utils/auth.js

// Keys used in storage
const TOKEN_KEY = 'token';
const USER_KEY = 'user';
const ROLE_KEY = 'role';
const USERNAME_KEY = 'username';

const normalizeStorageValue = (value) => {
  if (value === undefined || value === null) return null;
  const trimmed = value.toString().trim();
  if (trimmed === "" || trimmed === "null" || trimmed === "undefined") {
    return null;
  }
  return trimmed;
};

/**
 * Get item from either localStorage or sessionStorage
 * Checks localStorage first, then sessionStorage
 */
const getStorageItem = (key) => {
  const localValue = normalizeStorageValue(localStorage.getItem(key));
  if (localValue) return localValue;
  return normalizeStorageValue(sessionStorage.getItem(key));
};

/**
 * Set item to specific storage
 */
const setStorageItem = (key, value, remember = false) => {
  if (value === undefined || value === null) {
    removeStorageItem(key);
    return;
  }

  // Always clear from other storage to avoid duplicates/confusion
  if (remember) {
    sessionStorage.removeItem(key);
    localStorage.setItem(key, value);
  } else {
    localStorage.removeItem(key);
    sessionStorage.setItem(key, value);
  }
};

/**
 * Remove item from both storages
 */
const removeStorageItem = (key) => {
  localStorage.removeItem(key);
  sessionStorage.removeItem(key);
};

// --- Exported Functions ---

export const getToken = () => getStorageItem(TOKEN_KEY);

export const setToken = (token, remember = false) => {
  setStorageItem(TOKEN_KEY, token, remember);
};

export const removeToken = () => removeStorageItem(TOKEN_KEY);

export const getUser = () => {
  const user = getStorageItem(USER_KEY);
  return user ? JSON.parse(user) : null;
};

export const setUser = (user, remember = false) => {
  setStorageItem(USER_KEY, JSON.stringify(user), remember);
};

export const getRole = () => getStorageItem(ROLE_KEY);

export const setRole = (role, remember = false) => {
  setStorageItem(ROLE_KEY, role, remember);
};

export const getUsername = () => getStorageItem(USERNAME_KEY);

export const setUsername = (username, remember = false) => {
  setStorageItem(USERNAME_KEY, username, remember);
};

export const clearAuth = () => {
  removeToken();
  removeStorageItem(USER_KEY);
  removeStorageItem(ROLE_KEY);
  removeStorageItem(USERNAME_KEY);
};

export const isAuthenticated = () => {
  return !!getToken();
};