import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS, GRADIENTS } from '../constants/colors';
import SessionManager from '../utils/SessionManager';
import { API_URL } from '../config/api';

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({ username: '', password: '' });

  // Validasi input
  const validateInputs = () => {
    const newErrors = { username: '', password: '' };
    let isValid = true;

    if (!username.trim()) {
      newErrors.username = 'NIM harus diisi';
      isValid = false;
    } else if (username.length < 9) {
      newErrors.username = 'NIM minimal 9 karakter';
      isValid = false;
    }

    if (!password.trim()) {
      newErrors.password = 'Password harus diisi !';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Simpan data ke AsyncStorage dengan error handling
  const saveToStorage = async (key, value) => {
    try {
      await AsyncStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
      console.log(`✅ ${key} saved successfully`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to save ${key}:`, error);
      throw new Error(`Gagal menyimpan ${key} ke penyimpanan lokal`);
    }
  };

  // Verifikasi data tersimpan
  const verifyStoredData = async (key) => {
    try {
      const data = await AsyncStorage.getItem(key);
      if (!data) {
        throw new Error(`Data ${key} tidak ditemukan setelah penyimpanan`);
      }
      return JSON.parse(data);
    } catch (error) {
      console.error(`❌ Verification failed for ${key}:`, error);
      throw error;
    }
  };

  // Simpan data mahasiswa dengan validasi lengkap
  const saveMahasiswaData = async (userData) => {
    try {
      // Validasi field wajib
      const requiredFields = ['id_mahasiswa', 'nim', 'nama', 'id_kelas', 'id_user'];
      const missingFields = requiredFields.filter(field => !userData[field]);

      if (missingFields.length > 0) {
        throw new Error(
          `Data mahasiswa tidak lengkap. Field yang hilang: ${missingFields.join(', ')}`
        );
      }

      // Buat object mahasiswa
      const mahasiswaData = {
        id_mahasiswa: userData.id_mahasiswa,
        nim: userData.nim,
        nama_mahasiswa: userData.nama,
        id_kelas: userData.id_kelas,
        user_id: userData.id_user,
        kelas_nama: userData.nama_kelas || null, // Simpan nama kelas
      };

      console.log('📋 Menyimpan data mahasiswa:', mahasiswaData);
      return mahasiswaData;
    } catch (error) {
      console.error('❌ Error saat menyiapkan data mahasiswa:', error);
      throw error;
    }
  };

  // Handle login dengan error handling modern
  const handleLogin = async () => {
    // Reset errors
    setErrors({ username: '', password: '' });

    // Validasi input
    if (!validateInputs()) {
      return;
    }

    setIsLoading(true);

    try {
      console.log('🔐 Memulai proses login untuk:', username);

      // Request login ke server
      const response = await axios.post(
        `${API_URL}/auth/login/mobile`,
        { username, password },
        { timeout: 10000 } // 10 detik timeout
      );

      console.log('📥 Response login diterima');

      // Validasi response
      if (!response.data) {
        throw new Error('Response dari server tidak valid');
      }

      if (!response.data.access_token) {
        throw new Error('Access token tidak ditemukan dalam response');
      }

      if (!response.data.user) {
        throw new Error('Data user tidak ditemukan dalam response');
      }

      // Siapkan data mahasiswa jika role = mahasiswa
      let mahasiswaData = null;
      if (response.data.user.role === 'mahasiswa') {
        console.log('ℹ️ User adalah mahasiswa, menyiapkan data mahasiswa...');
        mahasiswaData = await saveMahasiswaData(response.data.user);
      } else {
        console.log(`ℹ️ User bukan mahasiswa (role: ${response.data.user.role})`);
      }

      // Simpan session menggunakan SessionManager
      await SessionManager.saveSession(
        response.data.access_token,
        response.data.user,
        mahasiswaData
      );

      // Login berhasil
      console.log('✅ Login berhasil untuk:', username);
      
      // Cek apakah user sudah memiliki embedding
      const hasEmbedding = await checkEmbeddingStatus(response.data.user.nim || username);
      
      if (!hasEmbedding && response.data.user.role === 'mahasiswa') {
        // Jika belum ada embedding, redirect ke FaceCapture
        console.log('ℹ️ User belum memiliki embedding, redirect ke FaceCapture');
        Alert.alert(
          'Face Recognition Setup',
          'Untuk menggunakan sistem presensi dengan face recognition, silakan lakukan setup wajah Anda terlebih dahulu.',
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.reset({
                  index: 0,
                  routes: [
                    {
                      name: 'TrainingFace',
                      params: {
                        userId: response.data.user.id_user,
                        userName: response.data.user.nama,
                        nim: response.data.user.nim || username,
                      },
                    },
                  ],
                });
              },
            },
          ]
        );
      } else {
        // Jika sudah ada embedding atau bukan mahasiswa, langsung ke Home
        Alert.alert(
          'Berhasil',
          `Selamat datang, ${response.data.user.nama || username}!`,
          [
            {
              text: 'OK',
              onPress: () => {
                console.log('🚀 Navigasi ke Home screen');
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Home' }],
                });
              },
            },
          ]
        );
      }

    } catch (error) {
      console.error('❌ Error login:', error);
      handleLoginError(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle berbagai jenis error dengan pesan yang spesifik
  const handleLoginError = (error) => {
    let errorTitle = 'Login Gagal';
    let errorMessage = 'Terjadi kesalahan. Silakan coba lagi.';

    if (axios.isAxiosError(error)) {
      if (error.response) {
        // Error dari server (4xx, 5xx)
        const status = error.response.status;
        const data = error.response.data;

        console.error('Server error:', status, data);

        switch (status) {
          case 400:
            errorMessage = data?.detail || data?.message || 'Data yang dikirim tidak valid';
            break;
          case 401:
            errorMessage = 'NIM atau password salah';
            break;
          case 403:
            errorMessage = 'Akses ditolak. Hubungi administrator';
            break;
          case 404:
            errorMessage = 'Endpoint login tidak ditemukan';
            break;
          case 500:
            errorMessage = 'Terjadi kesalahan pada server. Coba lagi nanti';
            break;
          default:
            errorMessage = data?.detail || data?.message || `Error: ${status}`;
        }
      } else if (error.request) {
        // Request dibuat tapi tidak ada response
        console.error('No response received:', error.request);
        errorTitle = 'Koneksi Gagal';
        errorMessage = 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda';
      } else if (error.code === 'ECONNABORTED') {
        errorTitle = 'Request Timeout';
        errorMessage = 'Koneksi timeout. Server tidak merespons';
      }
    } else if (error instanceof Error) {
      // Error custom dari kode kita
      errorMessage = error.message;
    }

    Alert.alert(errorTitle, errorMessage, [{ text: 'OK' }]);
  };

  // Cek apakah user sudah memiliki embedding di server
  const checkEmbeddingStatus = async (nim) => {
    try {
      console.log('🔍 Checking embedding status for NIM:', nim);
      console.log('🔗 URL:', `${API_URL}/face-registration/status/${nim}`);
      
      const response = await axios.get(
        `${API_URL}/face-registration/status/${nim}`,
        { timeout: 5000 }
      );
      
      console.log('📊 Response data:', response.data);
      
      if (response.data && response.data.nim) {
        console.log('✅ Embedding found for:', nim);
        return true;
      }
      return false;
    } catch (error) {
      // Jika 404, berarti belum ada embedding
      if (error.response && error.response.status === 404) {
        console.log('ℹ️ No embedding found for:', nim);
        return false;
      }
      
      console.error('⚠️ Error checking embedding status:', error);
      console.error('📊 Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      
      // Jika error lain, anggap belum ada embedding untuk safety
      return false;
    }
  };

  const handleTraining = () => {
    if (isLoading) return;
    console.log('➡️ Navigasi ke TrainingFace...');
    navigation.navigate('TrainingFace');
  };

  return (
    <LinearGradient
      colors={[COLORS.purple50, COLORS.bgPurple, COLORS.blue50]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Selamat Datang</Text>
              <Text style={styles.subtitle}>Silakan masuk ke akun Anda</Text>
            </View>

            {/* Card / Form */}
            <View style={styles.card}>
              {/* Username Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>NIM</Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.username ? styles.inputError : null
                  ]}
                  placeholder="contoh: E41253319"
                  placeholderTextColor={COLORS.gray400}
                  value={username}
                  onChangeText={(text) => {
                    setUsername(text);
                    if (errors.username) {
                      setErrors(prev => ({ ...prev, username: '' }));
                    }
                  }}
                  autoCapitalize="none"
                  editable={!isLoading}
                />
                {errors.username ? (
                  <Text style={styles.errorText}>{errors.username}</Text>
                ) : null}
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.password ? styles.inputError : null
                  ]}
                  placeholder="Masukkan password"
                  placeholderTextColor={COLORS.gray400}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) {
                      setErrors(prev => ({ ...prev, password: '' }));
                    }
                  }}
                  secureTextEntry
                  editable={!isLoading}
                />
                {errors.password ? (
                  <Text style={styles.errorText}>{errors.password}</Text>
                ) : null}
              </View>

              {/* Login Button */}
              <TouchableOpacity
                onPress={handleLogin}
                activeOpacity={0.85}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={GRADIENTS.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                >
                  {isLoading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color={COLORS.white} />
                      <Text style={styles.loadingText}>Memproses...</Text>
                    </View>
                  ) : (
                    <Text style={styles.loginButtonText}>Masuk</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Divider */}
              <Text style={styles.divider}>atau</Text>

              {/* Face Capture Button */}
              <TouchableOpacity
                onPress={handleTraining}
                style={[
                  styles.faceButton,
                  isLoading && styles.faceButtonDisabled
                ]}
                activeOpacity={0.85}
                disabled={isLoading}
              >
                <Ionicons name="camera" size={20} color={COLORS.purple600} />
                <Text style={styles.faceButtonText}>Face Capture Training</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 36,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.gray500,
    textAlign: 'center',
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 28,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  inputContainer: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray700,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: COLORS.gray800,
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 1.5,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  loginButton: {
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  divider: {
    textAlign: 'center',
    color: COLORS.gray400,
    fontSize: 14,
    marginVertical: 18,
    alignSelf: 'center',
  },
  faceButton: {
    borderWidth: 2,
    borderColor: COLORS.purple500,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  faceButtonDisabled: {
    opacity: 0.5,
  },
  faceButtonText: {
    color: COLORS.purple600,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

//export { LoginScreen };
export default LoginScreen;