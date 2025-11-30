import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  TextInput,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ProfilePhotoManager from '../utils/ProfilePhotoManager';
import SessionManager from '../utils/SessionManager';

const { width } = Dimensions.get('window');

const ProfileScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets(); // biar tahu padding bottom dari device
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [mahasiswaData, setMahasiswaData] = useState(null);
  const [profilePhotoUri, setProfilePhotoUri] = useState(null);
  const [profileData, setProfileData] = useState({
    nama: '',
    kelas: '',
    noAbsen: '',
    nim: '',
    email: '',
  });

  // Load data user dari AsyncStorage
  useEffect(() => {
    loadUserData();
  }, []);

  // Reload foto saat screen focus (setelah update dari FaceCapture)
  useFocusEffect(
    React.useCallback(() => {
      if (profileData.nim) {
        loadProfilePhoto(profileData.nim);
      }
    }, [profileData.nim])
  );

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      const userDataString = await AsyncStorage.getItem('user');
      const mahasiswaDataString = await AsyncStorage.getItem('mahasiswa');

      console.log('📥 Loading user data from AsyncStorage');

      if (userDataString) {
        const user = JSON.parse(userDataString);
        setUserData(user);
        console.log('✅ User data loaded:', user);

        // Set data profile dari user
        setProfileData(prev => ({
          ...prev,
          nama: user.nama || '',
          email: user.email || '',
        }));
      }

      if (mahasiswaDataString) {
        const mahasiswa = JSON.parse(mahasiswaDataString);
        setMahasiswaData(mahasiswa);
        console.log('✅ Mahasiswa data loaded:', mahasiswa);

        // Set data profile dari mahasiswa
        setProfileData(prev => ({
          ...prev,
          nim: mahasiswa.nim || '',
          nama: mahasiswa.nama_mahasiswa || prev.nama,
          kelas: mahasiswa.kelas_nama || '', // Ambil nama kelas dari kelas_nama
        }));

        // Load foto profil
        await loadProfilePhoto(mahasiswa.nim);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'Gagal memuat data profil');
    } finally {
      setIsLoading(false);
    }
  };

  const loadProfilePhoto = async (nim) => {
    try {
      console.log('🖼️ Loading profile photo for NIM:', nim);
      
      // Gunakan ProfilePhotoManager untuk load foto
      const photoUri = await ProfilePhotoManager.loadProfilePhoto(nim);
      setProfilePhotoUri(photoUri);
    } catch (error) {
      console.error('❌ Error loading profile photo:', error);
      setProfilePhotoUri(null);
    }
  };

  const handleUpdatePhoto = () => {
    Alert.alert(
      'Update Foto Profil',
      'Apakah Anda ingin mengupdate foto dan embedding wajah Anda?',
      [
        {
          text: 'Batal',
          style: 'cancel',
        },
        {
          text: 'Update',
          onPress: () => {
            // Navigate ke FaceCapture dengan mode update
            navigation.navigate('TrainingFace', {
              userId: userData?.id_user,
              userName: userData?.nama,
              nim: profileData.nim,
              isUpdate: true, // Flag untuk update mode
            });
          },
        },
      ]
    );
  };

  const handleSave = () => {
    setIsEditing(false);
    Alert.alert('Berhasil', 'Profil berhasil diperbarui!');
  };

  const handleLogout = async () => {
    Alert.alert(
      'Keluar Aplikasi',
      'Apakah Anda yakin ingin keluar?',
      [
        {
          text: 'Batal',
          style: 'cancel',
        },
        {
          text: 'Keluar',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🚪 Logging out...');
              
              // Hapus session menggunakan SessionManager
              await SessionManager.clearSession();
              
              console.log('✅ Logout berhasil');
              
              // Reset navigation ke Login screen
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              console.error('❌ Error logging out:', error);
              Alert.alert('Error', 'Gagal logout. Silakan coba lagi.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Tampilkan loading saat data sedang dimuat
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0083FD" />
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profil Saya</Text>
          <View style={styles.editButton} />
        </View>

        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#0083FD" />
          <Text style={{ marginTop: 10, color: '#666' }}>Memuat data profil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0083FD" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profil Saya</Text>
      </View>

      {/* ScrollView utama */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <TouchableOpacity 
            style={styles.profileImageContainer}
            onPress={handleUpdatePhoto}
            activeOpacity={0.7}
          >
            <View style={styles.profileImage}>
              {profilePhotoUri ? (
                <Image
                  source={{ uri: profilePhotoUri }}
                  style={styles.profilePhotoImage}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.profileImageText}>
                  {profileData.nama ? profileData.nama.substring(0, 2).toUpperCase() : 'RF'}
                </Text>
              )}
            </View>
            <View style={styles.cameraIconBadge}>
              <Text style={styles.cameraIconText}>📷</Text>
            </View>
          </TouchableOpacity>

          <Text style={styles.profileName}>{profileData.nama || 'Nama Tidak Tersedia'}</Text>
          <Text style={styles.profileNim}>NIM: {profileData.nim || '-'}</Text>

          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>Mahasiswa Aktif</Text>
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Informasi Personal</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Text>👤</Text>
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Nama Lengkap</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.editInput}
                    value={profileData.nama}
                    onChangeText={text => setProfileData({ ...profileData, nama: text })}
                  />
                ) : (
                  <Text style={styles.infoValue}>{profileData.nama}</Text>
                )}
              </View>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Text>🎓</Text>
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Kelas</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.editInput}
                    value={profileData.kelas}
                    onChangeText={text => setProfileData({ ...profileData, kelas: text })}
                  />
                ) : (
                  <Text style={styles.infoValue}>{profileData.kelas}</Text>
                )}
              </View>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Text>📧</Text>
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.editInput}
                    value={profileData.email}
                    onChangeText={text => setProfileData({ ...profileData, email: text })}
                  />
                ) : (
                  <Text style={styles.infoValue}>{profileData.email}</Text>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Save Button */}
        {isEditing && (
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Simpan Perubahan</Text>
          </TouchableOpacity>
        )}

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>Keluar dari Aplikasi</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.versionText}>Elearn v1.0 Alpha</Text>
          <Text style={styles.copyrightText}>©2025 Team Bergema. All rights reserved.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },

  // Header
  header: {
    backgroundColor: '#0083FD',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    elevation: 8,
    shadowColor: '#0083FD',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  editButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIcon: {
    fontSize: 18,
    color: '#FFFFFF',
  },

  content: {
    flex: 1,
    paddingHorizontal: 20,
  },

  // Profile Card
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 25,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    backgroundColor: '#0083FD',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    overflow: 'hidden',
  },
  profilePhotoImage: {
    width: '100%',
    height: '100%',
  },
  profileImageText: {
    fontSize: 36,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    backgroundColor: '#0083FD',
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  cameraIconText: {
    fontSize: 16,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 20,
    height: 20,
    backgroundColor: '#10B981',
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 5,
    textAlign: 'center',
  },
  profileNim: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 15,
  },
  statusBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    color: '#166534',
    fontSize: 14,
    fontWeight: '600',
  },

  // Info
  infoSection: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 15,
    paddingLeft: 5,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '600',
  },
  editInput: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '600',
    borderBottomWidth: 1,
    borderBottomColor: '#0083FD',
    paddingBottom: 4,
  },

  // Buttons
  saveButton: {
    backgroundColor: '#10B981',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 15,
    elevation: 5,
    shadowColor: '#10B981',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  logoutButton: {
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  logoutText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '600',
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 5,
  },
  copyrightText: {
    fontSize: 12,
    color: '#94A3B8',
  },
});
