import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import { COLORS, GRADIENTS } from '../constants/colors';
import { API_URL } from '../config/api';
import SessionManager from '../utils/SessionManager';
import BottomNavigation from './BottomNavigation';

const JadwalKuliah = ({ navigation }) => {
  const [jadwalList, setJadwalList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);

  const daysOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

  useEffect(() => {
    fetchJadwal();
  }, []);

  const fetchJadwal = async () => {
    try {
      setIsLoading(true);

      const token = await SessionManager.getToken();
      if (!token) {
        Alert.alert('Error', 'Sesi Anda telah berakhir. Silakan login kembali.');
        navigation.replace('Login');
        return;
      }

      const response = await axios.get(`${API_URL}/jadwal-kuliah/mahasiswa/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000,
      });

      console.log('📅 Jadwal data:', response.data);

      if (response.data) {
        const sorted = response.data.sort((a, b) => {
          const dayCompare = daysOrder.indexOf(a.hari) - daysOrder.indexOf(b.hari);
          if (dayCompare !== 0) return dayCompare;
          
          const timeA = a.jam_mulai || '00:00:00';
          const timeB = b.jam_mulai || '00:00:00';
          return timeA.localeCompare(timeB);
        });

        setJadwalList(sorted);
      } else {
        setJadwalList([]);
      }
    } catch (error) {
      console.error('❌ Error fetching jadwal:', error);
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchJadwal();
    setRefreshing(false);
  }, []);

  const handleError = (error) => {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        const status = error.response.status;
        if (status === 401) {
          Alert.alert('Sesi Berakhir', 'Sesi Anda telah berakhir. Silakan login kembali.', [
            { text: 'OK', onPress: () => navigation.replace('Login') },
          ]);
        } else if (status === 403) {
          Alert.alert('Akses Ditolak', 'Anda tidak memiliki akses ke fitur ini.');
        } else if (status === 404) {
          Alert.alert(
            'Data Tidak Ditemukan',
            error.response.data?.detail || 'Jadwal kuliah tidak ditemukan.'
          );
        } else {
          Alert.alert('Error', 'Terjadi kesalahan saat memuat jadwal kuliah.');
        }
      } else if (error.request) {
        Alert.alert(
          'Koneksi Gagal',
          'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.'
        );
      }
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '-';
    return timeString.substring(0, 5);
  };

  const getJadwalByDay = (day) => {
    return jadwalList.filter((jadwal) => jadwal.hari === day);
  };

  const renderDaySelector = () => {
    const uniqueDays = [...new Set(jadwalList.map((j) => j.hari))].sort(
      (a, b) => daysOrder.indexOf(a) - daysOrder.indexOf(b)
    );

    return (
      <View style={styles.daySelectorContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.dayButton, !selectedDay && styles.dayButtonActive]}
            onPress={() => setSelectedDay(null)}
          >
            <Text style={[styles.dayButtonText, !selectedDay && styles.dayButtonTextActive]}>
              Semua Hari
            </Text>
          </TouchableOpacity>
          {uniqueDays.map((day) => (
            <TouchableOpacity
              key={day}
              style={[styles.dayButton, selectedDay === day && styles.dayButtonActive]}
              onPress={() => setSelectedDay(day)}
            >
              <Text
                style={[
                  styles.dayButtonText,
                  selectedDay === day && styles.dayButtonTextActive,
                ]}
              >
                {day}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderJadwalCard = (jadwal) => {
    return (
      <View key={jadwal.id_jadwal} style={styles.jadwalCard}>
        <LinearGradient
          colors={['#ffffff', '#f8fbff']}
          style={styles.cardGradient}
        >
          <View style={styles.jadwalHeader}>
            <View style={styles.jadwalHeaderLeft}>
              <View style={styles.iconContainer}>
                <Icon name="book" size={20} color="#ffffff" />
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={styles.matkulName}>{jadwal.nama_mk || '-'}</Text>
                <Text style={styles.kodeMk}>{jadwal.kode_mk || '-'}</Text>
              </View>
            </View>
            <View style={styles.dayBadge}>
              <Text style={styles.dayBadgeText}>{jadwal.hari}</Text>
            </View>
          </View>

          <View style={styles.jadwalDetails}>
            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <Icon name="person" size={16} color="#2563eb" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Dosen</Text>
                <Text style={styles.detailValue}>{jadwal.nama_dosen || '-'}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <Icon name="time" size={16} color="#2563eb" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Waktu</Text>
                <Text style={styles.detailValue}>
                  {formatTime(jadwal.jam_mulai)} - {formatTime(jadwal.jam_selesai)}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <Icon name="location" size={16} color="#2563eb" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Ruangan</Text>
                <Text style={styles.detailValue}>{jadwal.ruangan || '-'}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  };

  const renderJadwalByDay = () => {
    if (selectedDay) {
      const jadwalDay = getJadwalByDay(selectedDay);
      if (jadwalDay.length === 0) {
        return (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Icon name="calendar-outline" size={64} color="#93c5fd" />
            </View>
            <Text style={styles.emptyText}>Tidak ada jadwal</Text>
            <Text style={styles.emptySubText}>pada hari {selectedDay}</Text>
          </View>
        );
      }
      return jadwalDay.map((jadwal) => renderJadwalCard(jadwal));
    }

    const groupedJadwal = daysOrder.map((day) => ({
      day,
      jadwal: getJadwalByDay(day),
    })).filter((group) => group.jadwal.length > 0);

    if (groupedJadwal.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Icon name="calendar-outline" size={64} color="#93c5fd" />
          </View>
          <Text style={styles.emptyText}>Belum ada jadwal kuliah</Text>
          <Text style={styles.emptySubText}>
            Jadwal kuliah Anda akan muncul di sini
          </Text>
        </View>
      );
    }

    return groupedJadwal.map((group) => (
      <View key={group.day} style={styles.daySection}>
        <View style={styles.daySectionHeader}>
          <Text style={styles.daySectionTitle}>{group.day}</Text>
          <View style={styles.daySectionBadge}>
            <Icon name="layers" size={12} color="#2563eb" style={{ marginRight: 4 }} />
            <Text style={styles.daySectionBadgeText}>{group.jadwal.length} Kelas</Text>
          </View>
        </View>
        {group.jadwal.map((jadwal) => renderJadwalCard(jadwal))}
      </View>
    ));
  };

  if (isLoading) {
    return (
      <LinearGradient colors={['#dbeafe', '#eff6ff', '#ffffff']} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.headerIconContainer}>
                <Icon name="calendar" size={28} color="#ffffff" />
              </View>
              <Text style={styles.headerTitle}>Jadwal Kuliah</Text>
            </View>
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingText}>Memuat jadwal kuliah...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#dbeafe', '#eff6ff', '#ffffff']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerIconContainer}>
              <Icon name="calendar" size={28} color="#ffffff" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Jadwal Kuliah</Text>
              <Text style={styles.headerSubtitle}>Kelola jadwal perkuliahan Anda</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
            <Icon name="refresh" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Day Selector */}
        {jadwalList.length > 0 && renderDaySelector()}

        {/* Jadwal List */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#2563eb']}
              tintColor="#2563eb"
            />
          }
        >
          {renderJadwalByDay()}
        </ScrollView>

        {/* Bottom Navigation */}
        <BottomNavigation />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#2563eb',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  daySelectorContainer: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginTop: 8,
    marginHorizontal: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  dayButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#f1f5f9',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dayButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#1e40af',
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  dayButtonTextActive: {
    color: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  daySection: {
    marginBottom: 28,
  },
  daySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  daySectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  daySectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  daySectionBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
  },
  jadwalCard: {
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: 20,
    borderWidth: 1,
    borderColor: '#e0f2fe',
    borderRadius: 20,
  },
  jadwalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0f2fe',
  },
  jadwalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTextContainer: {
    flex: 1,
  },
  matkulName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 2,
  },
  kodeMk: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  dayBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  dayBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e40af',
  },
  jadwalDetails: {
    gap: 14,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#475569',
    marginTop: 4,
  },
  emptySubText: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 8,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 16,
    fontWeight: '500',
  },
});

export default JadwalKuliah;