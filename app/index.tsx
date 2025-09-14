import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Keychain from 'react-native-keychain';

const API_URL = 'http://localhost:5000'; // Change if using a different backend host

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem('user_data');
        if (jsonValue != null) {
          const userData = JSON.parse(jsonValue);
          setEmail(userData.email || '');
        }
      } catch (e) {
        console.error('Failed to load user data', e);
      }
    };
    loadUserData();
  }, []);

  const handleLogin = async () => {
    setErrorMessage('');
    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    try {
      // Call backend API
      const res = await axios.post(`${API_URL}/login`, {
        email,
        password
      });

      const token = res.data.token;
      const user = res.data.user;

      // Store token securely
      try {
        await Keychain.setGenericPassword('auth_token_key', token);
        console.log('Token stored in Keychain');
      } catch (keychainError) {
        console.warn('Keychain failed, falling back to AsyncStorage:', keychainError);
        await AsyncStorage.setItem('auth_token', token);
      }

      // Store user data
      await AsyncStorage.setItem('user_data', JSON.stringify(user));

      // Navigate to profile
      router.replace('/profile');

    } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      // error is AxiosError, safe to access response etc.
      console.error('Login error:', error.response?.data || error.message);
      setErrorMessage(error.response?.data?.message || 'Failed to log in. Please try again.');
    } else if (error instanceof Error) {
      // generic JS error
      console.error('Login error:', error.message);
      setErrorMessage('Failed to log in. Please try again.');
    } else {
      // unknown error type
      console.error('Unexpected error:', error);
      setErrorMessage('Failed to log in. Please try again.');
    }
  }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      <TextInput
        placeholder="Email"
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        placeholder="Password"
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {!!errorMessage && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Log In</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.secondaryButton]}
        onPress={() => router.push('/create')}
      >
        <Text style={[styles.buttonText, styles.secondaryButtonText]}>
          Create an Account
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: '#e0e0e0',
  },
  secondaryButtonText: {
    color: '#000',
  },
  errorBox: {
    backgroundColor: '#f8d7da',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f5c6cb',
  },
  errorText: {
    color: '#721c24',
    textAlign: 'center',
  },
});
