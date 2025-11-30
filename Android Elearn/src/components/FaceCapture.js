import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import axios from 'axios';
import ProfilePhotoManager from '../utils/ProfilePhotoManager';
import { API_URL } from '../config/api';

const { width, height } = Dimensions.get('window');

const FaceCapture = ({ route, navigation }) => {
  const { userId, userName, nim, isUpdate } = route.params || {};
  
  const [cameraPermission, setCameraPermission] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedCount, setCapturedCount] = useState(0);
  const [currentInstruction, setCurrentInstruction] = useState(0);
  const [countdown, setCountdown] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const device = useCameraDevice('front');
  const cameraRef = useRef(null);

  const TOTAL_CAPTURES = 1;
  const INSTRUCTIONS = [
    '👤 Hadapkan wajah ke depan',
  ];

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    try {
      const status = await Camera.getCameraPermissionStatus();
      
      if (status === 'granted' || status === 'authorized') {
        setCameraPermission(true);
      } else if (status === 'not-determined') {
        const newStatus = await Camera.requestCameraPermission();
        setCameraPermission(newStatus === 'granted' || newStatus === 'authorized');
      } else {
        setCameraPermission(false);
      }
    } catch (error) {
      console.error('Error checking permission:', error);
      setCameraPermission(false);
    }
  };

  const startCountdown = () => {
    return new Promise((resolve) => {
      let count = 3;
      setCountdown(count);
      
      const interval = setInterval(() => {
        count--;
        if (count > 0) {
          setCountdown(count);
        } else {
          setCountdown(null);
          clearInterval(interval);
          resolve();
        }
      }, 1000);
    });
  };

  const handleCapture = async () => {
    if (!cameraRef.current) {
      Alert.alert('Error', 'Kamera belum siap');
      return;
    }

    // Validasi userId dan nim
    if (!userId || !nim) {
      Alert.alert('Error', 'Data user tidak valid');
      return;
    }

    try {
      setIsCapturing(true);
      
      // Countdown
      await startCountdown();

      // Ambil foto
      const photo = await cameraRef.current.takePhoto({
        flash: 'off',
        qualityPrioritization: 'quality',
      });

      console.log('📸 Photo captured:', photo.path);

      // PENTING: Simpan foto ke folder permanent SEBELUM upload
      // Agar foto tidak hilang saat rebuild aplikasi
      const savedPhotoPath = await ProfilePhotoManager.saveProfilePhoto(photo.path, nim);
      
      if (!savedPhotoPath) {
        throw new Error('Gagal menyimpan foto ke storage');
      }
      
      console.log('💾 Photo saved to permanent storage:', savedPhotoPath);

      // Upload foto dari folder permanent ke server FaceNet untuk training
      await uploadToFaceNetServer(savedPhotoPath);

      const newCount = capturedCount + 1;
      setCapturedCount(newCount);

      if (newCount < TOTAL_CAPTURES) {
        setCurrentInstruction(newCount);
      } else {
        // Semua foto sudah diambil
        await processTraining();
      }

    } catch (error) {
      console.error('❌ Error capturing photo:', error);
      Alert.alert('Error', 'Gagal mengambil foto: ' + error.message);
    } finally {
      setIsCapturing(false);
    }
  };

  const uploadToFaceNetServer = async (photoPath) => {
    try {
      console.log('📤 Uploading photo to FaceNet server...');
      console.log('Photo path:', photoPath);
      console.log('NIM:', nim);

      // Buat FormData untuk upload
      const formData = new FormData();
      
      // Tambahkan file foto dari permanent storage
      formData.append('file', {
        uri: photoPath.startsWith('file://') ? photoPath : `file://${photoPath}`,
        type: 'image/jpeg',
        name: `${nim}.jpg`,
      });
      
      // Tambahkan username (NIM) - ini akan jadi nama embedding .pkl
      formData.append('username', nim);

      // Upload ke API /face/register
      const response = await axios.post(
        `${API_URL}/face/register`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000, // 30 detik
        }
      );

      console.log('✅ Upload response:', response.data);

      if (response.data.status === 'success') {
        // Foto sudah tersimpan di permanent storage sebelumnya
        // Sekarang register ke database
        await registerToDatabase(nim);
        
        console.log('✅ Face registration complete!');
      } else {
        throw new Error(response.data.message || 'Upload gagal');
      }

    } catch (error) {
      console.error('❌ Error uploading to server:', error);
      throw new Error('Gagal upload foto ke server: ' + (error.response?.data?.message || error.message));
    }
  };

  const registerToDatabase = async (nim) => {
    try {
      console.log('💾 Registering to database...');
      console.log('📤 Sending data:', { nim, embedding_filename: `${nim}.pkl` });
      console.log('🔗 URL:', `${API_URL}/face-registration/register`);
      
      const response = await axios.post(
        `${API_URL}/face-registration/register`,
        {
          nim: nim,
          embedding_filename: `${nim}.pkl`,
        },
        { timeout: 10000 }
      );

      console.log('✅ Database registration response:', response.data);
      Alert.alert('Sukses', 'Data berhasil disimpan ke database');
    } catch (error) {
      console.error('⚠️ Error registering to database:', error);
      console.error('📊 Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      
      // Tampilkan error detail ke user
      Alert.alert(
        'Peringatan Database',
        `Database registration gagal: ${error.response?.data?.detail || error.message}\n\nEmbedding sudah tersimpan, tapi belum terdaftar di database.`
      );
      
      // Tidak throw error karena embedding sudah tersimpan di file
    }
  };

  const processTraining = async () => {
    setIsProcessing(true);

    try {
      // Training sudah selesai (foto sudah diupload)
      console.log('✅ Training process complete!');

      Alert.alert(
        isUpdate ? 'Update Berhasil! ✅' : 'Training Berhasil! ✅',
        isUpdate 
          ? `Foto wajah Anda telah berhasil diperbarui.\n\nData face recognition Anda sudah ter-update.`
          : `Foto wajah Anda telah berhasil diproses.\n\nAnda sekarang dapat menggunakan face recognition untuk presensi.`,
        [
          {
            text: 'OK',
            onPress: () => {
              if (isUpdate) {
                // Jika update, kembali ke Profile
                navigation.navigate('Profile');
              } else {
                // Jika first time, redirect ke Home
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Home' }],
                });
              }
            },
          },
        ],
      );

    } catch (error) {
      console.error('Error processing training:', error);
      Alert.alert('Error', 'Gagal memproses training: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Lewati Training?',
      'Anda dapat melakukan training nanti.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Lewati',
          style: 'destructive',
          onPress: () => navigation.navigate('Login'),
        },
      ],
    );
  };

  const handleRetake = () => {
    Alert.alert(
      'Ulangi Training?',
      'Semua foto akan dihapus dan dimulai dari awal.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ulangi',
          onPress: () => {
            setCapturedCount(0);
            setCurrentInstruction(0);
          },
        },
      ],
    );
  };

  if (cameraPermission === null) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#9B59B6" />
        <Text style={styles.loadingText}>Memeriksa izin kamera...</Text>
      </SafeAreaView>
    );
  }

  if (cameraPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionIcon}>📷</Text>
          <Text style={styles.permissionTitle}>Izin Kamera Diperlukan</Text>
          <Text style={styles.permissionText}>
            Aplikasi memerlukan akses kamera untuk face training.
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={checkPermission}
          >
            <Text style={styles.permissionButtonText}>Berikan Izin</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.skipTextButton} onPress={handleSkip}>
            <Text style={styles.skipTextButtonText}>Lewati</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!device) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#9B59B6" />
        <Text style={styles.loadingText}>Memuat kamera...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {isUpdate ? 'Update Face Recognition' : 'Face Recognition'}
        </Text>
        <Text style={styles.headerSubtitle}>
          {isUpdate 
            ? 'Update foto wajah Anda untuk memperbarui data face recognition.'
            : 'Ambil foto wajah Anda untuk sistem presensi menggunakan face recognition.'
          }
        </Text>
      </View>

      {/* Camera View */}
      <View style={styles.cardContainer}>
      <View style={styles.cameraContainer}>
        <Camera
          ref={cameraRef}
          style={styles.camera}
          device={device}
          isActive={true}
          photo={true}
        />

        {/* Face Oval Overlay */}
        <View style={styles.overlay}>
          <View style={styles.faceOval}>
            <View style={styles.ovalBorder} />
          </View>
        </View>

        {/* Countdown Overlay */}
        {countdown && (
          <View style={styles.countdownOverlay}>
            <Text style={styles.countdownText}>{countdown}</Text>
          </View>
        )}

        {/* Processing Overlay */}
        {isProcessing && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.processingText}>Memproses training...</Text>
          </View>
        )}
      </View>

        {/* Instruction */}
        <View style={styles.instructionContainer}>
          <Text style={styles.instructionText}>
            {INSTRUCTIONS[currentInstruction]}
          </Text>
          <Text style={styles.instructionSubtext}>
            Pastikan wajah berada di dalam lingkaran oval
          </Text>
        </View>

        {/* Controls */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity
            style={[
              styles.captureButton,
              (isCapturing || isProcessing) && styles.captureButtonDisabled,
            ]}
            onPress={handleCapture}
            disabled={isCapturing || isProcessing}
          >
            {isCapturing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.captureButtonText}>📸 Ambil Foto</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#2C3E50',
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cameraContainer: {
    width: '100%',
    height: width * 1.1,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 20,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceOval: {
    width: width * 0.65,
    height: width * 0.85,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ovalBorder: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    borderWidth: 3,
    borderColor: '#3498DB',
    borderStyle: 'dashed',
  },
  countdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownText: {
    fontSize: 80,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FFFFFF',
  },
  instructionContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  instructionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 6,
    textAlign: 'center',
  },
  instructionSubtext: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
  },
  controlsContainer: {
    gap: 12,
  },
  captureButton: {
    backgroundColor: '#3498DB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 15,
    color: '#7F8C8D',
    fontWeight: '600',
  },
  footer: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: '#7F8C8D',
    textAlign: 'center',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  permissionIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    marginBottom: 30,
  },
  permissionButton: {
    backgroundColor: '#3498DB',
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  skipTextButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  skipTextButtonText: {
    color: '#7F8C8D',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FaceCapture;
