import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Dimensions,
  Image,
  Alert,
} from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { API_URL } from '../config/api';

const { width, height } = Dimensions.get('window');

export default function CameraScreen({ route, navigation }) {
  const device = useCameraDevice('front');
  const { hasPermission, requestPermission } = useCameraPermission();
  const cameraRef = useRef(null);

  const routeParams = route?.params ?? {};
  const { id_presensi, mata_kuliah, pertemuan_ke, nim, id_mahasiswa } = routeParams;

  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedFace, setDetectedFace] = useState(null);
  const [capturedFaceImage, setCapturedFaceImage] = useState(null);
  const [recognizedUser, setRecognizedUser] = useState(null);
  const [autoCapture, setAutoCapture] = useState(false);
  const [lastCaptureTime, setLastCaptureTime] = useState(0);

  useEffect(() => {
    if (!hasPermission) requestPermission();

    console.log('📋 CameraScreen params:');
    console.log({ id_presensi, mata_kuliah, pertemuan_ke, nim, id_mahasiswa });
    console.log('Mode presensi:', id_presensi && nim && id_mahasiswa ? 'YA' : 'TIDAK');
  }, [hasPermission, requestPermission, id_presensi, mata_kuliah, pertemuan_ke, nim, id_mahasiswa]);

  const captureAndDetect = useCallback(
    async (isAuto = false) => {
      if (!cameraRef.current || isProcessing) return;

      const now = Date.now();
      if (now - lastCaptureTime < 3000) {
        console.log('Capture terlalu sering, skip...');
        return;
      }

      try {
        setIsProcessing(true);
        setLastCaptureTime(now);

        console.log(isAuto ? 'Auto capture...' : 'Manual capture...');

        const photo = await cameraRef.current.takePhoto({
          qualityPrioritization: 'speed',
          skipMetadata: true,
        });

        const photoUri = photo?.path ? `file://${photo.path}` : (photo?.uri ?? '');
        setCapturedFaceImage(photoUri || null);

        if (!photoUri) {
          throw new Error('Tidak ada gambar yang dihasilkan oleh kamera');
        }

        const formData = new FormData();
        formData.append('file', {
          uri: photoUri,
          type: 'image/jpeg',
          name: 'face.jpg',
        });

        console.log('Mengirim gambar ke server...');

        const response = await axios.post(`${API_URL}/face/recognize`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 15000,
        });

        console.log('Response dari server:', response.data);

        if (response.data?.status === 'success') {
          const recognized = response.data.recognized ?? [];
          if (recognized.length > 0) {
            const bestMatch = recognized[0];
            const confidence = ((1 - (bestMatch.distance ?? 0)) * 100).toFixed(1);
            const recognizedNim = bestMatch.username ?? '';

            setDetectedFace(`Halo ${recognizedNim}!`);
            setRecognizedUser({ username: recognizedNim, confidence });

            // Mode presensi: auto update ke Hadir bila wajah cocok dengan user login
            if (id_presensi && nim && id_mahasiswa) {
              try {
                if (recognizedNim !== nim) {
                  Alert.alert(
                    'Validasi Gagal',
                    `Wajah yang ter-scan (${recognizedNim}) tidak sesuai dengan akun Anda (${nim})`,
                    [{ text: 'OK' }],
                  );
                  setDetectedFace(null);
                  setRecognizedUser(null);
                  setIsProcessing(false);
                  return;
                }

                const token = await AsyncStorage.getItem('access_token');

                console.log('🚀 Mengirim request update presensi...');
                console.log('URL:', `${API_URL}/presensi/update-status-face-recognition`);
                console.log('Body:', { id_presensi, nim: recognizedNim });

                const updateResponse = await axios.post(
                  `${API_URL}/presensi/update-status-face-recognition`,
                  {
                    id_presensi: id_presensi,
                    nim: recognizedNim
                  },
                  {
                    headers: token ? { 
                      Authorization: `Bearer ${token}`,
                      'Content-Type': 'application/json'
                    } : {
                      'Content-Type': 'application/json'
                    },
                  },
                );

                console.log('✅ Update presensi BERHASIL!', updateResponse.data);

                setIsProcessing(false);

                Alert.alert(
                  'Presensi Berhasil!',
                  `${updateResponse.data?.message ?? 'Sukses'}\n\nMata Kuliah: ${mata_kuliah}\nPertemuan: ${pertemuan_ke}\nWaktu: ${new Date().toLocaleTimeString('id-ID')}`,
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        setTimeout(() => navigation?.goBack(), 1000);
                      },
                    },
                  ],
                );
                return;
              } catch (updateError) {
                console.error('❌ ERROR updating presensi:', updateError?.response?.data || updateError?.message || updateError);
                const msg =
                  updateError?.response?.data?.detail ||
                  updateError?.response?.data?.message ||
                  updateError?.message ||
                  'Gagal update presensi';
                Alert.alert('Error Update Presensi', msg, [{ text: 'OK' }]);
                setIsProcessing(false);
                return;
              }
            }

            // Non-presensi flow
            if (isAuto) {
              setTimeout(() => {
                setDetectedFace(null);
                setRecognizedUser(null);
              }, 5000);
            }
            Alert.alert('Berhasil!', `Halo ${recognizedNim}! (${confidence}% match)`, [{ text: 'OK' }]);
          } else {
            setDetectedFace('Wajah tidak dikenali');
            setRecognizedUser(null);
            if (isAuto) setTimeout(() => setDetectedFace(null), 3000);
            else Alert.alert('Tidak Dikenali', 'Wajah tidak terdaftar dalam sistem', [{ text: 'OK' }]);
          }
        } else {
          setDetectedFace('Tidak ada wajah terdeteksi');
          setRecognizedUser(null);
          if (isAuto) setTimeout(() => setDetectedFace(null), 3000);
          else Alert.alert('Tidak Ada Wajah', 'Pastikan wajah berada dalam frame', [{ text: 'OK' }]);
        }
      } catch (error) {
        console.log('Error detail:', error);
        let errorMessage = 'Gagal terhubung ke server';

        if (error?.code === 'ECONNABORTED') {
          errorMessage = 'Timeout: Server tidak merespon';
        } else if (error?.response?.data?.detail) {
          errorMessage = error.response.data.detail;
        } else if (error?.message) {
          errorMessage = error.message;
        }

        setDetectedFace('Error: ' + errorMessage);
        setRecognizedUser(null);

        if (!isAuto) {
          Alert.alert('Error', errorMessage, [{ text: 'OK' }]);
        }
        if (isAuto) setTimeout(() => setDetectedFace(null), 3000);
      } finally {
        setIsProcessing(false);
      }
    },
    [isProcessing, lastCaptureTime, id_presensi, nim, id_mahasiswa, mata_kuliah, pertemuan_ke, navigation],
  );

  // Auto capture interval
  useEffect(() => {
    let interval;
    if (autoCapture && !isProcessing) {
      console.log('Auto capture aktif - scan tiap 5 detik');
      interval = setInterval(() => {
        captureAndDetect(true);
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoCapture, isProcessing, captureAndDetect]);

  const manualCaptureAndDetect = () => captureAndDetect(false);

  const resetDetection = () => {
    setDetectedFace(null);
    setRecognizedUser(null);
    setCapturedFaceImage(null);
  };

  const toggleAutoCapture = () => {
    setAutoCapture(prev => !prev);
    if (!autoCapture) {
      Alert.alert('Auto Capture Diaktifkan', 'Sistem akan otomatis scan wajah setiap 5 detik', [{ text: 'OK' }]);
    }
  };

  if (!device) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Kamera tidak ditemukan</Text>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Memerlukan izin kamera</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.permissionBtn}>
          <Text style={styles.buttonText}>Berikan Izin Kamera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        photo={true}
      />

      {/* Face guide overlay */}
      <View style={styles.faceGuide}>
        <View style={[styles.corner, styles.topLeft]} />
        <View style={[styles.corner, styles.topRight]} />
        <View style={[styles.corner, styles.bottomLeft]} />
        <View style={[styles.corner, styles.bottomRight]} />
        {autoCapture && (
          <View style={styles.autoIndicator}>
            <ActivityIndicator size="small" />
            <Text style={styles.autoIndicatorText}>AUTO</Text>
          </View>
        )}
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Face Recognition</Text>
        <Text style={styles.subtitle}>
          {autoCapture ? 'Auto scan aktif - sistem otomatis deteksi wajah' : 'Arahkan wajah ke dalam frame dan tekan scan'}
        </Text>
      </View>

      {/* Auto capture toggle */}
      <View style={styles.autoToggleContainer}>
        <Text style={styles.autoToggleLabel}>Auto Capture:</Text>
        <TouchableOpacity
          style={[styles.autoToggle, { backgroundColor: autoCapture ? '#4CAF50' : '#666' }]}
          onPress={toggleAutoCapture}
        >
          <Icon name={autoCapture ? 'toggle-on' : 'toggle-off'} size={32} color="white" />
          <Text style={styles.autoToggleText}>{autoCapture ? 'ON' : 'OFF'}</Text>
        </TouchableOpacity>

        {autoCapture && (
          <Text style={styles.autoInfoText}>
            •Scan otomatis setiap 5 detik{'\n'}•Hanya kirim jika ada wajah{'\n'}•Hasil auto reset setelah 5 detik
          </Text>
        )}
      </View>

      {/* Results */}
      <View style={styles.resultsContainer}>
        {isProcessing && (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" />
            <Text style={styles.processingText}>{autoCapture ? 'Auto scanning...' : 'Memproses wajah...'}</Text>
          </View>
        )}

        {detectedFace && !isProcessing && (
          <View style={styles.resultCard}>
            {capturedFaceImage ? <Image source={{ uri: capturedFaceImage }} style={styles.faceImage} /> : null}
            <View style={styles.resultTextContainer}>
              <Text
                style={[
                  styles.resultText,
                  { color: detectedFace.includes('Halo') ? '#4CAF50' : '#FF9800' },
                ]}
              >
                {detectedFace}
              </Text>

              {recognizedUser && (
                <Text style={styles.confidenceText}>Confidence: {recognizedUser.confidence} %</Text>
              )}

              <Text style={styles.modeText}>{autoCapture ? '(Auto Detection)' : '(Manual Detection)'}</Text>
            </View>

            <TouchableOpacity onPress={resetDetection} style={styles.closeButton}>
              <Icon name="close" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Bottom */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          onPress={manualCaptureAndDetect}
          disabled={isProcessing}
          style={[styles.captureButton, isProcessing && styles.captureButtonDisabled]}
        >
          {isProcessing ? <ActivityIndicator size="small" color="white" /> : <Icon name="camera-alt" size={32} color="white" />}
        </TouchableOpacity>

        <Text style={styles.captureText}>{isProcessing ? 'Memproses...' : 'Scan Manual'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111' },
  errorText: { color: 'white', fontSize: 16, marginBottom: 20 },
  permissionBtn: { backgroundColor: '#007AFF', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  faceGuide: {
    position: 'absolute',
    top: '25%',
    left: '15%',
    width: '70%',
    height: '45%',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.7)',
    borderRadius: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: { position: 'absolute', width: 25, height: 25, borderColor: 'white' },
  topLeft: { top: 10, left: 10, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 10 },
  topRight: { top: 10, right: 10, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 10 },
  bottomLeft: { bottom: 10, left: 10, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 10 },
  bottomRight: { bottom: 10, right: 10, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 10 },
  autoIndicator: {
    position: 'absolute',
    top: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  autoIndicatorText: { color: '#4CAF50', fontSize: 12, fontWeight: 'bold', marginLeft: 5 },
  header: { position: 'absolute', top: 50, width: '100%', alignItems: 'center', paddingHorizontal: 20 },
  title: { color: 'white', fontSize: 24, fontWeight: 'bold', marginBottom: 5 },
  subtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14, textAlign: 'center' },
  autoToggleContainer: { position: 'absolute', top: 120, width: '100%', alignItems: 'center', paddingHorizontal: 20 },
  autoToggleLabel: { color: 'white', fontSize: 16, fontWeight: '600', marginBottom: 10 },
  autoToggle: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 25, marginBottom: 10 },
  autoToggleText: { color: 'white', marginLeft: 10, fontSize: 16, fontWeight: '600' },
  autoInfoText: { color: '#4CAF50', fontSize: 12, textAlign: 'center', lineHeight: 16 },
  resultsContainer: { position: 'absolute', top: 200, width: '100%', alignItems: 'center', paddingHorizontal: 20 },
  processingContainer: { alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)', padding: 20, borderRadius: 15 },
  processingText: { color: 'white', marginTop: 10, fontSize: 16 },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 15,
    borderRadius: 15,
    marginTop: 10,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  faceImage: { width: 60, height: 60, borderRadius: 30, marginRight: 15 },
  resultTextContainer: { flex: 1 },
  resultText: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  confidenceText: { fontSize: 14, color: '#666', marginBottom: 2 },
  modeText: { fontSize: 12, color: '#999', fontStyle: 'italic' },
  closeButton: { padding: 5 },
  bottomContainer: { position: 'absolute', bottom: 50, width: '100%', alignItems: 'center' },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  captureButtonDisabled: { backgroundColor: '#666' },
  captureText: { color: 'white', fontSize: 16, fontWeight: '600' },
});