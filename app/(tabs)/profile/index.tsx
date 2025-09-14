import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [birthday, setBirthday] = useState('');
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);

  // Load user data from AsyncStorage on mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem('user_data');
        if (jsonValue) {
          const userData = JSON.parse(jsonValue);
          setName(userData.name || '');
          setEmail(userData.email || '');
          setPhone(userData.phone || '');
          setAddress(userData.address || '');
          setBirthday(userData.birthday || '');
          setProfileImageUri(userData.profileImageUri || null);
        }
      } catch (error) {
        console.error('Failed to load profile data', error);
      }
    };

    loadUserData();
  }, []);

  // Image picker function
  const pickImage = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.7,
      },
      (response) => {
        if (response.didCancel) {
          return;
        } else if (response.errorCode) {
          Alert.alert('Error', response.errorMessage || 'Error picking image');
        } else {
          const uri = response.assets?.[0]?.uri;
          if (uri) {
            setProfileImageUri(uri);
          }
        }
      }
    );
  };

  // Save profile data to AsyncStorage
  const saveProfile = async () => {
    const userData = {
      name,
      email,
      phone,
      address,
      birthday,
      profileImageUri,
    };
    try {
      await AsyncStorage.setItem('user_data', JSON.stringify(userData));
      Alert.alert('Success', 'Profile saved.');
      setIsEditing(false);
    } catch (e) {
      console.error('Failed to save profile', e);
      Alert.alert('Error', 'Could not save profile.');
    }
  };

  // Logout clears user session (you might want to clear more if needed)
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('user_data');
      await AsyncStorage.removeItem('auth_token');
      router.replace('/'); // Redirect to login or home screen
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity
        onPress={isEditing ? pickImage : undefined}
        activeOpacity={isEditing ? 0.7 : 1}
      >
        <Image
          source={
            profileImageUri
              ? { uri: profileImageUri }
              : require('../../../assets/images/hellokitty.jpg')
          }
          style={styles.profileImage}
        />
        {isEditing && (
          <View style={styles.editOverlay}>
            <Text style={styles.editOverlayText}>Change Photo</Text>
          </View>
        )}
      </TouchableOpacity>

      {isEditing ? (
        <TextInput style={styles.nameInput} value={name} onChangeText={setName} />
      ) : (
        <Text style={styles.name}>{name || 'No Name'}</Text>
      )}

      <View style={styles.infoContainer}>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Email Address:</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          ) : (
            <Text style={styles.value}>{email || 'No Email'}</Text>
          )}
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Phone Number:</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          ) : (
            <Text style={styles.value}>{phone || 'No Phone'}</Text>
          )}
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Address:</Text>
          {isEditing ? (
            <TextInput style={styles.input} value={address} onChangeText={setAddress} />
          ) : (
            <Text style={styles.value}>{address || 'No Address'}</Text>
          )}
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Birthday:</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={birthday}
              onChangeText={setBirthday}
              placeholder="YYYY-MM-DD"
            />
          ) : (
            <Text style={styles.value}>{birthday || 'No Birthday'}</Text>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={isEditing ? saveProfile : () => setIsEditing(true)}
      >
        <Text style={styles.buttonText}>{isEditing ? 'Save' : 'Edit Profile'}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#f44336' }]}
        onPress={handleLogout}
      >
        <Text style={[styles.buttonText, { color: '#fff' }]}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  profileImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    marginBottom: 15,
  },
  editOverlay: {
    position: 'absolute',
    bottom: 0,
    width: 140,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderBottomLeftRadius: 70,
    borderBottomRightRadius: 70,
    paddingVertical: 6,
  },
  editOverlayText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 12,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  nameInput: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderColor: '#ccc',
    width: '90%',
    textAlign: 'center',
  },
  infoContainer: {
    width: '90%',
    borderWidth: 1,
    borderRadius: 10,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
    alignItems: 'center',
  },
  label: {
    fontWeight: '500',
    width: '40%',
  },
  value: {
    color: '#333',
    flex: 1,
    textAlign: 'right',
    paddingLeft: 10,
  },
  input: {
    flex: 1,
    borderBottomWidth: 1,
    borderColor: '#ccc',
    paddingLeft: 10,
    textAlign: 'right',
  },
  button: {
    width: '90%',
    padding: 14,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    marginVertical: 6,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    color: '#fff',
  },
});
