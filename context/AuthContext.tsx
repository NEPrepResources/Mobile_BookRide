import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { API_URL } from '@/constants/api';
import { Alert } from 'react-native';

interface User {
  id: number;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing user on app startup
    const loadUser = async () => {
      try {
        const userString = await SecureStore.getItemAsync('user');
        if (userString) {
          setUser(JSON.parse(userString));
        }
      } catch (error) {
        console.error('Error loading user from storage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/users?email=${email}&password=${password}`);
      
      if (response.data && response.data.length > 0) {
        const userData = response.data[0];
        // Remove password before storing
        const { password, ...userWithoutPassword } = userData;
        
        await SecureStore.setItemAsync('user', JSON.stringify(userWithoutPassword));
        setUser(userWithoutPassword);
        return true;
      } else {
        Alert.alert('Login Failed', 'Invalid email or password');
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Login Error', 'An error occurred during login');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Check if email already exists
      const checkResponse = await axios.get(`${API_URL}/users?email=${email}`);
      
      if (checkResponse.data && checkResponse.data.length > 0) {
        Alert.alert('Registration Failed', 'Email already in use');
        return false;
      }
      
      // Create new user
      const response = await axios.post(`${API_URL}/users`, {
        name,
        email,
        password
      });
      
      if (response.data) {
        const { password, ...userWithoutPassword } = response.data;
        await SecureStore.setItemAsync('user', JSON.stringify(userWithoutPassword));
        setUser(userWithoutPassword);
        return true;
      } else {
        Alert.alert('Registration Failed', 'Could not create account');
        return false;
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Registration Error', 'An error occurred during registration');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync('user');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateUser = async (userData: Partial<User>): Promise<boolean> => {
    if (!user) return false;
    
    setIsLoading(true);
    try {
      const response = await axios.patch(`${API_URL}/users/${user.id}`, userData);
      
      if (response.data) {
        const updatedUser = { ...user, ...userData };
        await SecureStore.setItemAsync('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        return true;
      } else {
        Alert.alert('Update Failed', 'Could not update profile');
        return false;
      }
    } catch (error) {
      console.error('Update user error:', error);
      Alert.alert('Update Error', 'An error occurred while updating profile');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isLoading, 
        login, 
        register, 
        logout,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};