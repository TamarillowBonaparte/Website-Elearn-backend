// MateriEyeTracking.js - Complete PDF Version
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Alert,
  BackHandler,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import Pdf from 'react-native-pdf';
import { API_URL } from '../config/api';

const { width, height } = Dimensions.get('window');

export default function MateriEyeTracking({ route, navigation }) {
  const { materi } = route.params;
  // Menggunakan API_URL dari config/api.js
  const PYTHON_SERVER_URL = route.params?.serverUrl || API_URL;
  const useRemoteServer = route.params?.useRemoteServer ?? true; // jika true, selalu polling server untuk gaze

  const [isTracking, setIsTracking] = useState(false);
  const [cameraPermission, setCameraPermission] = useState(null);
  const [isLoadingPermission, setIsLoadingPermission] = useState(true);
  const [isLoadingPDF, setIsLoadingPDF] = useState(true);
  const [pdfError, setPdfError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [canFinish, setCanFinish] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  
  const [trackingData, setTrackingData] = useState({
    totalTime: 0,
    focusTime: 0,
    distractionCount: 0,
    attentionScore: 100,
    eyeMovements: [],
    pagesRead: [],
    timePerPage: {},
  });
  
  const [currentFocus, setCurrentFocus] = useState(true);
  const [isSimulatingEyeTracking, setIsSimulatingEyeTracking] = useState(false);
  const [serverConnected, setServerConnected] = useState(null); // null = unknown, true = connected, false = disconnected

  const MINIMUM_READING_TIME = 60; // 1 menit untuk testing

  const device = useCameraDevice('front');
  const cameraRef = useRef(null);
  const trackingInterval = useRef(null);
  const remoteInterval = useRef(null);
  const timerInterval = useRef(null);
  const lastFocusTime = useRef(Date.now());
  const startTime = useRef(Date.now());
  const pageStartTime = useRef(Date.now());
  const pdfRef = useRef(null);
  const initialized = useRef(false);

  
  
  const getPdfSource = () => {
    console.log('[PDF] Getting PDF source...');
    console.log('[PDF] Materi data:', JSON.stringify(materi, null, 2));
    
    // Prioritas 1: Gunakan endpoint backend API untuk mengambil file dari uploads/materi
    if (materi.id_materi || materi.id) {
      const id = materi.id_materi || materi.id;
      const pdfUrl = `${API_URL}/materi/file/${id}`;
      console.log('[PDF] ✅ Using Backend API endpoint:', pdfUrl);
      return {
        uri: pdfUrl,
        cache: true,
      };
    }
    
    // Prioritas 2: URL langsung
    if (materi.pdfUrl) {
      console.log('[PDF] ✅ Using direct URL:', materi.pdfUrl);
      return {
        uri: materi.pdfUrl,
        cache: true,
      };
    }
    
    // Prioritas 3: Local path
    if (materi.localPdfPath) {
      console.log('[PDF] ✅ Using local path:', materi.localPdfPath);
      return {
        uri: materi.localPdfPath,
        cache: true,
      };
    }

    // Prioritas 4: Base64
    if (materi.pdfBase64) {
      console.log('[PDF] ✅ Using base64 data');
      return {
        uri: `data:application/pdf;base64,${materi.pdfBase64}`,
        cache: false,
      };
    }

    // Fallback: Sample PDF for testing
    console.log('[PDF] ⚠️ No PDF source found, using fallback dummy PDF');
    return {
      uri: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      cache: true,
    };
  };

  const handlePdfLoadComplete = (numberOfPages, filePath) => {
    console.log(`PDF loaded: ${numberOfPages} pages from ${filePath}`);
    setTotalPages(numberOfPages);
    setIsLoadingPDF(false);
    setPdfError(null);
    
    // Set halaman awal ke 1
    setCurrentPage(1);
    pageStartTime.current = Date.now();
    
    const initialTimePerPage = {};
    for (let i = 1; i <= numberOfPages; i++) {
      initialTimePerPage[i] = 0;
    }
    
    setTrackingData(prev => ({
      ...prev,
      timePerPage: initialTimePerPage,
      pagesRead: [1], // Halaman 1 sudah dibaca saat PDF dibuka
    }));
  };

  const handlePageChanged = (page, numberOfPages) => {
    console.log(`Page changed to: ${page} of ${numberOfPages}`);
    
    const timeSpent = Math.floor((Date.now() - pageStartTime.current) / 1000);
    
    setIsLoadingPDF(false);
    
    // Update total pages jika belum di-set
    if (totalPages === 0 && numberOfPages > 0) {
      setTotalPages(numberOfPages);
    }
    
    setTrackingData(prev => {
      const newData = { ...prev };
      
      if (currentPage > 0) {
        newData.timePerPage[currentPage] = 
          (newData.timePerPage[currentPage] || 0) + timeSpent;
      }
      
      if (!newData.pagesRead.includes(page)) {
        newData.pagesRead.push(page);
      }
      
      return newData;
    });
    
    setCurrentPage(page);
    pageStartTime.current = Date.now();
  };

  const handlePdfError = (error) => {
    console.error('PDF Error:', error);
    setIsLoadingPDF(false);
    setPdfError(error.message || 'Gagal memuat PDF. Periksa koneksi internet atau file PDF.');
  };

  const handlePdfLinkPress = (uri) => {
    console.log(`PDF Link pressed: ${uri}`);
    Alert.alert(
      'Buka Link',
      `Apakah Anda ingin membuka link ini?\n${uri}`,
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Buka', 
          onPress: () => Linking.openURL(uri)
        }
      ]
    );
  };

  // ========== CAMERA & TRACKING FUNCTIONS ==========

  const handleBackPress = useCallback(() => {
    if (!canFinish) {
      const remainingTime = MINIMUM_READING_TIME - timeElapsed;
      Alert.alert(
        'Belum Selesai',
        `Anda perlu membaca minimal ${MINIMUM_READING_TIME / 60} menit.\n\nWaktu tersisa: ${formatTime(remainingTime)}`,
        [{ text: 'OK' }]
      );
      return;
    }

    setIsTracking(false);

    if (trackingInterval.current) {
      clearInterval(trackingInterval.current);
    }
    if (remoteInterval.current) {
      clearInterval(remoteInterval.current);
    }
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
    }

    const finalTimeOnPage = Math.floor((Date.now() - pageStartTime.current) / 1000);
    
    const sessionDuration = Math.floor((Date.now() - startTime.current) / 1000);
    const pagesReadCount = trackingData.pagesRead.length;
    const readingProgress = totalPages > 0 
      ? Math.round((pagesReadCount / totalPages) * 100) 
      : 0;

    const updatedTimePerPage = { ...trackingData.timePerPage };
    if (currentPage > 0) {
      updatedTimePerPage[currentPage] = 
        (updatedTimePerPage[currentPage] || 0) + finalTimeOnPage;
    }

    const finalData = {
      materiId: materi.id,
      materiTitle: materi.title,
      studentId: 'student_123',
      sessionStart: new Date(startTime.current).toISOString(),
      sessionEnd: new Date().toISOString(),
      sessionDuration,
      trackingMode: cameraPermission ? 'camera' : 'simulated',
      totalPages,
      pagesRead: pagesReadCount,
      pagesReadList: trackingData.pagesRead,
      readingProgress,
      lastPage: currentPage,
      timePerPage: updatedTimePerPage,
      totalTime: trackingData.totalTime,
      focusTime: trackingData.focusTime,
      distractionCount: trackingData.distractionCount,
      attentionScore: trackingData.attentionScore,
      eyeMovements: trackingData.eyeMovements,
    };

    console.log('Saving tracking data:', finalData);

    // Simpan ke database (hanya field yang ada di database)
    const dbPayload = {
      id_mahasiswa: route.params?.id_mahasiswa ?? 1,
      id_materi: materi?.id_materi ?? materi?.id ?? 1,
      waktu_belajar: trackingData.totalTime,
      waktu_fokus: trackingData.focusTime,
      jumlah_gangguan: trackingData.distractionCount,
      skor_perhatian: trackingData.attentionScore,
      tracking_mode: cameraPermission ? 'camera' : 'simulated',
      session_start: new Date(startTime.current).toISOString(),
      session_end: new Date().toISOString(),
    };

    saveSkorMateri(dbPayload).then(result => {
      if (result.success) {
        console.log('[SaveDB] ✅ Data berhasil disimpan ke database');
      } else {
        console.error('[SaveDB] ⚠️ Gagal menyimpan ke database:', result.error);
      }
    });

    Alert.alert(
      'Sesi Pembelajaran Selesai',
      `${materi.title}\n\n` +
      `Waktu belajar: ${formatTime(trackingData.totalTime)}\n` +
      `Waktu fokus: ${formatTime(trackingData.focusTime)}\n` +
      `Skor perhatian: ${trackingData.attentionScore}%\n` +
      `Gangguan: ${trackingData.distractionCount}x\n` +
      `Halaman dibaca: ${pagesReadCount}/${totalPages} (${readingProgress}%)` +
      `${!cameraPermission ? '\n\n*Mode simulasi aktif' : ''}`,
      [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ],
    );
  }, [canFinish, timeElapsed, trackingData, currentPage, totalPages, cameraPermission, materi, route.params, navigation]);

  useEffect(() => {
    // Prevent multiple initialization
    if (initialized.current) {
      console.log('[EyeTracking] ⚠️ Already initialized, skipping...');
      return;
    }
    
    initialized.current = true;
    console.log('[EyeTracking] 🎯 Initializing component (first time only)');
    
    const timer = setTimeout(() => {
      initializePermissions();
    }, 100);

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBackPress();
      return true;
    });

    return () => {
      console.log('[EyeTracking] 🧹 Cleanup on unmount');
      clearTimeout(timer);
      backHandler.remove();
      if (trackingInterval.current) {
        clearInterval(trackingInterval.current);
      }
      if (remoteInterval.current) {
        clearInterval(remoteInterval.current);
      }
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
      initialized.current = false;
    };
  }, []);

  // useEffect untuk start tracking setelah permission ready
  useEffect(() => {
    // Jangan start jika masih loading atau belum initialized
    if (isLoadingPermission || !initialized.current) {
      return;
    }

    // Jangan start jika sudah tracking
    if (isTracking) {
      return;
    }

    // Start tracking jika camera ready ATAU simulation mode
    if (cameraReady || isSimulatingEyeTracking) {
      console.log('[EyeTracking] 🎬 Permission/simulation ready, starting tracking...');
      console.log('[EyeTracking] cameraPermission:', cameraPermission, '| cameraReady:', cameraReady, '| isSimulating:', isSimulatingEyeTracking);
      startTracking();
    }
  }, [cameraReady, isSimulatingEyeTracking, isLoadingPermission, isTracking, cameraPermission]);

  const initializePermissions = async () => {
    setIsLoadingPermission(true);

    try {
      if (!Camera || typeof Camera.getCameraPermissionStatus !== 'function') {
        console.log('Camera module not ready, using simulation mode');
        setCameraPermission(false);
        setIsSimulatingEyeTracking(true);
        // startTracking akan dipanggil dari useEffect yang watch isSimulatingEyeTracking
        setIsLoadingPermission(false);
        return;
      }

      const cameraPermissionStatus = await Camera.getCameraPermissionStatus();
      console.log('Camera permission status:', cameraPermissionStatus);

      if (cameraPermissionStatus === 'granted' || cameraPermissionStatus === 'authorized') {
        setCameraPermission(true);
        setCameraReady(true);
        // startTracking akan dipanggil dari useEffect yang watch cameraReady
      } else if (cameraPermissionStatus === 'not-determined') {
        const newPermissionStatus = await Camera.requestCameraPermission();
        console.log('New permission status:', newPermissionStatus);

        if (newPermissionStatus === 'granted' || newPermissionStatus === 'authorized') {
          setCameraPermission(true);
          setCameraReady(true);
          // startTracking akan dipanggil dari useEffect yang watch cameraReady
        } else {
          setCameraPermission(false);
          setIsSimulatingEyeTracking(true);
          // startTracking akan dipanggil dari useEffect yang watch isSimulatingEyeTracking
        }
      } else {
        setCameraPermission(false);
        setIsSimulatingEyeTracking(true);
        // startTracking akan dipanggil dari useEffect yang watch isSimulatingEyeTracking
      }
    } catch (error) {
      console.error('Permission initialization error:', error);
      setCameraPermission(false);
      setIsSimulatingEyeTracking(true);
      // startTracking akan dipanggil dari useEffect yang watch isSimulatingEyeTracking
    } finally {
      setIsLoadingPermission(false);
    }
  };

  const handleRequestPermission = async () => {
    setIsLoadingPermission(true);

    try {
      if (!Camera || typeof Camera.requestCameraPermission !== 'function') {
        Alert.alert(
          'Camera Not Available',
          'Camera module is not available. Using simulation mode.',
        );
        setIsLoadingPermission(false);
        return;
      }

      const permissionStatus = await Camera.requestCameraPermission();
      console.log('Permission request result:', permissionStatus);

      if (permissionStatus === 'granted' || permissionStatus === 'authorized') {
        setCameraPermission(true);
        setCameraReady(true);
        setIsSimulatingEyeTracking(false);
        // startTracking akan dipanggil dari useEffect yang watch cameraReady
      } else {
        Alert.alert(
          'Izin Kamera Diperlukan',
          'Untuk menggunakan eye tracking yang akurat, mohon aktifkan izin kamera di pengaturan aplikasi.',
          [
            { text: 'Nanti Saja', style: 'cancel' },
            {
              text: 'Buka Pengaturan',
              onPress: () => Linking.openSettings(),
            },
          ],
        );
      }
    } catch (error) {
      console.error('Permission request error:', error);
    } finally {
      setIsLoadingPermission(false);
    }
  };

  const startTracking = () => {
    console.log('[EyeTracking] 🎬 Starting tracking...');
    console.log('[EyeTracking] useRemoteServer:', useRemoteServer);
    console.log('[EyeTracking] cameraPermission:', cameraPermission);
    console.log('[EyeTracking] isSimulatingEyeTracking:', isSimulatingEyeTracking);
    
    setIsTracking(true);
    startTime.current = Date.now();
    lastFocusTime.current = Date.now();
    pageStartTime.current = Date.now();
    setTimeElapsed(0);
    setCanFinish(false);
    
    // Clear existing intervals first
    if (remoteInterval.current) {
      console.log('[EyeTracking] Clearing existing remote interval');
      clearInterval(remoteInterval.current);
      remoteInterval.current = null;
    }
    if (trackingInterval.current) {
      console.log('[EyeTracking] Clearing existing tracking interval');
      clearInterval(trackingInterval.current);
      trackingInterval.current = null;
    }
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }
    
    // Start timer untuk menghitung waktu dan enable tombol selesai
    timerInterval.current = setInterval(() => {
      setTimeElapsed(prev => {
        const newTime = prev + 1;
        if (newTime >= MINIMUM_READING_TIME && !canFinish) {
          setCanFinish(true);
        }
        return newTime;
      });
    }, 1000);
    
    // Mulai polling remote server bila diizinkan (terlepas dari status kamera)
    if (useRemoteServer) {
      console.log('[EyeTracking] Will start remote polling...');
      startRemotePolling();
    }

    if (isSimulatingEyeTracking || !cameraPermission) {
      console.log('[EyeTracking] Will start simulated tracking...');
      startSimulatedTracking();
    }
  };

  const captureAndSendFrame = async () => {
    // Fungsi untuk menangkap frame dari kamera dan mengirim ke endpoint /predict
    try {
      console.log('[EyeTracking] Starting frame capture...');
      console.log('[EyeTracking] cameraRef.current:', cameraRef.current ? 'Available' : 'NULL');
      console.log('[EyeTracking] cameraPermission:', cameraPermission);
      console.log('[EyeTracking] cameraReady:', cameraReady);
      
      if (!cameraRef.current) {
        console.log('[EyeTracking] ❌ Camera ref not available');
        return null;
      }

      // Capture photo dari camera
      console.log('[EyeTracking] 📸 Taking photo...');
      const photo = await cameraRef.current.takePhoto({
        qualityPrioritization: 'balanced', // Change to balanced for better quality
        flash: 'off',
        enableAutoStabilization: true,
      });
      console.log('[EyeTracking] ✅ Photo captured:', photo.path);

      // Buat form data untuk dikirim ke server
      const formData = new FormData();
      formData.append('file', {
        uri: `file://${photo.path}`,
        type: 'image/jpeg',
        name: 'camera_frame.jpg',
      });

      // Kirim ke endpoint /gaze/predict
      console.log('[EyeTracking] 🌐 Sending to server:', `${PYTHON_SERVER_URL}/gaze/predict`);
      const response = await fetch(`${PYTHON_SERVER_URL}/gaze/predict`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('[EyeTracking] Server response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        setServerConnected(true);
        console.log('[EyeTracking] ✅ Eye tracking data received:', JSON.stringify(data));
        return data;
      } else {
        setServerConnected(false);
        const errorText = await response.text();
        console.warn('[EyeTracking] ❌ Server response not ok:', response.status, errorText);
        return null;
      }
    } catch (error) {
      setServerConnected(false);
      console.error('[EyeTracking] ❌ Error:', error.message || error);
      console.error('[EyeTracking] Error stack:', error.stack);
      return null;
    }
  };

  const startSimulatedTracking = () => {
    // Try to poll a remote Python server first (if available). Fall back to random simulation.
    trackingInterval.current = setInterval(async () => {
      try {
        const res = await fetch(`${PYTHON_SERVER_URL}/gaze/health`, { method: 'GET' });
        // only treat as connected when server returns 200 (fresh data)
        if (res.status === 200) {
          setServerConnected(true);
          let data = null;
          try {
            data = await res.json();
          } catch (e) {
            data = null;
          }

          if (data && data.gaze_text) {
            const isFocused = data.gaze_text === 'CENTER';
            setCurrentFocus(isFocused);
            updateTrackingData(isFocused);
            return;
          }
        } else {
          // 204 No Content or other statuses -> server reachable but no fresh data
          setServerConnected(false);
        }
      } catch (err) {
        // network/server not available - fall back to local random simulation
        console.warn('Gagal terhubung ke Python server:', err.message || err);
        setServerConnected(false);
      }

      const randomFocus = Math.random() > 0.25;
      setCurrentFocus(randomFocus);
      updateTrackingData(randomFocus);
    }, 2000);
  };

  const startRemotePolling = () => {
    // jika sudah berjalan, jangan buat lagi
    if (remoteInterval.current) {
      console.log('[EyeTracking] ⚠️ Remote polling already running, skipping...');
      return;
    }

    console.log('[EyeTracking] 🚀 Starting remote polling...');
    console.log('[EyeTracking] Server URL:', PYTHON_SERVER_URL);
    console.log('[EyeTracking] Interval: 2000ms');

    remoteInterval.current = setInterval(async () => {
      console.log('[EyeTracking] ⏰ Polling tick - ' + new Date().toLocaleTimeString());
      console.log('[EyeTracking] Status - cameraPermission:', cameraPermission, '| cameraReady:', cameraReady, '| cameraRef:', cameraRef.current ? 'OK' : 'NULL');
      
      try {
        // Jika kamera aktif, capture frame dan kirim ke /gaze/predict endpoint
        if (cameraPermission && cameraReady && cameraRef.current) {
          console.log('[EyeTracking] 📹 Camera available, attempting to capture frame...');
          const gazeData = await captureAndSendFrame();
          
          if (gazeData && gazeData.gaze) {
            setServerConnected(true);
            const isFocused = gazeData.gaze === 'CENTER';
            console.log('[EyeTracking] 👁️ Gaze from /gaze/predict:', gazeData.gaze, '| Focused:', isFocused);
            setCurrentFocus(isFocused);
            updateTrackingData(isFocused);
            return;
          } else {
            console.log('[EyeTracking] ⚠️ No gaze data returned from camera capture (face not detected)');
            // Jika wajah tidak terdeteksi = tidak fokus (user tidak melihat layar)
            console.log('[EyeTracking] ❌ Face not detected = NOT FOCUSED');
            setCurrentFocus(false);
            updateTrackingData(false);
            setServerConnected(true); // Server tetap connected meskipun tidak detect wajah
            return;
          }
        } else {
          console.log('[EyeTracking] ⚠️ Camera not ready, trying fallback /gaze/health endpoint');
        }
        
        // Fallback: polling endpoint /gaze/health jika ada
        console.log('[EyeTracking] 🌐 Fetching', `${PYTHON_SERVER_URL}/gaze/health`);
        const res = await fetch(`${PYTHON_SERVER_URL}/gaze/health`, { method: 'GET' });
        console.log('[EyeTracking] /gaze response status:', res.status);
        
        if (res.status === 200) {
          setServerConnected(true);
          let data = null;
          try {
            data = await res.json();
          } catch (e) {
            console.log('[EyeTracking] ❌ Failed to parse JSON:', e.message);
            data = null;
          }

          if (data && data.gaze_text) {
            const isFocused = data.gaze_text === 'CENTER';
            console.log('[EyeTracking] 👁️ Gaze from /gaze/health:', data.gaze_text, '| Focused:', isFocused);
            setCurrentFocus(isFocused);
            updateTrackingData(isFocused);
            return;
          } else {
            console.log('[EyeTracking] ⚠️ No gaze_text in response (health check only):', data);
          }
        } else {
          // 204 or other statuses -> no fresh data
          setServerConnected(false);
          console.log('[EyeTracking] ⚠️ Server returned status:', res.status);
        }
      } catch (err) {
        console.error('[EyeTracking] ❌ Polling error:', err.message || err);
        console.error('[EyeTracking] Error details:', err);
        setServerConnected(false);
      }
    }, 2000); // Interval 2 detik untuk menghindari terlalu banyak request
    
    console.log('[EyeTracking] ✅ Remote polling interval created');
  };

  const updateTrackingData = (isFocused) => {
    const now = Date.now();

    setTrackingData(prev => {
      const newData = { ...prev };
      newData.totalTime += 1;

      if (isFocused) {
        newData.focusTime += 1;
        
        if (currentPage > 0) {
          newData.timePerPage[currentPage] = 
            (newData.timePerPage[currentPage] || 0) + 1;
        }
      } else {
        if (currentFocus === true) {
          newData.distractionCount += 1;
        }
      }

      newData.attentionScore =
        newData.totalTime > 0
          ? Math.round((newData.focusTime / newData.totalTime) * 100)
          : 100;

      newData.eyeMovements.push({
        timestamp: now,
        focused: isFocused,
        page: currentPage,
        simulated: isSimulatingEyeTracking || !cameraPermission,
      });

      return newData;
    });
  };

  const saveSkorMateri = async (payload) => {
    try {
      console.log('[SaveDB] 📤 Menyimpan skor ke database...');
      console.log('[SaveDB] Payload:', JSON.stringify(payload, null, 2));
      
      const response = await fetch(`${PYTHON_SERVER_URL}/skor-materi/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('[SaveDB] Response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('[SaveDB] ✅ Berhasil menyimpan:', JSON.stringify(result, null, 2));
        return { success: true, data: result };
      } else {
        const errorText = await response.text();
        console.error('[SaveDB] ❌ Gagal menyimpan:', response.status, errorText);
        return { success: false, error: errorText };
      }
    } catch (error) {
      console.error('[SaveDB] ❌ Error:', error.message);
      return { success: false, error: error.message };
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getAttentionColor = (score) => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#F59E0B';
    return '#EF4444';
  };

  const getAttentionText = (score) => {
    if (score >= 80) return 'Sangat Baik';
    if (score >= 60) return 'Baik';
    return 'Perlu Peningkatan';
  };

  // ========== RENDER ==========

  if (isLoadingPermission) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Mempersiapkan Eye Tracking...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4F46E5" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.timerContainer}>
            <Text style={styles.timerLabel}>⏱️ Waktu</Text>
            <Text style={styles.timerText}>{formatTime(timeElapsed)}</Text>
            {!canFinish && (
              <Text style={styles.timerRemaining}>
                Min: {formatTime(MINIMUM_READING_TIME - timeElapsed)}
              </Text>
            )}
          </View>

          <TouchableOpacity 
            onPress={handleBackPress} 
            style={[
              styles.finishButton,
              canFinish ? styles.finishButtonEnabled : styles.finishButtonDisabled
            ]}
            disabled={!canFinish}
          >
            <Text style={styles.finishButtonText}>
              {canFinish ? '✓ Selesai' : '🔒 Selesai'}
            </Text>
          </TouchableOpacity>

          <View style={styles.trackingInfo}>
            <View
              style={[
                styles.focusIndicator,
                { backgroundColor: currentFocus ? '#10B981' : '#EF4444' },
              ]}
            >
              <Text style={styles.focusText}>
                {currentFocus ? '👁 Fokus' : '👁 Tidak Fokus'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.materiHeader}>
          <Text style={styles.materiTitle}>{materi.title}</Text>
          <Text style={styles.materiSubtitle}>
            {materi.subtitle || 'Pembelajaran Interaktif dengan Eye Tracking'}
          </Text>
          {/* Server Status Indicator */}
          <View style={styles.serverStatusContainer}>
            <View style={[styles.serverStatusDot, { 
              backgroundColor: serverConnected === true ? '#10B981' : serverConnected === false ? '#EF4444' : '#F59E0B' 
            }]} />
            <Text style={styles.serverStatusText}>
              Server: {serverConnected === true ? 'Connected' : serverConnected === false ? 'Disconnected' : 'Connecting...'}
            </Text>
            <Text style={styles.serverUrlText}>({PYTHON_SERVER_URL})</Text>
          </View>
        </View>

        {/* Camera container */}
        <View style={styles.cameraContainer}>
          {cameraPermission && cameraReady && device ? (
            <Camera
              ref={cameraRef}
              style={styles.camera}
              device={device}
              isActive={isTracking}
              photo={true}
              onError={(error) => {
                console.error('Camera error:', error);
                setCameraReady(false);
              }}
            />
          ) : (
            <View style={styles.simulatedCamera}>
              <Text style={styles.simulatedCameraText}>📹</Text>
              <Text style={styles.simulatedLabel}>Simulasi</Text>
            </View>
          )}
        </View>

        {!cameraPermission && (
          <TouchableOpacity
            onPress={handleRequestPermission}
            style={styles.permissionButton}
            disabled={isLoadingPermission}
          >
            <Text style={styles.permissionButtonText}>
              {isLoadingPermission ? 'Loading...' : 'Aktifkan Kamera'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* PDF Viewer */}
      <View style={styles.pdfContainer}>
        {isLoadingPDF && (
          <View style={styles.pdfLoading}>
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text style={styles.pdfLoadingText}>Memuat PDF...</Text>
          </View>
        )}

        {pdfError && (
          <View style={styles.pdfError}>
            <Text style={styles.pdfErrorText}>❌ Gagal Memuat PDF</Text>
            <Text style={styles.pdfErrorDetail}>{pdfError}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setPdfError(null);
                setIsLoadingPDF(true);
              }}
            >
              <Text style={styles.retryButtonText}>Coba Lagi</Text>
            </TouchableOpacity>
          </View>
        )}
        

        <Pdf
          ref={pdfRef}
          source={getPdfSource()}
          trustAllCerts={false}
          onLoadComplete={handlePdfLoadComplete}
          onPageChanged={handlePageChanged}
          onError={handlePdfError}
          onPressLink={handlePdfLinkPress}
          style={styles.pdf}
          enablePaging={true}
          horizontal={false}
          spacing={10}
          enableAntialiasing={true}
          enableAnnotationRendering={true}
          // fitPolicy={0}
        />
      </View>

      {/* Stats Panel */}
      <View style={styles.statsPanel}>
        <View style={styles.statsHeader}>
          <Text style={styles.statsTitle}>
            Live Tracking{' '}
            {(!cameraPermission || isSimulatingEyeTracking) && '(Simulasi)'}
          </Text>
          <Text style={styles.timeText}>
            ⏱ {formatTime(timeElapsed)}
          </Text>
        </View>

        <View style={styles.pageIndicator}>
          <Text style={styles.pageText}>
            📄 Halaman {currentPage} dari {totalPages || '...'}
          </Text>
          <Text style={styles.pagesReadText}>
            Dibaca: {trackingData.pagesRead.length} halaman
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Fokus</Text>
            <Text style={styles.statValue}>
              {formatTime(trackingData.focusTime)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Gangguan</Text>
            <Text style={styles.statValue}>
              {trackingData.distractionCount}x
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Skor</Text>
            <Text
              style={[
                styles.statValue,
                { color: getAttentionColor(trackingData.attentionScore) },
              ]}
            >
              {trackingData.attentionScore}%
            </Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <Text style={styles.progressLabel}>
            Tingkat Perhatian: {getAttentionText(trackingData.attentionScore)}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${trackingData.attentionScore}%`,
                  backgroundColor: getAttentionColor(trackingData.attentionScore),
                },
              ]}
            />
          </View>
        </View>

        {!cameraPermission && (
          <View style={styles.infoNote}>
            <Text style={styles.infoNoteText}>
              💡 Mode simulasi aktif. Berikan izin kamera untuk eye tracking yang akurat.
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
  },
  header: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 15,
    marginBottom: 15,
  },
  timerContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  timerLabel: {
    color: '#E0E7FF',
    fontSize: 11,
    fontWeight: '500',
  },
  timerText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 2,
  },
  timerRemaining: {
    color: '#FCD34D',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  finishButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginHorizontal: 8,
  },
  finishButtonEnabled: {
    backgroundColor: '#10B981',
  },
  finishButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  finishButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  trackingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  focusIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  focusText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  materiHeader: {
    marginBottom: 15,
  },
  materiTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  materiSubtitle: {
    color: '#E0E7FF',
    fontSize: 14,
  },
  serverStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  serverStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  serverStatusText: {
    fontSize: 11,
    color: '#E0E7FF',
    fontWeight: '600',
    marginRight: 4,
  },
  serverUrlText: {
    fontSize: 9,
    color: '#C7D2FE',
    fontStyle: 'italic',
  },
  cameraContainer: {
    position: 'absolute',
    top: 100,
    right: 16,
    width: 100,
    height: 75,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  camera: {
    width: '100%',
    height: '100%',
  },
  simulatedCamera: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#F59E0B',
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  simulatedCameraText: {
    fontSize: 24,
  },
  simulatedLabel: {
    fontSize: 10,
    color: '#92400E',
    fontWeight: 'bold',
  },
  permissionButton: {
    position: 'absolute',
    top: 185,
    right: 16,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 100,
    alignItems: 'center',
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  pdfContainer: {
    flex: 1,
    marginTop: 10,
    marginHorizontal: 10,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  pdf: {
    flex: 1,
    width: width - 20,
  },
  pdfLoading: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
    alignItems: 'center',
    zIndex: 10,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    elevation: 5,
  },
  pdfLoadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#64748B',
  },
  pdfError: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -75 }],
    width: 200,
    padding: 20,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    alignItems: 'center',
    zIndex: 10,
    elevation: 5,
  },
  pdfErrorText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#991B1B',
    marginBottom: 8,
  },
  pdfErrorDetail: {
    fontSize: 12,
    color: '#991B1B',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  statsPanel: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  timeText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '600',
  },
  pageIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  pageText: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '600',
  },
  pagesReadText: {
    fontSize: 12,
    color: '#64748B',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  infoNote: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F59E0B',
    marginTop: 8,
  },
  infoNoteText: {
    fontSize: 12,
    color: '#92400E',
    textAlign: 'center',
    fontWeight: '500',
  },
});