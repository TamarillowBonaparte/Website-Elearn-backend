import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS, GRADIENTS } from '../constants/colors';
import { API_URL } from '../config/api';
import SessionManager from '../utils/SessionManager';

export default function PresensiScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [presensiData, setPresensiData] = useState([]);
  const [stats, setStats] = useState({
    hadir: 0,
    izin: 0,
    alfa: 0
  });

  useEffect(() => {
    fetchPresensiData();
  }, []);

  const fetchPresensiData = async () => {
    try {
      const { mahasiswa, accessToken } = await SessionManager.getSession();
      
      if (!mahasiswa || !mahasiswa.id_mahasiswa) {
        console.error('Mahasiswa data not found');
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${API_URL}/presensi/mahasiswa/${mahasiswa.id_mahasiswa}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPresensiData(data);
        
        // Hitung statistik
        const hadir = data.filter(p => p.status === 'Hadir').length;
        const izin = data.filter(p => p.status === 'Izin').length;
        const alfa = data.filter(p => p.status === 'Alfa').length;
        
        setStats({ hadir, izin, alfa });
      } else {
        console.error('Failed to fetch presensi data');
      }
    } catch (error) {
      console.error('Error fetching presensi:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPresensiData();
  };

  const handlePresence = () => {
    navigation.navigate('FaceRecognition');
  };

  const formatDate = (dateString) => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const date = new Date(dateString);
    const dayName = days[date.getDay()];
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${dayName}, ${day}-${month}-${year}`;
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Hadir':
        return styles.statusHadir;
      case 'Izin':
        return styles.statusIzin;
      case 'Alfa':
        return styles.statusAlfa;
      case 'Belum Absen':
        return styles.statusBelumAbsen;
      default:
        return styles.statusBelumAbsen;
    }
  };

  const getStatusTextColor = (status) => {
    switch (status) {
      case 'Hadir':
        return { color: COLORS.green700 };
      case 'Izin':
        return { color: COLORS.yellow600 };
      case 'Alfa':
        return { color: COLORS.red600 };
      case 'Belum Absen':
        return { color: COLORS.gray600 };
      default:
        return { color: COLORS.gray600 };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <LinearGradient
          colors={GRADIENTS.green}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.header}>
            
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Presensi</Text>
            <View style={{ width: 40 }} />
          </View>
        </LinearGradient>

        {/* Content */}
        <View style={styles.content}>
          {/* Status Card */}
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Text style={styles.statusTitle}>Status Kehadiran</Text>
              <View style={styles.activeStatusBadge}>
                <Text style={styles.activeStatusText}>Aktif</Text>
              </View>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <LinearGradient
                colors={[COLORS.green50, '#DCFCE7']}
                style={styles.statItem}
              >
                <Text style={styles.statNumber}>{stats.hadir}</Text>
                <Text style={styles.statLabel}>Hadir</Text>
              </LinearGradient>

              <LinearGradient
                colors={[COLORS.yellow50, '#FEF3C7']}
                style={styles.statItem}
              >
                <Text style={[styles.statNumber, styles.statNumberYellow]}>{stats.izin}</Text>
                <Text style={styles.statLabel}>Izin</Text>
              </LinearGradient>

              <LinearGradient
                colors={[COLORS.red50, '#FEE2E2']}
                style={styles.statItem}
              >
                <Text style={[styles.statNumber, styles.statNumberRed]}>{stats.alfa}</Text>
                <Text style={styles.statLabel}>Alfa</Text>
              </LinearGradient>
            </View>
          </View>

          {/* History */}
          <Text style={styles.historyTitle}>Riwayat Presensi</Text>

          {/* Loading Indicator */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.green600} />
              <Text style={styles.loadingText}>Memuat data...</Text>
            </View>
          ) : presensiData.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={64} color={COLORS.gray400} />
              <Text style={styles.emptyText}>Belum ada riwayat presensi</Text>
            </View>
          ) : (
            presensiData.map((item, index) => (
              <View key={index} style={styles.attendanceCard}>
                <View style={styles.attendanceHeader}>
                  <Text style={styles.attendanceDate}>{formatDate(item.tanggal)}</Text>
                  <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
                    <Text style={[styles.statusText, getStatusTextColor(item.status)]}>
                      {item.status}
                    </Text>
                  </View>
                </View>
                <Text style={styles.attendanceSubject}>
                  {item.nama_mk} ({item.kelas})
                </Text>
                <View style={styles.attendanceInfo}>
                  <Text style={styles.attendanceTime}>
                    Pertemuan ke-{item.pertemuan_ke}
                  </Text>
                  {item.waktu_input && (
                    <Text style={styles.attendanceTime}>
                      {' • '} {item.waktu_input.substring(0, 5)}
                    </Text>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  content: {
    padding: 24,
  },
  statusCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.green100,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.gray800,
  },
  activeStatusBadge: {
    backgroundColor: COLORS.green100,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeStatusText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.green700,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.green200,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.green600,
    marginBottom: 4,
  },
  statNumberYellow: {
    color: COLORS.yellow600,
  },
  statNumberRed: {
    color: COLORS.red600,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.gray600,
  },
  presenceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  presenceButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.gray800,
    marginBottom: 16,
  },
  attendanceCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  attendanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  attendanceDate: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray700,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusHadir: {
    backgroundColor: COLORS.green100,
  },
  statusIzin: {
    backgroundColor: COLORS.yellow50,
  },
  statusAlfa: {
    backgroundColor: COLORS.red50,
  },
  statusBelumAbsen: {
    backgroundColor: COLORS.gray200,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  attendanceSubject: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.gray800,
    marginBottom: 4,
  },
  attendanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendanceTime: {
    fontSize: 12,
    color: COLORS.gray600,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.gray600,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 14,
    color: COLORS.gray600,
  },
  bottomSpacing: {
    height: 100,
  },
});