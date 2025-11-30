import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { logAllAsyncStorageData, verifyMahasiswaData } from '../utils/AsyncStorageDebug';
import { API_URL } from '../config/api';

const HomeScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [mahasiswaData, setMahasiswaData] = useState(null);
  const [presensiList, setPresensiList] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUserData();
    logAllAsyncStorageData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (mahasiswaData) {
        console.log('📱 HomeScreen focused - fetching fresh data...');
        fetchPresensiData(mahasiswaData.id_mahasiswa);
      }
    }, [mahasiswaData])
  );

  const loadUserData = async () => {
    try {
      console.log('📂 Loading user data from AsyncStorage...');
      const user = await AsyncStorage.getItem('user');
      const mahasiswa = await AsyncStorage.getItem('mahasiswa');

      if (user) {
        const parsedUser = JSON.parse(user);
        setUserData(parsedUser);
        console.log('👤 User data loaded:', parsedUser.username, parsedUser.role);
      } else {
        console.warn('⚠️ User data tidak ditemukan di AsyncStorage');
      }

      if (mahasiswa) {
        const parsedMahasiswa = JSON.parse(mahasiswa);
        setMahasiswaData(parsedMahasiswa);
        console.log('📋 Mahasiswa data loaded:', parsedMahasiswa.id_mahasiswa, parsedMahasiswa.nim);
        if (parsedMahasiswa.id_mahasiswa) {
          fetchPresensiData(parsedMahasiswa.id_mahasiswa);
        } else {
          console.error('❌ id_mahasiswa is missing in mahasiswa data!');
        }
      } else {
        console.warn('⚠️ Data mahasiswa tidak ditemukan di AsyncStorage');
      }
    } catch (error) {
      console.error('❌ Error loading user data:', error);
    }
  };

  const fetchPresensiData = async (id_mahasiswa) => {
    try {
      console.log(`🔄 Fetching presensi data for id_mahasiswa: ${id_mahasiswa}`);
      const token = await AsyncStorage.getItem('access_token');
      const response = await axios.get(`${API_URL}/presensi/mahasiswa/${id_mahasiswa}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
        },
      });

      if (response.data && Array.isArray(response.data)) {
        const currentDateTime = new Date();
        const filteredPresensi = response.data.filter((p) => {
          if (!p.tanggal || !p.waktu_selesai) return false;
          const presensiDate = new Date(p.tanggal);
          const [hours = '0', minutes = '0'] = p.waktu_selesai.split(':');
          const deadlineTime = new Date(presensiDate);
          deadlineTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
          return deadlineTime >= currentDateTime || p.status === 'Hadir';
        });

        console.log(`✅ Filtered presensi: ${filteredPresensi.length} items`);
        setPresensiList(filteredPresensi);
      } else {
        console.warn('⚠️ Response data is not an array:', response.data);
        setPresensiList([]);
      }
    } catch (error) {
      console.error('❌ Error fetching presensi:', error);
      console.error('Error response:', error.response?.data);
      setPresensiList([]);
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    if (mahasiswaData) fetchPresensiData(mahasiswaData.id_mahasiswa);
    else setRefreshing(false);
  };

  const handlePresensiClick = (presensi) => {
    console.log('📌 handlePresensiClick dipanggil', presensi);
    if (!mahasiswaData) {
      Alert.alert('Info', 'Data mahasiswa belum tersedia.');
      return;
    }

    if (presensi.status === 'Hadir') {
      const waktuAbsen = presensi.waktu_input ? new Date(presensi.waktu_input).toLocaleString('id-ID') : 'N/A';
      Alert.alert(
        'Sudah Absen',
        `Anda sudah melakukan presensi\n\nMata Kuliah: ${presensi.nama_mk}\nPertemuan: ${presensi.pertemuan_ke}\nWaktu Absen: ${waktuAbsen}`
      );
      return;
    }

    if (!presensi.tanggal || !presensi.waktu_mulai || !presensi.waktu_selesai) {
      Alert.alert('Info', 'Data waktu presensi tidak lengkap.');
      return;
    }

    const currentDateTime = new Date();
    const presensiDate = new Date(presensi.tanggal);
    const [startHours = '0', startMinutes = '0'] = presensi.waktu_mulai.split(':');
    const [endHours = '0', endMinutes = '0'] = presensi.waktu_selesai.split(':');

    const startTime = new Date(presensiDate);
    startTime.setHours(parseInt(startHours, 10), parseInt(startMinutes, 10), 0, 0);

    const endTime = new Date(presensiDate);
    endTime.setHours(parseInt(endHours, 10), parseInt(endMinutes, 10), 0, 0);

    if (currentDateTime < startTime) {
      Alert.alert('Presensi Belum Dibuka', `Presensi akan dibuka pada pukul ${presensi.waktu_mulai}`);
      return;
    }

    if (currentDateTime > endTime) {
      Alert.alert('Waktu Berakhir', `Waktu presensi sudah berakhir pada pukul ${presensi.waktu_selesai}`);
      return;
    }

    const params = {
      id_presensi: presensi.id_presensi,
      mata_kuliah: presensi.nama_mk,
      pertemuan_ke: presensi.pertemuan_ke,
      kode_mk: presensi.kode_mk,
      nim: mahasiswaData.nim,
      id_mahasiswa: mahasiswaData.id_mahasiswa,
    };

    navigation.navigate('Camera', params);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return `${days[date.getDay()]}, ${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Hadir':
        return '#0EA5E9';
      case 'Alfa':
        return '#EF4444';
      case 'Belum Absen':
        return '#60A5FA';
      default:
        return '#6B7280';
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const presensiHariIni = presensiList.filter((p) => p.tanggal === today);

  const menuItems = [
    { title: 'Informasi', icon: 'checkmark-circle', colorFrom: '#10B981', colorTo: '#059669', route: 'Courses' },
    { title: 'Materi', icon: 'document-text', colorFrom: '#F97316', colorTo: '#EA580C', route: 'Courses' },
    { title: 'Jadwal Kuliah', icon: 'calendar', colorFrom: '#0EA5E9', colorTo: '#0369A1', route: 'Courses' },
  ];

  const materiList = [
    {
      id: 1,
      title: 'Materi Game Design',
      subtitle: 'Pengembangan Permainan',
      date: '21 Jul 2024',
      icon: 'book',
      description: 'Pelajari dasar-dasar perancangan game dan prinsip-prinsip game design',
      duration: '45 menit',
      difficulty: 'Beginner',
    },
    {
      id: 2,
      title: 'Materi Installasi Project',
      subtitle: 'Workshop Mobile Application Advance',
      date: '22 Jul 2024',
      icon: 'cog',
      description: 'Setup dan instalasi project React Native untuk pengembangan aplikasi mobile',
      duration: '60 menit',
      difficulty: 'Intermediate',
    },
  ];

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Beginner':
        return '#0EA5E9';
      case 'Intermediate':
        return '#3B82F6';
      case 'Advanced':
        return '#1E40AF';
      default:
        return '#64748B';
    }
  };

  const handleMateriPress = (materi) => navigation.navigate('MateriEyeTracking', { materi });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E40AF" />
      {/* Header - gradient like reference */}
      <LinearGradient colors={['#1E40AF', '#2563EB', '#3B82F6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Halo, Selamat Datang</Text>
            <Text style={styles.subGreeting}>
              {mahasiswaData ? mahasiswaData.nama_mahasiswa : (userData && userData.nama) || 'Rafi Ramdani Dinata'}
            </Text>
          </View>

          <TouchableOpacity style={styles.notificationButton} onPress={() => Alert.alert('Notifikasi', 'Fitur notifikasi belum diimplementasikan')}>
            <Ionicons name="notifications-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Quick action row (mirip reference) */}
        <View style={styles.quickActions}>
          {menuItems.map((it, idx) => (
            <TouchableOpacity key={idx} style={styles.quickActionBtn} onPress={() => navigation.navigate(it.route)}>
              <LinearGradient
                colors={[it.colorFrom, it.colorTo]}
                style={styles.quickActionGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name={it.icon} size={22} color="#fff" />
              </LinearGradient>
              <Text style={styles.quickActionLabel}>{it.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Presensi Hari Ini */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Presensi Hari Ini</Text>
            <Text style={[styles.seeAll, { color: '#94A3B8' }]}>{presensiHariIni.length} Presensi</Text>
          </View>

          {presensiHariIni.length > 0 ? (
            presensiHariIni.map((presensi, index) => (
              <TouchableOpacity key={presensi.id_presensi ?? index} style={styles.presenceCard} onPress={() => handlePresensiClick(presensi)}>
                <View style={styles.presenceLeft}>
                <View style={[
                    styles.presenceIcon,
                    { backgroundColor: presensi.status === 'Hadir' ? '#DBEAFE' : '#DBEAFE' }
                  ]}>
                    <Text style={styles.presenceIconText}>{presensi.status === 'Hadir' ? '✓' : '📋'}</Text>
                </View>                  <View style={styles.presenceContent}>
                    <Text style={styles.presenceTitle}>{presensi.nama_mk}</Text>
                    <Text style={styles.presenceSubtitle}>Pertemuan {presensi.pertemuan_ke}•{presensi.kelas ?? ''}</Text>

                    <View style={styles.separator} />

                    <View style={styles.presenceDetails}>
                      <View style={styles.presenceDetailItem}>
                        <Text style={styles.presenceDetailIcon}>🕐</Text>
                        <Text style={styles.presenceDetailText}>{presensi.waktu_mulai ?? '-'} - {presensi.waktu_selesai ?? '-'}</Text>
                      </View>

                      <View style={styles.presenceDetailItem}>
                        <Text style={[styles.presenceDetailText, { color: getStatusColor(presensi.status), fontWeight: '700', fontSize: 13 }]}>
                          {presensi.status}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                <Ionicons name="chevron-forward" size={20} color="#CBD5E1" style={{ marginTop: 6 }} />
              </TouchableOpacity>
            ))
          ) : (
            <View style={[styles.presenceCard, { backgroundColor: '#F8FAFC' }]}>
              <View style={styles.presenceLeft}>
                <View style={styles.presenceIcon}>
                  <Text style={styles.presenceIconText}>📅</Text>
                </View>

                <View style={styles.presenceContent}>
                  <Text style={styles.presenceTitle}>Tidak Ada Presensi</Text>
                  <Text style={styles.presenceSubtitle}>Tidak ada presensi yang tersedia hari ini</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Riwayat Presensi */}
        {presensiList.length > presensiHariIni.length && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Riwayat Presensi</Text>
              <Text style={[styles.seeAll, { color: '#94A3B8' }]}>{presensiList.length - presensiHariIni.length} Lainnya</Text>
            </View>

            {presensiList.filter((p) => p.tanggal !== today).slice(0, 3).map((presensi, index) => (
              <TouchableOpacity
                key={presensi.id_presensi ?? index}
                style={[styles.presenceCard, { opacity: 0.95 }]}
                onPress={() => {
                  if (!mahasiswaData) {
                    Alert.alert('Info', 'Data mahasiswa belum tersedia.');
                    return;
                  }
                  const params = {
                    id_presensi: presensi.id_presensi,
                    mata_kuliah: presensi.nama_mk,
                    pertemuan_ke: presensi.pertemuan_ke,
                    kode_mk: presensi.kode_mk,
                    nim: mahasiswaData.nim,
                    id_mahasiswa: mahasiswaData.id_mahasiswa,
                  };
                  navigation.navigate('Camera', params);
                }}
              >
                <View style={styles.presenceLeft}>
                  <View style={[
                    styles.presenceIcon,
                    { backgroundColor: presensi.status === 'Hadir' ? '#DBEAFE' : '#BFDBFE' }
                  ]}>
                    <Text style={styles.presenceIconText}>{presensi.status === 'Hadir' ? '✓' : '✗'}</Text>
                  </View>

                  <View style={styles.presenceContent}>
                    <Text style={styles.presenceTitle}>{presensi.nama_mk}</Text>
                    <Text style={styles.presenceSubtitle}>Pertemuan {presensi.pertemuan_ke}•{formatDate(presensi.tanggal)}</Text>

                    <View style={styles.separator} />

                    <View style={styles.presenceDetails}>
                      <View style={styles.presenceDetailItem}>
                        <Text style={styles.presenceDetailIcon}>🕐</Text>
                        <Text style={styles.presenceDetailText}>{presensi.waktu_mulai ?? '-'} - {presensi.waktu_selesai ?? '-'}</Text>
                      </View>

                      <View style={styles.presenceDetailItem}>
                        <Text style={[styles.presenceDetailText, { color: getStatusColor(presensi.status), fontWeight: '700', fontSize: 13 }]}>
                          {presensi.status}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                <Ionicons name="chevron-forward" size={20} color="#CBD5E1" style={{ marginTop: 6 }} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Daftar Materi */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Daftar Materi</Text>
            <TouchableOpacity onPress={() => navigation.navigate('DaftarMateri')}>
              <Text style={styles.seeAll}>Lihat Semua</Text>
            </TouchableOpacity>
          </View>

          {materiList.map((materi, index) => (
            <TouchableOpacity key={materi.id ?? index} style={styles.materiCard} onPress={() => handleMateriPress(materi)}>
              <View style={styles.materiHeader}>
                <View style={styles.materiLeft}>
                  <View style={styles.materiIcon}>
                    <Ionicons name={materi.icon} size={22} color="#0C4A6E" />
                  </View>

                  <View style={styles.materiInfo}>
                    <Text style={styles.materiTitle}>{materi.title}</Text>
                    <Text style={styles.materiSubtitle}>{materi.subtitle}</Text>
                    <Text style={styles.materiDescription}>{materi.description}</Text>
                  </View>
                </View>

                <View style={styles.materiRight}>
                  <Text style={styles.materiDate}>{materi.date}</Text>
                </View>
              </View>

              <View style={styles.materiFooter}>
                <View style={styles.materiTags}>
                  <View style={styles.durationTag}>
                    <Text style={styles.tagText}>⏱{materi.duration}</Text>
                  </View>

                  <View style={[styles.difficultyTag, { backgroundColor: getDifficultyColor(materi.difficulty) + '20' }]}>
                    <Text style={[styles.tagText, { color: getDifficultyColor(materi.difficulty) }]}>{materi.difficulty}</Text>
                  </View>
                </View>

                <View style={styles.eyeTrackingBadge}>
                  <Text style={styles.eyeTrackingText}>👁Eye Tracking</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F9FF' },

  /* Header */
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  greeting: { color: '#FFFFFF', fontSize: 24, fontWeight: '800', letterSpacing: 0.3 },
  subGreeting: { color: '#DBEAFE', fontSize: 15, marginTop: 6, fontWeight: '500' },

  notificationButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 11,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },

  /* Quick actions similar to reference */
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  quickActionBtn: {
    width: '23%',
    alignItems: 'center',
  },
  quickActionGradient: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 4,
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  quickActionLabel: { color: '#FFFFFF', fontSize: 12, textAlign: 'center', fontWeight: '700' },

  /* Content area */
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },

  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 19, fontWeight: '800', color: '#1E3A8A', letterSpacing: 0.2 },
  seeAll: { color: '#2563EB', fontSize: 14, fontWeight: '700' },

  /* Presence card (kept from your original style) */
  presenceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  presenceLeft: { flexDirection: 'row', alignItems: 'flex-start', flex: 1 },
  presenceIcon: { backgroundColor: '#DBEAFE', width: 50, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  presenceIconText: { fontSize: 22 },
  presenceContent: { flex: 1 },
  presenceTitle: { fontSize: 16, fontWeight: '800', color: '#1E3A8A', marginBottom: 3 },
  presenceSubtitle: { fontSize: 13, color: '#64748B', marginBottom: 12, fontWeight: '500' },

  separator: { height: 1, backgroundColor: '#DBEAFE', marginBottom: 12 },

  presenceDetails: { flexDirection: 'row', justifyContent: 'space-between' },
  presenceDetailItem: { flexDirection: 'row', alignItems: 'center' },
  presenceDetailIcon: { fontSize: 15, marginRight: 6 },
  presenceDetailText: { fontSize: 13, color: '#1E3A8A', fontWeight: '700' },

  /* Materi card (kept style) */
  materiCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    elevation: 4,
    borderLeftWidth: 5,
    borderLeftColor: '#2563EB',
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  materiHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  materiLeft: { flexDirection: 'row', flex: 1 },
  materiIcon: { backgroundColor: '#DBEAFE', width: 56, height: 56, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  materiIconText: { fontSize: 24 },
  materiInfo: { flex: 1 },
  materiTitle: { fontSize: 17, fontWeight: '800', color: '#1E3A8A', letterSpacing: 0.2 },
  materiSubtitle: { fontSize: 13, color: '#64748B', marginBottom: 8, fontWeight: '500' },
  materiDescription: { fontSize: 13, color: '#64748B', lineHeight: 18 },
  materiRight: { alignItems: 'flex-end' },
  materiDate: { fontSize: 12, color: '#94A3B8', fontWeight: '700' },

  materiFooter: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#E0F2FE', paddingTop: 12, marginTop: 10 },
  materiTags: { flexDirection: 'row', gap: 10 },
  durationTag: { backgroundColor: '#DBEAFE', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14 },
  difficultyTag: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14 },
  tagText: { fontSize: 11, fontWeight: '800', color: '#1E3A8A' },
  eyeTrackingBadge: { backgroundColor: '#DBEAFE', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 18, borderWidth: 1, borderColor: '#93C5FD' },
  eyeTrackingText: { fontSize: 12, color: '#1E40AF', fontWeight: '800' },

  /* Info card */
  infoSection: { marginBottom: 30 },
  infoCard: { backgroundColor: '#EFF6FF', borderRadius: 18, padding: 16, flexDirection: 'row', borderWidth: 1, borderColor: '#BFDBFE', alignItems: 'flex-start' },
  infoContent: { flex: 1 },
  infoTitle: { fontSize: 16, fontWeight: '800', color: '#1E3A8A', marginBottom: 6 },
  infoText: { fontSize: 13, color: '#1E40AF', lineHeight: 18 },
});
