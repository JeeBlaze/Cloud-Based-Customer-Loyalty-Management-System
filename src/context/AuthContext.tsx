import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, loginWithGoogle, logoutUser, testConnection } from '../lib/firebase';
import { Role, Customer } from '../types';
import { loyaltyService } from '../services/loyaltyService';

interface AuthContextType {
  user: User | null;
  role: Role;
  setRole: (role: Role) => void;
  selectedCustomerId: string;
  setSelectedCustomerId: (id: string) => void;
  currentCustomer?: Customer;
  activeBranchId: string;
  setActiveBranchId: (id: string) => void;
  loading: boolean;
  firestoreConnected: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>('PLATFORM_ADMIN');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('cust_sophia_chen');
  const [activeBranchId, setActiveBranchId] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [firestoreConnected, setFirestoreConnected] = useState(false);

  useEffect(() => {
    // Test initial connection
    testConnection().then((connected) => {
      setFirestoreConnected(connected);
    });

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Default to admin if email matches or if admin
        if (firebaseUser.email === 'jeevavilva55@gmail.com') {
          setRole('PLATFORM_ADMIN');
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error('Sign-in failed:', err);
    }
  };

  const signOut = async () => {
    try {
      await logoutUser();
      setUser(null);
    } catch (err) {
      console.error('Sign-out failed:', err);
    }
  };

  const currentCustomer = loyaltyService.getCustomerById(selectedCustomerId);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        setRole,
        selectedCustomerId,
        setSelectedCustomerId,
        currentCustomer,
        activeBranchId,
        setActiveBranchId,
        loading,
        firestoreConnected,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
