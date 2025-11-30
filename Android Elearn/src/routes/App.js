import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import 'react-native-reanimated';
import SessionManager from '../utils/SessionManager';

// Import screens
import LoginScreen from '../components/Login';
import RegisterScreen from '../components/Register';
import MateriEyeTrackingScreen from '../components/MateriEyeTracking';
import FaceCaptureScreen from '../components/FaceCapture';
import HomeScreen from '../components/HomeScreen';
import ProfileScreen from '../components/ProfileScreen';
import CameraScreen from '../components/CameraScreen';
import RiwayatPresensiScreen from '../components/RiwayatPresensi';
import BottomNavigation from '../components/BottomNavigation';

const Stack = createNativeStackNavigator();

// Wrappers yang menyertakan bottom navigation
const HomeScreenWithNav = ({ navigation }) => (
  <View style={styles.screenContainer}>
    <HomeScreen navigation={navigation} />
    <BottomNavigation />
  </View>
);

const ProfileScreenWithNav = ({ navigation }) => (
  <View style={styles.screenContainer}>
    <ProfileScreen navigation={navigation} />
    <BottomNavigation />
  </View>
);

const RiwayatPresensiScreenWithNav = ({ navigation }) => (
  <View style={styles.screenContainer}>
    <RiwayatPresensiScreen navigation={navigation} />
    <BottomNavigation />
  </View>
);

// Placeholder screens dengan bottom navigation
const CoursesScreen = () => (
  <View style={styles.placeholderContainer}>
    <View style={styles.placeholderContent}>
      <Text style={styles.placeholderTitle}>My Courses</Text>
      <Text style={styles.placeholderText}>Halaman My Courses akan segera tersedia</Text>
    </View>
    <BottomNavigation />
  </View>
);

const NotificationsScreen = () => (
  <View style={styles.placeholderContainer}>
    <View style={styles.placeholderContent}>
      <Text style={styles.placeholderTitle}>Notifications</Text>
      <Text style={styles.placeholderText}>Halaman Notifications akan segera tersedia</Text>
    </View>
    <BottomNavigation />
  </View>
);

// Camera tanpa bottom navigation
const CameraScreenNoNav = ({ navigation, route }) => (
  <CameraScreen navigation={navigation} route={route} />
);

// AuthLoading Screen - untuk cek session
const AuthLoadingScreen = () => (
  <View style={styles.authLoadingContainer}>
    <ActivityIndicator size="large" color="#4F46E5" />
    <Text style={styles.authLoadingText}>Memuat...</Text>
  </View>
);

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Cek session saat aplikasi pertama kali dibuka
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      console.log('🔍 Checking session...');
      
      // Gunakan SessionManager untuk cek login status
      const isLoggedIn = await SessionManager.isLoggedIn();
      
      if (isLoggedIn) {
        const { user } = await SessionManager.getSession();
        console.log('✅ Session found - User logged in:', user?.username || 'Unknown');
        setIsLoggedIn(true);
      } else {
        console.log('❌ No session found - User not logged in');
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error('❌ Error checking session:', error);
      setIsLoggedIn(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <AuthLoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName={isLoggedIn ? "Home" : "Login"} 
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={HomeScreenWithNav} />
        <Stack.Screen name="Training" component={HomeScreenWithNav} />
        {/* <Stack.Screen name="TrainingFace" component={TrainingFace} /> */}
        <Stack.Screen name="Profile" component={ProfileScreenWithNav} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Courses" component={CoursesScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="Camera" component={CameraScreenNoNav} />
        <Stack.Screen name="MateriEyeTracking" component={MateriEyeTrackingScreen} />
        <Stack.Screen name="TrainingFace" component={FaceCaptureScreen} />
        <Stack.Screen name="RiwayatPresensi" component={RiwayatPresensiScreenWithNav} />
        {/* ✅ sudah didaftarkan */}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
  },
  placeholderContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  placeholderContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 10,
  },
  placeholderText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },
  authLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  authLoadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#4F46E5',
    fontWeight: '600',
  },
});
