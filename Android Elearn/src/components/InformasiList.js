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
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { API_URL } from '../config/api';

const InformasiList = ({ navigation }) => {
  const [informasiList, setInformasiList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    loadUserData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      console.log('📱 InformasiList focused - fetching fresh data...');
      fetchInformasi();
    }, [])
  );

  const loadUserData = async () => {
    try {
      const user = await AsyncStorage.getItem('user');
      if (user) {
        const parsedUser = JSON.parse(user);
        setUserData(parsedUser);
        console.log('👤 User role:', parsedUser.role);
      }
    } catch (error) {
      console.error('❌ Error loading user data:', error);
    }
  };

  const fetchInformasi = async () => {
    try {
      console.log('🔄 Fetching informasi...');
      const token = await AsyncStorage.getItem('access_token');
      
      if (!token) {
        Alert.alert('Error', 'Token tidak ditemukan. Silakan login kembali.');
        navigation.navigate('Login');
        return;
      }

      const response = await axios.get(`${API_URL}/api/informasi/mobile/list`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
        },
      });

      if (response.data && Array.isArray(response.data)) {
        console.log(`✅ Fetched ${response.data.length} informasi`);
        setInformasiList(response.data);
      } else {
        console.warn('⚠️ Response data is not an array:', response.data);
        setInformasiList([]);
      }
    } catch (error) {
      console.error('❌ Error fetching informasi:', error);
      console.error('Error response:', error.response?.data);
      
      if (error.response?.status === 401) {
        Alert.alert('Sesi Berakhir', 'Silakan login kembali.', [
          { text: 'OK', onPress: () => navigation.navigate('Login') }
        ]);
      } else {
        Alert.alert('Error', 'Gagal memuat informasi. Silakan coba lagi.');
      }
      setInformasiList([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchInformasi();
  };

  const handleInformasiPress = (informasi) => {
    console.log('📌 Opening informasi detail:', informasi.id);
    navigation.navigate('InformasiDetail', { informasiId: informasi.id });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Oct', 'Nov', 'Des'];
    
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const getPriorityBadge = (priority) => {
    if (priority >= 80) {
      return { label: 'Penting', color: '#EF4444', bgColor: '#FEE2E2' };
    } else if (priority >= 50) {
      return { label: 'Sedang', color: '#F59E0B', bgColor: '#FEF3C7' };
    } else {
      return { label: 'Info', color: '#0EA5E9', bgColor: '#E0F2FE' };
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
            <Text style={styles.headerTitle}>Informasi</Text>
            <View style={{ width: 40 }} />
          </View>
        </LinearGradient>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Memuat informasi...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
          <Text style={styles.headerTitle}>Informasi</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />
        }
      >
        {informasiList.length > 0 ? (
          informasiList.map((informasi, index) => {
            const priorityBadge = getPriorityBadge(informasi.priority);
            
            return (
              <TouchableOpacity
                key={informasi.id ?? index}
                style={styles.informasiCard}
                onPress={() => handleInformasiPress(informasi)}
                activeOpacity={0.7}
              >
                {/* Priority Badge */}
                <View style={[styles.priorityBadge, { backgroundColor: priorityBadge.bgColor }]}>
                  <Text style={[styles.priorityText, { color: priorityBadge.color }]}>
                    {priorityBadge.label}
                  </Text>
                </View>

                <View style={styles.cardHeader}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="information-circle" size={28} color="#2563EB" />
                  </View>
                  
                  <View style={styles.cardHeaderRight}>
                    <Text style={styles.dateText}>
                      <Ionicons name="calendar-outline" size={12} color="#64748B" />
                      {' '}{formatDate(informasi.created_at)}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardContent}>
                  <Text style={styles.informasiTitle} numberOfLines={2}>
                    {informasi.judul}
                  </Text>
                  
                  <Text style={styles.informasiDescription} numberOfLines={3}>
                    {truncateText(informasi.deskripsi, 150)}
                  </Text>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.readMoreText}>
                    Lihat Selengkapnya
                    <Ionicons name="chevron-forward" size={14} color="#2563EB" />
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="information-circle-outline" size={80} color="#CBD5E1" />
            </View>
            <Text style={styles.emptyTitle}>Belum Ada Informasi</Text>
            <Text style={styles.emptyText}>
              Saat ini belum ada informasi yang tersedia untuk Anda.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default InformasiList;

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
  informasiCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E0F2FE',
    position: 'relative',
  },
  priorityBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconContainer: {
    backgroundColor: '#DBEAFE',
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeaderRight: {
    flex: 1,
    alignItems: 'flex-start',
    marginLeft: 12,
    paddingRight: 80,
  },
  dateText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  cardContent: {
    marginBottom: 14,
  },
  informasiTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E3A8A',
    marginBottom: 8,
    letterSpacing: 0.2,
    lineHeight: 24,
  },
  informasiDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    fontWeight: '500',
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#E0F2FE',
    paddingTop: 12,
    alignItems: 'flex-end',
  },
  readMoreText: {
    fontSize: 13,
    color: '#2563EB',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E3A8A',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
});
