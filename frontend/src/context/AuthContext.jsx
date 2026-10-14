import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile as updateFirebaseProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [user, setUser] = useState(null); // Mongo profile
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!firebaseUser;

  const syncMongoProfile = useCallback(async (name) => {
    try {
      const { data } = await api.post('/auth/sync', name ? { name } : {});
      setUser(data.data.user);
    } catch (err) {
      console.error('Failed to sync profile:', err);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        await syncMongoProfile();
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [syncMongoProfile]);

  const login = useCallback(async (email, password) => {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    await syncMongoProfile();
    return credential;
  }, [syncMongoProfile]);

  const register = useCallback(async (name, email, password) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    if (name) {
      await updateFirebaseProfile(credential.user, { displayName: name });
    }
    await syncMongoProfile(name);
    return credential;
  }, [syncMongoProfile]);

  const loginWithGoogle = useCallback(async () => {
    const credential = await signInWithPopup(auth, googleProvider);
    await syncMongoProfile(credential.user.displayName);
    return credential;
  }, [syncMongoProfile]);

  const logout = useCallback(async () => {
    await signOut(auth);
    setUser(null);
  }, []);

  const value = {
    firebaseUser,
    user,
    loading,
    isAuthenticated,
    login,
    register,
    loginWithGoogle,
    logout,
    refreshProfile: syncMongoProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
