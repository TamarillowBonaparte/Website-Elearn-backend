import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { API_URL } from '../config/api';

const { width } = Dimensions.get('window');

const InformasiDetail = ({ route, navigation }) => {
  const { informasiId } = route.params;
  const [informasi, setInformasi] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInformasiDetail();
  }, [informasiId]);

  const fetchInformasiDetail = async () => {
    try {
      console.log(`🔄 Fetching informasi detail for ID: ${informasiId}`);
      const token = await AsyncStorage.getItem('access_token');
      
      if (!token) {
        Alert.alert('Error', 'Token tidak ditemukan. Silakan login kembali.');
        navigation.navigate('Login');
        return;
      }

      const response = await axios.get(
        `${API_URL}/api/informasi/mobile/${informasiId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Cache-Control': 'no-cache',
          },
        }
      );

      if (response.data) {
        console.log('✅ Informasi detail fetched successfully');
        setInformasi(response.data);
      } else {
        Alert.alert('Error', 'Data informasi tidak ditemukan.');
        navigation.goBack();
      }
    } catch (error) {
      console.error('❌ Error fetching informasi detail:', error);
      console.error('Error response:', error.response?.data);
      
      if (error.response?.status === 401) {
        Alert.alert('Sesi Berakhir', 'Silakan login kembali.', [
          { text: 'OK', onPress: () => navigation.navigate('Login') }
        ]);
      } else if (error.response?.status === 403) {
        Alert.alert('Akses Ditolak', 'Anda tidak memiliki akses untuk melihat informasi ini.', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else if (error.response?.status === 404) {
        Alert.alert('Tidak Ditemukan', 'Informasi tidak ditemukan atau sudah tidak aktif.', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Error', 'Gagal memuat detail informasi. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes} WIB`;
  };

  const getPriorityInfo = (priority) => {
    if (priority >= 80) {
      return { 
        label: 'Sangat Penting', 
        icon: 'alert-circle',
        color: '#EF4444', 
        bgColor: '#FEE2E2' 
      };
    } else if (priority >= 50) {
      return { 
        label: 'Penting', 
        icon: 'warning',
        color: '#F59E0B', 
        bgColor: '#FEF3C7' 
      };
    } else {
      return { 
        label: 'Informasi', 
        icon: 'information-circle',
        color: '#0EA5E9', 
        bgColor: '#E0F2FE' 
      };
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1E40AF" />
        <LinearGradient
          colors={['#1E40AF', '#2563EB', '#3B82F6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Detail Informasi</Text>
            <View style={{ width: 40 }} />
          </View>
        </LinearGradient>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Memuat detail informasi...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!informasi) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1E40AF" />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={80} color="#CBD5E1" />
          <Text style={styles.errorText}>Informasi tidak ditemukan</Text>
        </View>
      </SafeAreaView>
    );
  }

  const priorityInfo = getPriorityInfo(informasi.priority);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E40AF" />
      
      {/* Header */}
      <LinearGradient
        colors={['#1E40AF', '#2563EB', '#3B82F6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detail Informasi</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        {/* Priority Badge */}
        <View style={[styles.priorityBanner, { backgroundColor: priorityInfo.bgColor }]}>
          <Ionicons name={priorityInfo.icon} size={24} color={priorityInfo.color} />
          <Text style={[styles.priorityBannerText, { color: priorityInfo.color }]}>
            {priorityInfo.label}
          </Text>
        </View>

        {/* Main Card */}
        <View style={styles.mainCard}>
          {/* Title */}
          <Text style={styles.title}>{informasi.judul}</Text>

          {/* Meta Info */}
          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={16} color="#64748B" />
              <Text style={styles.metaText}>{formatDate(informasi.created_at)}</Text>
            </View>
            
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={16} color="#64748B" />
              <Text style={styles.metaText}>{formatTime(informasi.created_at)}</Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Image (if exists) */}
          {informasi.gambar_url && (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: `${API_URL}${informasi.gambar_url}` }}
                style={styles.image}
                resizeMode="cover"
              />
            </View>
          )}

          {/* Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionLabel}>
              <Ionicons name="document-text" size={18} color="#1E3A8A" />
              {' '}Deskripsi
            </Text>
            <Text style={styles.descriptionText}>{informasi.deskripsi}</Text>
          </View>

          {/* Date Range (if exists) */}
          {(informasi.tanggal_mulai || informasi.tanggal_selesai) && (
            <View style={styles.dateRangeContainer}>
              <Text style={styles.dateRangeLabel}>
                <Ionicons name="calendar" size={18} color="#1E3A8A" />
                {' '}Periode Informasi
              </Text>
              
              {informasi.tanggal_mulai && (
                <View style={styles.dateRangeItem}>
                  <Text style={styles.dateRangeItemLabel}>Mulai:</Text>
                  <Text style={styles.dateRangeItemValue}>
                    {formatDate(informasi.tanggal_mulai)}
                  </Text>
                </View>
              )}
              
              {informasi.tanggal_selesai && (
                <View style={styles.dateRangeItem}>
                  <Text style={styles.dateRangeItemLabel}>Berakhir:</Text>
                  <Text style={styles.dateRangeItemValue}>
                    {formatDate(informasi.tanggal_selesai)}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Footer Info */}
          <View style={styles.footerInfo}>
            <View style={styles.footerItem}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.footerText}>Informasi Aktif</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default InformasiDetail;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F9FF',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  priorityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 16,
    gap: 10,
  },
  priorityBannerText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E3A8A',
    marginBottom: 16,
    lineHeight: 32,
    letterSpacing: 0.3,
  },
  metaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  audienceContainer: {
    marginBottom: 16,
  },
  audienceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 6,
  },
  audienceText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0F2FE',
    marginVertical: 20,
  },
  imageContainer: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  image: {
    width: '100%',
    height: 200,
  },
  descriptionContainer: {
    marginBottom: 20,
  },
  descriptionLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E3A8A',
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  descriptionText: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 24,
    fontWeight: '500',
    textAlign: 'justify',
  },
  dateRangeContainer: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  dateRangeLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E3A8A',
    marginBottom: 12,
  },
  dateRangeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  dateRangeItemLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  dateRangeItemValue: {
    fontSize: 14,
    color: '#1E3A8A',
    fontWeight: '700',
  },
  footerInfo: {
    borderTopWidth: 1,
    borderTopColor: '#E0F2FE',
    paddingTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    color: '#64748B',
    fontWeight: '700',
    textAlign: 'center',
  },
});
