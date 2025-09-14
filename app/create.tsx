import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';

const API_URL = 'http://localhost:5000'; // Change if backend is on another host

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [birthday, setBirthday] = useState('');

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Email and password are required.');
      return;
    }

    try {
      // Call backend register route
      const res = await axios.post(`${API_URL}/register`, {
        email,
        password,
        name,
        phone,
        address,
        birthday,
      });

      const user = res.data.user || {};

      // Store the full data locally (using your form values to guarantee)
      const userDataToStore = {
        name,
        email,
        phone,
        address,
        birthday,
        ...user, // merge any additional backend user info if available
      };

      await AsyncStorage.setItem('user_data', JSON.stringify(userDataToStore));

      const token = res.data.access_token || res.data.token;
      if (token) {
        await AsyncStorage.setItem('auth_token', token);
      }

      Alert.alert('Success', 'Account created!');
      router.replace('/'); // navigate to login page or home

    } catch (error: any) {
      console.error('Register error:', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.message || 'Failed to register. Please try again.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Email Address"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />


      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Create Account</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#fff',
    flexGrow: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 14,
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
});
