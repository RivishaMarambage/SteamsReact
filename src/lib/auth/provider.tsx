'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import type { User, MenuItem, Order, CartItem } from '@/lib/types';
import { MOCK_DATA, MENU_ITEMS } from '@/lib/mock-data';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password?: string) => User | null;
  logout: () => void;
  signup: (details: Omit<User, 'id'|'points'|'loyaltyLevel'|'recentOrders'|'analytics'>) => boolean;
}

interface MockDataContextType {
    users: User[];
    menuItems: MenuItem[];
    isLoading: boolean;
    findUser: (query: string) => User | null;
    updateUser: (user: User) => void;
    deleteUser: (userId: string) => void;
    addMenuItem: (item: MenuItem) => void;
    updateMenuItem: (item: MenuItem) => void;
    deleteMenuItem: (itemId: string) => void;
    placeOrder: (cart: CartItem[], total: number, customerId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const MockDataContext = createContext<MockDataContextType | undefined>(undefined);


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(MOCK_DATA);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(MENU_ITEMS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate checking for a logged-in user in session storage
    try {
      const storedUser = sessionStorage.getItem('currentUser');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        // We need to find the user from our "DB" to ensure data is fresh
        const freshUser = MOCK_DATA.find(u => u.id === parsedUser.id);
        setUser(freshUser || parsedUser);
      }
    } catch (error) {
        console.error("Could not parse user from session storage", error)
        sessionStorage.removeItem('currentUser');
    } finally {
        setIsLoading(false);
    }
  }, []);

  const login = (email: string, password?: string) => {
    // In mock mode, we ignore the password
    const foundUser = users.find(u => u.email === email);
    if (foundUser) {
      setUser(foundUser);
      sessionStorage.setItem('currentUser', JSON.stringify(foundUser));
      return foundUser;
    }
    return null;
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('currentUser');
  };

  const signup = (details: Omit<User, 'id'|'points'|'loyaltyLevel'|'recentOrders'|'analytics'>) => {
    if (users.some(u => u.email === details.email)) {
      return false; // User already exists
    }
    const newUser: User = {
      id: `usr_${Date.now()}`,
      ...details,
      points: 0,
      loyaltyLevel: 'None',
      recentOrders: [],
    };
    setUsers(prev => [...prev, newUser]);
    return true;
  };

  const findUser = (query: string) => {
    return users.find(u => u.email === query || u.mobileNumber === query) || null;
  };

  const updateUser = (updatedUser: User) => {
    setUsers(prevUsers => {
      const newUsers = prevUsers.map(u => u.id === updatedUser.id ? updatedUser : u);
      // Also update the MOCK_DATA reference if needed for other sessions, though this is a client-side mock
      const mockIndex = MOCK_DATA.findIndex(u => u.id === updatedUser.id);
      if (mockIndex !== -1) MOCK_DATA[mockIndex] = updatedUser;
      
      // If the updated user is the currently logged-in user, update session storage
      if (user && user.id === updatedUser.id) {
          setUser(updatedUser);
          sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));
      }
      return newUsers;
    });
  };
  
  const deleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
  };
  
  const addMenuItem = (item: MenuItem) => {
    setMenuItems(prev => [...prev, item]);
  };
  
  const updateMenuItem = (updatedItem: MenuItem) => {
    setMenuItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
  };

  const deleteMenuItem = (itemId: string) => {
    setMenuItems(prev => prev.filter(item => item.id !== itemId));
  }

  const placeOrder = (cart: CartItem[], total: number, customerId: string) => {
    const customer = users.find(u => u.id === customerId);
    if (!customer) return;

    const pointsEarned = Math.floor(total);
    const newOrder: Order = {
      id: `ord_${Date.now()}`,
      date: new Date().toISOString(),
      items: cart,
      total,
      pointsEarned,
      status: 'Pending',
    };

    const updatedUser: User = {
      ...customer,
      points: (customer.points || 0) + pointsEarned,
      recentOrders: [newOrder, ...(customer.recentOrders || [])],
    };

    updateUser(updatedUser);
  };

  const authContextValue = useMemo(() => ({
    user,
    isLoading,
    login,
    logout,
    signup,
  }), [user, isLoading, users]);

  const mockDataContextValue = useMemo(() => ({
      users,
      menuItems,
      isLoading,
      findUser,
      updateUser,
      deleteUser,
      addMenuItem,
      updateMenuItem,
      deleteMenuItem,
      placeOrder,
  }), [users, menuItems, isLoading, user]);

  return (
    <AuthContext.Provider value={authContextValue}>
        <MockDataContext.Provider value={mockDataContextValue}>
            {children}
        </MockDataContext.Provider>
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useUser = () => {
    const { user, isLoading } = useAuth();
    return { user, isLoading };
}

export const useMockData = () => {
    const context = useContext(MockDataContext);
    if (context === undefined) {
        throw new Error('useMockData must be used within an AuthProvider');
    }
    return context;
}