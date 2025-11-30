import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * ProfilePhotoManager
 * Utility untuk manage foto profil
 * Foto disimpan di: Android - ExternalDirectoryPath/foto_profile
 *                   iOS - DocumentDirectoryPath/foto_profile
 */

// Path ke folder foto_profile
const PROFILE_PHOTOS_FOLDER = RNFS.ExternalDirectoryPath ?
    `${RNFS.ExternalDirectoryPath}/foto_profile` // Android
    :
    `${RNFS.DocumentDirectoryPath}/foto_profile`; // iOS

class ProfilePhotoManager {
    /**
     * Inisialisasi folder untuk foto profil
     */
    static async initializeFolder() {
        try {
            const folderExists = await RNFS.exists(PROFILE_PHOTOS_FOLDER);
            if (!folderExists) {
                await RNFS.mkdir(PROFILE_PHOTOS_FOLDER);
                console.log('📁 Profile photos folder created');
            }
            return true;
        } catch (error) {
            console.error('❌ Error initializing profile photos folder:', error);
            return false;
        }
    }

    /**
     * Simpan foto profil ke local storage
     * @param {string} sourcePath - Path foto sumber
     * @param {string} nim - NIM mahasiswa (nama file)
     * @returns {Promise<string|null>} - Path foto yang tersimpan atau null
     */
    static async saveProfilePhoto(sourcePath, nim) {
        try {
            console.log('💾 Saving profile photo for NIM:', nim);

            // Pastikan folder ada
            await this.initializeFolder();

            // Tentukan path tujuan
            const destPath = `${PROFILE_PHOTOS_FOLDER}/${nim}.jpg`;

            // Copy foto ke folder tujuan
            await RNFS.copyFile(sourcePath, destPath);
            console.log('✅ Photo saved to:', destPath);

            // Simpan path ke AsyncStorage untuk referensi
            await AsyncStorage.setItem(`profile_photo_${nim}`, destPath);
            console.log('✅ Photo path saved to AsyncStorage');

            return destPath;
        } catch (error) {
            console.error('❌ Error saving profile photo:', error);
            return null;
        }
    }

    /**
     * Load foto profil dari local storage
     * @param {string} nim - NIM mahasiswa
     * @returns {Promise<string|null>} - URI foto atau null
     */
    static async loadProfilePhoto(nim) {
        try {
            console.log('🖼️ Loading profile photo for NIM:', nim);

            const photoPath = `${PROFILE_PHOTOS_FOLDER}/${nim}.jpg`;
            const exists = await RNFS.exists(photoPath);

            if (exists) {
                console.log('✅ Profile photo found:', photoPath);
                return `file://${photoPath}`;
            } else {
                console.log('ℹ️ No profile photo found for:', nim);
                return null;
            }
        } catch (error) {
            console.error('❌ Error loading profile photo:', error);
            return null;
        }
    }

    /**
     * Hapus foto profil dari local storage
     * @param {string} nim - NIM mahasiswa
     * @returns {Promise<boolean>} - Success status
     */
    static async deleteProfilePhoto(nim) {
        try {
            console.log('🗑️ Deleting profile photo for NIM:', nim);

            const photoPath = `${PROFILE_PHOTOS_FOLDER}/${nim}.jpg`;
            const exists = await RNFS.exists(photoPath);

            if (exists) {
                await RNFS.unlink(photoPath);
                await AsyncStorage.removeItem(`profile_photo_${nim}`);
                console.log('✅ Profile photo deleted');
                return true;
            } else {
                console.log('ℹ️ No photo to delete');
                return false;
            }
        } catch (error) {
            console.error('❌ Error deleting profile photo:', error);
            return false;
        }
    }

    /**
     * Cek apakah foto profil ada
     * @param {string} nim - NIM mahasiswa
     * @returns {Promise<boolean>}
     */
    static async hasProfilePhoto(nim) {
        try {
            const photoPath = `${PROFILE_PHOTOS_FOLDER}/${nim}.jpg`;
            return await RNFS.exists(photoPath);
        } catch (error) {
            console.error('❌ Error checking profile photo:', error);
            return false;
        }
    }

    /**
     * Get info tentang foto profil
     * @param {string} nim - NIM mahasiswa
     * @returns {Promise<Object|null>} - Info foto atau null
     */
    static async getProfilePhotoInfo(nim) {
        try {
            const photoPath = `${PROFILE_PHOTOS_FOLDER}/${nim}.jpg`;
            const exists = await RNFS.exists(photoPath);

            if (!exists) {
                return null;
            }

            const stat = await RNFS.stat(photoPath);
            return {
                path: photoPath,
                uri: `file://${photoPath}`,
                size: stat.size,
                modifiedDate: stat.mtime,
                exists: true,
            };
        } catch (error) {
            console.error('❌ Error getting profile photo info:', error);
            return null;
        }
    }

    /**
     * Hapus semua foto profil (untuk cleanup)
     * @returns {Promise<boolean>}
     */
    static async clearAllPhotos() {
        try {
            console.log('🗑️ Clearing all profile photos...');

            const folderExists = await RNFS.exists(PROFILE_PHOTOS_FOLDER);
            if (folderExists) {
                await RNFS.unlink(PROFILE_PHOTOS_FOLDER);
                console.log('✅ All profile photos cleared');
            }

            return true;
        } catch (error) {
            console.error('❌ Error clearing profile photos:', error);
            return false;
        }
    }
}

export default ProfilePhotoManager;