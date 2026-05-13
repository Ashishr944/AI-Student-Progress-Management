const STORAGE_KEY = 'spm_user';

export const storeUser = (user) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
};

export const getStoredUser = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
};

export const clearStoredUser = () => {
  localStorage.removeItem(STORAGE_KEY);
};
