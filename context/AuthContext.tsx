import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { API_URL } from '@/constants/api';
import { Alert, Platform } from 'react-native';
import { router } from 'expo-router';

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
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

const createApiClient = () => {
  const instance = axios.create({
    baseURL: API_URL,
    timeout: 3000,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  });
  // if (Platform.OS !== 'web') {
  //   instance.defaults.adapter = require('axios/lib/adapters/http');
  // }
  return instance;
};

const api = createApiClient();

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userString = await SecureStore.getItemAsync('user');
        if (userString) {
          setUser(JSON.parse(userString));
        }
      } catch (error: unknown) {
        console.error('User load error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      console.log(`API Request: GET ${API_URL}/users?email=${encodeURIComponent(email)}`);
      
      const response = await api.get(`/users?email=${encodeURIComponent(email)}`);
      
      if (response.data?.length > 0) {
        const userData = response.data[0];
        
        if (userData.password !== password) {
          Alert.alert('Login Failed', 'Invalid password');
          return false;
        }
        
        const { password: _, ...userWithoutPassword } = userData;
        await SecureStore.setItemAsync('user', JSON.stringify(userWithoutPassword));
        setUser(userWithoutPassword);
        return true;
      }
      
      Alert.alert('Login Failed', 'User not found');
      return false;
    } catch (error: unknown) {
      let errorMessage = 'Login failed';
      
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          errorMessage = 'Request timeout - server took too long to respond';
        } else if (error.response) {
          errorMessage = `Server responded with ${error.response.status}`;
        } else if (error.request) {
          errorMessage = 'No response from server - check your connection';
        } else {
          errorMessage = 'Axios configuration error';
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      console.error('Login error:', error);
      Alert.alert('Login Error', errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const checkResponse = await api.get(`/users?email=${encodeURIComponent(email)}`);
      
      if (checkResponse.data?.length > 0) {
        Alert.alert('Registration Failed', 'Email already in use');
        router.replace('/(auth)/register')
        return false;
      }
      
      const response = await api.post('/users', {
        name,
        email,
        password,
        phone: '',
        address: ''
      });
      
      if (response.data) {
        const { password: _, ...userWithoutPassword } = response.data;
        await SecureStore.setItemAsync('user', JSON.stringify(userWithoutPassword));
        setUser(userWithoutPassword);
        return true;
      }
      
      Alert.alert('Registration Failed', 'Account creation failed');
      return false;
    } catch (error: unknown) {
      console.error('Registration error:', error);
      Alert.alert('Registration Error', 'Failed to create account. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync('user');
      setUser(null);
    } catch (error: unknown) {
      console.error('Logout error:', error);
    }
  };

  const updateUser = async (userData: Partial<User>): Promise<boolean> => {
    if (!user) return false;

    setIsLoading(true);
    try {
      const response = await api.patch(`/users/${user.id}`, userData);
      
      if (response.data) {
        const updatedUser = { ...user, ...userData };
        await SecureStore.setItemAsync('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        return true;
      }
      
      Alert.alert('Update Failed', 'Profile update failed');
      return false;
    } catch (error: unknown) {
      console.error('Update error:', error);
      Alert.alert('Update Error', 'Failed to update profile. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateUser }}>
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