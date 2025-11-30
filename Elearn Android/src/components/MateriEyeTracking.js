// MateriEyeTracking.js - Complete PDF Version
import React, { useState, useEffect, useRef } from 'react';
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

const { width, height } = Dimensions.get('window');

export default function MateriEyeTracking({ route, navigation }) {
  const { materi } = route.params;
  // If you run the Python eye-tracker server on your dev machine, set the URL here
  // Example: 'http://192.168.1.100:5000' (replace with your PC IP) or pass via route.params.serverUrl
  const PYTHON_SERVER_URL = route.params?.serverUrl || 'http://192.168.0.103:5000';
  const useRemoteServer = route.params?.useRemoteServer ?? true; // jika true, selalu polling server untuk gaze

  const [isTracking, setIsTracking] = useState(false);
  const [cameraPermission, setCameraPermission] = useState(null);
  const [isLoadingPermission, setIsLoadingPermission] = useState(true);
  const [isLoadingPDF, setIsLoadingPDF] = useState(true);
  const [pdfError, setPdfError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  
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

  const device = useCameraDevice('front');
  const trackingInterval = useRef(null);
  const remoteInterval = useRef(null);
  const lastFocusTime = useRef(Date.now());
  const startTime = useRef(Date.now());
  const pageStartTime = useRef(Date.now());
  const pdfRef = useRef(null);

  // ========== PDF FUNCTIONS ==========
  
  const getPdfSource = () => {
    if (materi.pdfUrl) {
      return {
        uri: materi.pdfUrl,
        cache: true,
      };
    }
    
    if (materi.localPdfPath) {
      return {
        uri: materi.localPdfPath,
        cache: true,
      };
    }

    if (materi.pdfBase64) {
      return {
        uri: `data:application/pdf;base64,${materi.pdfBase64}`,
        cache: false,
      };
    }

    // Sample PDF for testing
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
    
    const initialTimePerPage = {};
    for (let i = 1; i <= numberOfPages; i++) {
      initialTimePerPage[i] = 0;
    }
    
    setTrackingData(prev => ({
      ...prev,
      timePerPage: initialTimePerPage,
    }));
  };

  const handlePageChanged = (page, numberOfPages) => {
    console.log(`Page changed to: ${page} of ${numberOfPages}`);
    
    const timeSpent = Math.floor((Date.now() - pageStartTime.current) / 1000);
    
    setIsLoadingPDF(false);
    
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

  useEffect(() => {
    const timer = setTimeout(() => {
      initializePermissions();
    }, 100);

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBackPress();
      return true;
    });

    return () => {
      clearTimeout(timer);
      backHandler.remove();
      if (trackingInterval.current) {
        clearInterval(trackingInterval.current);
      }
    };
  }, );

  const initializePermissions = async () => {
    setIsLoadingPermission(true);

    try {
      if (!Camera || typeof Camera.getCameraPermissionStatus !== 'function') {
        console.log('Camera module not ready, using simulation mode');
        setCameraPermission(false);
        setIsSimulatingEyeTracking(true);
        startTracking();
        setIsLoadingPermission(false);
        return;
      }

      const cameraPermissionStatus = await Camera.getCameraPermissionStatus();
      console.log('Camera permission status:', cameraPermissionStatus);

      if (cameraPermissionStatus === 'granted' || cameraPermissionStatus === 'authorized') {
        setCameraPermission(true);
        setCameraReady(true);
        startTracking();
      } else if (cameraPermissionStatus === 'not-determined') {
        const newPermissionStatus = await Camera.requestCameraPermission();
        console.log('New permission status:', newPermissionStatus);

        if (newPermissionStatus === 'granted' || newPermissionStatus === 'authorized') {
          setCameraPermission(true);
          setCameraReady(true);
          startTracking();
        } else {
          setCameraPermission(false);
          setIsSimulatingEyeTracking(true);
          startTracking();
        }
      } else {
        setCameraPermission(false);
        setIsSimulatingEyeTracking(true);
        startTracking();
      }
    } catch (error) {
      console.error('Permission initialization error:', error);
      setCameraPermission(false);
      setIsSimulatingEyeTracking(true);
      startTracking();
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
        startTracking();
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
    setIsTracking(true);
    startTime.current = Date.now();
    lastFocusTime.current = Date.now();
    pageStartTime.current = Date.now();
    // Mulai polling remote server bila diizinkan (terlepas dari status kamera)
    if (useRemoteServer) {
      startRemotePolling();
    }

    if (isSimulatingEyeTracking || !cameraPermission) {
      startSimulatedTracking();
    }
  };

  const startSimulatedTracking = () => {
    // Try to poll a remote Python server first (if available). Fall back to random simulation.
    trackingInterval.current = setInterval(async () => {
      try {
        const res = await fetch(`${PYTHON_SERVER_URL}/gaze`, { method: 'GET' });
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
    }, 1000);
  };

  const startRemotePolling = () => {
    // jika sudah berjalan, jangan buat lagi
    if (remoteInterval.current) return;

    remoteInterval.current = setInterval(async () => {
      try {
        const res = await fetch(`${PYTHON_SERVER_URL}/gaze`, { method: 'GET' });
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
            // log eksplisit agar mudah dilihat di device log
            console.log('[Remote gaze]', data);
            setCurrentFocus(isFocused);
            updateTrackingData(isFocused);
            return;
          }
        } else {
          // 204 or other statuses -> no fresh data
          setServerConnected(false);
        }
      } catch (err) {
        console.warn('Remote polling error:', err.message || err);
        setServerConnected(false);
      }
    }, 1000);
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

  const handleBackPress = () => {
    setIsTracking(false);

    if (trackingInterval.current) {
      clearInterval(trackingInterval.current);
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
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Kembali</Text>
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
        </View>

        {/* Camera container */}
        <View style={styles.cameraContainer}>
          {cameraPermission && cameraReady && device ? (
            <Camera
              style={styles.camera}
              device={device}
              isActive={isTracking}
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
          trustAllCerts={true}
          source={getPdfSource()}
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
            ⏱ {formatTime(trackingData.totalTime)}
          </Text>
        </View>

        <View style={styles.pageIndicator}>
          <Text style={styles.pageText}>
            📄 Halaman {currentPage} dari {totalPages}
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
  cameraContainer: {
    position: 'absolute',
    top: 60,
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
    top: 145,
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