import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);

  // The token is read from localStorage by the axios interceptor.
  const signIn = ({ token, user: signedInUser }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(signedInUser));
    setUser(signedInUser);
  };

  const signOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, signIn, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
