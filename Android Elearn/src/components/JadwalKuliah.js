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

      // Get token from SessionManager
      const token = await SessionManager.getToken();
      if (!token) {
        Alert.alert('Error', 'Sesi Anda telah berakhir. Silakan login kembali.');
        navigation.replace('Login');
        return;
      }

      // Fetch jadwal from API
      const response = await axios.get(`${API_URL}/jadwal-kuliah/mahasiswa/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000,
      });

      console.log('📅 Jadwal data:', response.data);

      if (response.data) {
        // Sort by day and time
        const sorted = response.data.sort((a, b) => {
          const dayCompare = daysOrder.indexOf(a.hari) - daysOrder.indexOf(b.hari);
          if (dayCompare !== 0) return dayCompare;
          
          // Sort by time if same day
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
    // Format from "HH:MM:SS" to "HH:MM"
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
              Semua
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
        <View style={styles.jadwalHeader}>
          <View style={styles.jadwalHeaderLeft}>
            <Icon name="book-outline" size={20} color={COLORS.purple600} />
            <Text style={styles.matkulName}>{jadwal.nama_mk || '-'}</Text>
          </View>
          <View style={styles.dayBadge}>
            <Text style={styles.dayBadgeText}>{jadwal.hari}</Text>
          </View>
        </View>

        <View style={styles.jadwalDetails}>
          <View style={styles.detailRow}>
            <Icon name="person-outline" size={16} color={COLORS.gray500} />
            <Text style={styles.detailLabel}>Dosen:</Text>
            <Text style={styles.detailValue}>{jadwal.nama_dosen || '-'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Icon name="time-outline" size={16} color={COLORS.gray500} />
            <Text style={styles.detailLabel}>Waktu:</Text>
            <Text style={styles.detailValue}>
              {formatTime(jadwal.jam_mulai)} - {formatTime(jadwal.jam_selesai)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Icon name="location-outline" size={16} color={COLORS.gray500} />
            <Text style={styles.detailLabel}>Ruangan:</Text>
            <Text style={styles.detailValue}>{jadwal.ruangan || '-'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Icon name="code-outline" size={16} color={COLORS.gray500} />
            <Text style={styles.detailLabel}>Kode MK:</Text>
            <Text style={styles.detailValue}>{jadwal.kode_mk || '-'}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderJadwalByDay = () => {
    if (selectedDay) {
      const jadwalDay = getJadwalByDay(selectedDay);
      if (jadwalDay.length === 0) {
        return (
          <View style={styles.emptyContainer}>
            <Icon name="calendar-outline" size={64} color={COLORS.gray300} />
            <Text style={styles.emptyText}>Tidak ada jadwal pada hari {selectedDay}</Text>
          </View>
        );
      }
      return jadwalDay.map((jadwal) => renderJadwalCard(jadwal));
    }

    // Group by day
    const groupedJadwal = daysOrder.map((day) => ({
      day,
      jadwal: getJadwalByDay(day),
    })).filter((group) => group.jadwal.length > 0);

    if (groupedJadwal.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Icon name="calendar-outline" size={64} color={COLORS.gray300} />
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
            <Text style={styles.daySectionBadgeText}>{group.jadwal.length} Kelas</Text>
          </View>
        </View>
        {group.jadwal.map((jadwal) => renderJadwalCard(jadwal))}
      </View>
    ));
  };

  if (isLoading) {
    return (
      <LinearGradient colors={[COLORS.purple50, COLORS.bgPurple]} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Jadwal Kuliah</Text>
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.purple600} />
            <Text style={styles.loadingText}>Memuat jadwal kuliah...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[COLORS.purple50, COLORS.bgPurple]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Icon name="calendar" size={28} color={COLORS.purple600} />
            <Text style={styles.headerTitle}>Jadwal Kuliah</Text>
          </View>
          <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
            <Icon name="refresh" size={24} color={COLORS.purple600} />
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
              colors={[COLORS.purple600]}
              tintColor={COLORS.purple600}
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
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.gray800,
  },
  refreshButton: {
    padding: 8,
  },
  daySelectorContainer: {
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.gray100,
    marginRight: 8,
  },
  dayButtonActive: {
    backgroundColor: COLORS.purple600,
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray600,
  },
  dayButtonTextActive: {
    color: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  daySection: {
    marginBottom: 24,
  },
  daySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  daySectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.gray800,
  },
  daySectionBadge: {
    backgroundColor: COLORS.purple100,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  daySectionBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.purple600,
  },
  jadwalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  jadwalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  jadwalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  matkulName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.gray800,
    flex: 1,
  },
  dayBadge: {
    backgroundColor: COLORS.blue50,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dayBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.blue600,
  },
  jadwalDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.gray500,
    fontWeight: '500',
    width: 70,
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.gray800,
    fontWeight: '400',
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray500,
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: COLORS.gray400,
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
    color: COLORS.gray500,
    marginTop: 12,
  },
});

export default JadwalKuliah;
