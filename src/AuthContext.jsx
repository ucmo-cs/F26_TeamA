import { createContext, useContext, useMemo, useState } from 'react';
import { api, clearSession, getStoredUser, getToken, setSession } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => (getToken() ? getStoredUser() : null));

  const value = useMemo(
    () => ({
      user,
      async login(username, password, role) {
        const data = await api('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ username, password, role }),
        });
        setSession(data.token, data.user);
        setUser(data.user);
        return data.user;
      },
      logout() {
        clearSession();
        setUser(null);
      },
      updateUser(next) {
        setUser(next);
        setSession(getToken(), next);
      },
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
