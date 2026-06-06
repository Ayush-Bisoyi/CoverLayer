import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isRegistered: boolean;
  login: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>({
    id: 'u-1',
    name: 'Sarah Jenkins',
    email: 'sarah@coverlayer.co',
    role: 'Broker-Admin',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
  });
  const [loading, setLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(true);

  const login = async (email: string) => {
    setLoading(true);
    setTimeout(() => {
      setUser({
        id: 'u-1',
        name: 'Sarah Jenkins',
        email,
        role: 'Broker-Admin',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
      });
      setIsRegistered(true);
      setLoading(false);
    }, 500);
  };

  const logout = async () => {
    setLoading(true);
    setTimeout(() => {
      setUser(null);
      setLoading(false);
    }, 300);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isRegistered, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
