import React, {
    createContext, useContext, useEffect, useState, type
        PropsWithChildren
} from 'react';
import { useRouter, useRootNavigationState, Redirect } from 'expo-router';
import * as Keychain from 'react-native-keychain'; // For secure token
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

interface AuthContextType {
    userToken: string | null; isLoading: boolean; signIn: (credentials: any) => Promise<void>;
    signOut: () => Promise<void>; signUp: (details: any) => Promise<void>;
    userData: { _id: string; email: string; } | null;
}

const API_URL = 'http://localhost:5000';
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: PropsWithChildren) => {
    const [userToken, setUserToken] = useState<string | null>(null);
    const [userData, setUserData] = useState<{
        _id: string; email: string;
    } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const rootNavigationState = useRootNavigationState();

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                let token = null;

                try {
                    const credentials = await Keychain.getGenericPassword();
                    if (credentials && credentials.password) {
                        token = credentials.password;
                        console.log('Token loaded from Keychain');
                    }
                } catch (keychainError) {
                    console.warn('Keychain read failed, trying AsyncStorage fallback:', keychainError);
                    try {
                        token = await AsyncStorage.getItem('auth_token');
                        if (token) {
                            console.log('Token loaded from AsyncStorage fallback');
                        }
                    } catch (storageError) {
                        console.warn('AsyncStorage fallback also failed:', storageError);
                    }
                }

                if (token) {
                    setUserToken(token);
                }

                const storedUserData = await AsyncStorage.getItem('user_data');
                if (storedUserData) {
                    setUserData(JSON.parse(storedUserData));
                }
            } catch (e) {
                console.error('Failed to load initial auth data:', e);
            } finally {
                setIsLoading(false);
            }
        };

        if (rootNavigationState?.key) {
            loadInitialData();
        }
    }, [rootNavigationState?.key]);
    

    const signIn = async (credentials: any) => {
        setIsLoading(true);


        try {
            // TODO: Where we will make a change to the API to authenticate

            await new Promise(resolve => setTimeout(resolve, 1000));
            const mockToken = 'some-jwt-token';
            const mockUser = {
                _id: "user-id-123", email: credentials.email,
            };
            await Keychain.setGenericPassword('auth_token_key', mockToken);
            await AsyncStorage.setItem('user_data', JSON.stringify(mockUser));
            setUserToken(mockToken);
            setUserData(mockUser);

            // CHANGE ABOVE: Replace with actual API call



        } catch (error) {
            console.error('Login failed:', error);
        } finally {
            setIsLoading(false);
        }
    };


    const signOut = async () => {
        setIsLoading(true);
        try {

            // Clear the token and user data and call the API to logout
            // YOUR CODE HERE


            // CHANGE ABOVE: Replace with actual API call to logout if needed

            try {
                await Keychain.resetGenericPassword();
            } catch (keychainError) {
                console.warn('Keychain reset failed:', keychainError);
                // Try AsyncStorage fallback cleanup
                await AsyncStorage.removeItem('auth_token');
            }

            await AsyncStorage.removeItem('user_data');

            setUserToken(null);
            setUserData(null);
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const signUp = async (details: any) => {
        setIsLoading(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            const mockToken = 'new-user-jwt-token';
            const mockUser = { _id: "user-id-456", email: details.email };
            await Keychain.setGenericPassword('auth_token_key', mockToken);
            await AsyncStorage.setItem('user_data', JSON.stringify(mockUser));
            setUserToken(mockToken);
            setUserData(mockUser);

            // CHANGE ABOVE: Replace with actual API call to register user


        } catch (error) {
            console.error('Signup failed:', error);
            // Handle error
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{ userToken, isLoading, signIn, signOut, signUp, userData }}>
            {children}
        </AuthContext.Provider>
    );
};



export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) { throw new Error('useAuth must be used within an AuthProvider'); }
    return context;
};