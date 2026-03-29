import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

const AuthContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    // This error is thrown if the hook is used outside of a provider
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setCurrentUser(user);
        setLoading(false);
      },
      (error) => {
        console.error('Auth state error:', error);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  const value = useMemo(() => ({ currentUser, loading }), [currentUser, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}