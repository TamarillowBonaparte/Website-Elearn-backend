import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * SessionManager - Mengelola session JWT dan data user
 */

export const SessionManager = {
    /**
     * Simpan session login
     * @param {string} accessToken - JWT access token dari backend
     * @param {object} user - Data user dari backend
     * @param {object} mahasiswa - Data mahasiswa (optional, hanya untuk role mahasiswa)
     */
    saveSession: async (accessToken, user, mahasiswa = null) => {
        try {
            console.log('💾 Saving session...');

            // Simpan access token
            await AsyncStorage.setItem('access_token', accessToken);
            console.log('✅ Access token saved');

            // Simpan user data
            await AsyncStorage.setItem('user', JSON.stringify(user));
            console.log('✅ User data saved');

            // Simpan mahasiswa data jika ada
            if (mahasiswa) {
                await AsyncStorage.setItem('mahasiswa', JSON.stringify(mahasiswa));
                console.log('✅ Mahasiswa data saved');
            }

            return true;
        } catch (error) {
            console.error('❌ Error saving session:', error);
            throw new Error('Gagal menyimpan session');
        }
    },

    /**
     * Ambil session yang tersimpan
     * @returns {object} { accessToken, user, mahasiswa }
     */
    getSession: async () => {
        try {
            const accessToken = await AsyncStorage.getItem('access_token');
            const userString = await AsyncStorage.getItem('user');
            const mahasiswaString = await AsyncStorage.getItem('mahasiswa');

            const user = userString ? JSON.parse(userString) : null;
            const mahasiswa = mahasiswaString ? JSON.parse(mahasiswaString) : null;

            return {
                accessToken,
                user,
                mahasiswa
            };
        } catch (error) {
            console.error('❌ Error getting session:', error);
            return {
                accessToken: null,
                user: null,
                mahasiswa: null
            };
        }
    },

    /**
     * Cek apakah user sudah login (session valid)
     * @returns {boolean}
     */
    isLoggedIn: async () => {
        try {
            const token = await AsyncStorage.getItem('access_token');
            const user = await AsyncStorage.getItem('user');
            return !!(token && user);
        } catch (error) {
            console.error('❌ Error checking login status:', error);
            return false;
        }
    },

    /**
     * Hapus session (logout)
     */
    clearSession: async () => {
        try {
            console.log('🗑️ Clearing session...');

            await AsyncStorage.removeItem('access_token');
            await AsyncStorage.removeItem('user');
            await AsyncStorage.removeItem('mahasiswa');

            console.log('✅ Session cleared successfully');
            return true;
        } catch (error) {
            console.error('❌ Error clearing session:', error);
            throw new Error('Gagal menghapus session');
        }
    },

    /**
     * Update access token (refresh token)
     * @param {string} newToken 
     */
    updateToken: async (newToken) => {
        try {
            await AsyncStorage.setItem('access_token', newToken);
            console.log('✅ Token updated');
            return true;
        } catch (error) {
            console.error('❌ Error updating token:', error);
            throw new Error('Gagal update token');
        }
    },

    /**
     * Ambil hanya access token
     * @returns {string|null}
     */
    getToken: async () => {
        try {
            return await AsyncStorage.getItem('access_token');
        } catch (error) {
            console.error('❌ Error getting token:', error);
            return null;
        }
    },

    /**
     * Ambil hanya user data
     * @returns {object|null}
     */
    getUser: async () => {
        try {
            const userString = await AsyncStorage.getItem('user');
            return userString ? JSON.parse(userString) : null;
        } catch (error) {
            console.error('❌ Error getting user:', error);
            return null;
        }
    },

    /**
     * Ambil hanya mahasiswa data
     * @returns {object|null}
     */
    getMahasiswa: async () => {
        try {
            const mahasiswaString = await AsyncStorage.getItem('mahasiswa');
            return mahasiswaString ? JSON.parse(mahasiswaString) : null;
        } catch (error) {
            console.error('❌ Error getting mahasiswa:', error);
            return null;
        }
    },
};

export default SessionManager;