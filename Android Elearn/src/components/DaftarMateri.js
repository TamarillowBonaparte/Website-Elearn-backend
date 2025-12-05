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
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { API_URL } from '../config/api';

const DaftarMateri = ({ navigation, route }) => {
  const [mahasiswaData, setMahasiswaData] = useState(null);
  const [materiList, setMateriList] = useState([]);
  const [readMateriIds, setReadMateriIds] = useState(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMahasiswaData();
  }, []);

  const fetchReadMateri = async (id_mahasiswa) => {
    try {
      console.log(`🔄 Fetching skor materi for mahasiswa ${id_mahasiswa}`);
      const token = await AsyncStorage.getItem('access_token');
      const response = await axios.get(`${API_URL}/skor-materi/mahasiswa/${id_mahasiswa}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
        },
      });

      if (response.data && Array.isArray(response.data)) {
        const ids = new Set(response.data.map((item) => item.id_materi));
        console.log(`✅ Read materi IDs loaded: ${ids.size}`);
        setReadMateriIds(ids);
      } else {
        console.warn('⚠️ Response skor materi is not an array:', response.data);
        setReadMateriIds(new Set());
      }
    } catch (error) {
      console.error('❌ Error fetching skor materi:', error);
      setReadMateriIds(new Set());
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (mahasiswaData?.id_kelas) {
        fetchMateriData(mahasiswaData.id_kelas);
      }
      if (mahasiswaData?.id_mahasiswa) {
        fetchReadMateri(mahasiswaData.id_mahasiswa);
      }
    }, [mahasiswaData])
  );

  const loadMahasiswaData = async () => {
    try {
      const mahasiswa = await AsyncStorage.getItem('mahasiswa');
      if (mahasiswa) {
        const parsedMahasiswa = JSON.parse(mahasiswa);
        setMahasiswaData(parsedMahasiswa);
        if (parsedMahasiswa.id_kelas) {
          fetchMateriData(parsedMahasiswa.id_kelas);
        }
        if (parsedMahasiswa.id_mahasiswa) {
          fetchReadMateri(parsedMahasiswa.id_mahasiswa);
        }
      }
    } catch (error) {
      console.error('❌ Error loading mahasiswa data:', error);
      setLoading(false);
    }
  };

  const fetchMateriData = async (id_kelas) => {
    try {
      console.log(`🔄 Fetching all materi for id_kelas: ${id_kelas}`);
      const token = await AsyncStorage.getItem('access_token');
      const response = await axios.get(`${API_URL}/materi/?id_kelas=${id_kelas}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
        },
      });

      if (response.data && Array.isArray(response.data)) {
        console.log(`✅ Fetched ${response.data.length} materi`);
        setMateriList(response.data);
      } else {
        console.warn('⚠️ Response data is not an array:', response.data);
        setMateriList([]);
      }
    } catch (error) {
      console.error('❌ Error fetching materi:', error);
      Alert.alert('Error', 'Gagal memuat data materi');
      setMateriList([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    if (mahasiswaData && mahasiswaData.id_kelas) {
      fetchMateriData(mahasiswaData.id_kelas);
      if (mahasiswaData.id_mahasiswa) {
        fetchReadMateri(mahasiswaData.id_mahasiswa);
      }
    } else {
      setRefreshing(false);
    }
  };

  const formatTanggalUpload = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('id-ID', options);
  };

  const handleMateriPress = (materi) => {
    const alreadyRead = readMateriIds.has(materi.id_materi);
    if (materi.file_pdf) {
      navigation.navigate('MateriEyeTracking', {
        materi: {
          id_materi: materi.id_materi,
          id: materi.id_materi,
          title: materi.judul,
          subtitle: `${materi.kode_mk} - Minggu ${materi.minggu}`,
        },
        id_mahasiswa: mahasiswaData?.id_mahasiswa,
        serverUrl: API_URL,
        useRemoteServer: true,
        skipScore: alreadyRead,
      });
    } else {
      Alert.alert('Info', 'File PDF tidak tersedia untuk materi ini');
    }
  };

  const groupedReadMateri = materiList
    .filter((m) => readMateriIds.has(m.id_materi))
    .reduce((acc, materi) => {
      const key = `${materi.kode_mk} - ${materi.nama_mk || materi.kode_mk}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(materi);
      return acc;
    }, {});

  const totalUnread = materiList.filter((m) => !readMateriIds.has(m.id_materi)).length;
  const totalRead = materiList.length - totalUnread;

  const renderMateriGroups = (groups, isReadSection = false) => (
    Object.keys(groups).map((matkul) => (
      <View key={`${matkul}-${isReadSection ? 'read' : 'unread'}`} style={styles.matkulSection}>
        <View style={styles.matkulHeader}>
          <Ionicons name="book" size={20} color="#1E40AF" />
          <Text style={styles.matkulTitle}>{matkul}</Text>
          {isReadSection && (
            <View style={styles.readBadge}>
              <Text style={styles.readBadgeText}>Sudah dibaca</Text>
            </View>
          )}
        </View>

        {groups[matkul]
          .sort((a, b) => a.minggu - b.minggu)
          .map((materi, index) => (
            <TouchableOpacity
              key={materi.id_materi ?? `${matkul}-${index}`}
              style={styles.materiCard}
              onPress={() => handleMateriPress(materi)}
            >
              <View style={styles.materiMain}>
                <View style={styles.materiIconContainer}>
                  <Ionicons name="document-text" size={24} color="#0C4A6E" />
                </View>

                <View style={styles.materiContent}>
                  <View style={styles.materiHeader}>
                    <Text style={styles.materiTitle} numberOfLines={2}>
                      {materi.judul}
                    </Text>
                    <View style={styles.mingguBadge}>
                      <Text style={styles.mingguText}>Minggu {materi.minggu}</Text>
                    </View>
                  </View>

                  {materi.deskripsi && (
                    <Text style={styles.materiDescription} numberOfLines={2}>
                      {materi.deskripsi}
                    </Text>
                  )}

                  <View style={styles.materiFooter}>
                    <View style={styles.materiTags}>
                      {materi.nama_dosen && (
                        <View style={styles.dosenTag}>
                          <Ionicons name="person" size={12} color="#1E40AF" />
                          <Text style={styles.dosenText} numberOfLines={1}>
                            {materi.nama_dosen}
                          </Text>
                        </View>
                      )}

                      {materi.file_pdf && (
                        <View style={styles.pdfTag}>
                          <Ionicons name="document" size={12} color="#1E40AF" />
                          <Text style={styles.pdfText}>PDF</Text>
                        </View>
                      )}

                      <View style={isReadSection ? styles.readTag : styles.unreadTag}>
                        <Text style={isReadSection ? styles.readTagText : styles.unreadTagText}>
                          {isReadSection ? 'Sudah dibaca' : 'Belum dibaca'}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.dateText}>
                      {formatTanggalUpload(materi.tanggal_upload)}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.arrowButton}
                  onPress={() => handleMateriPress(materi)}
                >
                  <Ionicons name="chevron-forward" size={20} color="#1E40AF" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
      </View>
    ))
  );

  const groupedUnreadMateri = materiList
    .filter((m) => !readMateriIds.has(m.id_materi))
    .reduce((acc, materi) => {
      const key = `${materi.kode_mk} - ${materi.nama_mk || materi.kode_mk}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(materi);
      return acc;
    }, {});

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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Daftar Materi</Text>
            <Text style={styles.headerSubtitle}>
              {totalUnread} belum dibaca • {totalRead} selesai
            </Text>
          </View>
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E40AF" />
          <Text style={styles.loadingText}>Memuat materi...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {Object.keys(groupedUnreadMateri).length > 0 ? (
            <>
              <Text style={styles.sectionLabel}>Belum Dibaca</Text>
              {renderMateriGroups(groupedUnreadMateri, false)}
            </>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="folder-open-outline" size={64} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>Tidak ada materi baru</Text>
              <Text style={styles.emptyText}>
                Semua materi di kelas Anda sudah dibaca
              </Text>
            </View>
          )}

          {Object.keys(groupedReadMateri).length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { marginTop: 12 }]}>Sudah Dibaca</Text>
              {renderMateriGroups(groupedReadMateri, true)}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F9FF',
  },
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
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    color: '#DBEAFE',
    fontSize: 14,
    marginTop: 4,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#1E40AF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  matkulSection: {
    marginBottom: 24,
  },
  matkulHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  readBadge: {
    marginLeft: 8,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  readBadgeText: {
    fontSize: 11,
    color: '#15803D',
    fontWeight: '700',
  },
  matkulTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E3A8A',
    marginLeft: 8,
    flex: 1,
  },
  materiCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginBottom: 14,
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
  materiMain: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'flex-start',
  },
  materiIconContainer: {
    backgroundColor: '#DBEAFE',
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  materiContent: {
    flex: 1,
  },
  materiHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  materiTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E3A8A',
    letterSpacing: 0.2,
    flex: 1,
  },
  mingguBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  mingguText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E40AF',
  },
  materiDescription: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 12,
  },
  materiFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  materiTags: {
    flexDirection: 'row',
    gap: 6,
    flex: 1,
    flexWrap: 'wrap',
  },
  dosenTag: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '60%',
  },
  dosenText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E40AF',
  },
  pdfTag: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pdfText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E40AF',
  },
  readTag: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  readTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  unreadTag: {
    backgroundColor: '#FFE4E6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  unreadTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#BE123C',
  },
  dateText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  arrowButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E3A8A',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E3A8A',
    marginBottom: 8,
    marginLeft: 4,
  },
});

export default DaftarMateri;
