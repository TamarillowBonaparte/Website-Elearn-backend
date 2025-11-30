import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Utility functions untuk debugging AsyncStorage
 */

/**
 * Log semua data yang ada di AsyncStorage
 */
export const logAllAsyncStorageData = async () => {
    try {
        console.log('=== AsyncStorage Debug ===');

        const keys = ['access_token', 'user', 'mahasiswa'];

        for (const key of keys) {
            const value = await AsyncStorage.getItem(key);

            if (value) {
                console.log(`\n✅ ${key}:`);

                if (key === 'access_token') {
                    // Jangan tampilkan full token, hanya sebagian
                    console.log(`   ${value.substring(0, 50)}...`);
                } else {
                    // Parse dan tampilkan JSON dengan format yang rapi
                    try {
                        const parsed = JSON.parse(value);
                        console.log(JSON.stringify(parsed, null, 2));
                    } catch (e) {
                        console.log(`   ${value}`);
                    }
                }
            } else {
                console.log(`\n❌ ${key}: NOT FOUND`);
            }
        }

        console.log('\n=== End AsyncStorage Debug ===\n');
    } catch (error) {
        console.error('Error logging AsyncStorage data:', error);
    }
};

/**
 * Verifikasi data mahasiswa lengkap atau tidak
 */
export const verifyMahasiswaData = async () => {
    try {
        console.log('=== Verifikasi Data Mahasiswa ===');

        const mahasiswaString = await AsyncStorage.getItem('mahasiswa');

        if (!mahasiswaString) {
            console.log('❌ Data mahasiswa tidak ditemukan di AsyncStorage');
            return false;
        }

        const mahasiswa = JSON.parse(mahasiswaString);

        const requiredFields = ['id_mahasiswa', 'nim', 'nama_mahasiswa', 'user_id'];
        let isValid = true;

        console.log('Checking required fields:');
        requiredFields.forEach(field => {
            if (mahasiswa[field]) {
                console.log(`✅ ${field}: ${mahasiswa[field]}`);
            } else {
                console.log(`❌ ${field}: MISSING`);
                isValid = false;
            }
        });

        // Optional fields
        console.log('\nOptional fields:');
        console.log(`   id_kelas: ${mahasiswa.id_kelas || 'not set'}`);

        console.log(`\nStatus: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
        console.log('=== End Verifikasi ===\n');

        return isValid;
    } catch (error) {
        console.error('Error verifying mahasiswa data:', error);
        return false;
    }
};

/**
 * Clear semua data login dari AsyncStorage
 * HANYA untuk debugging/testing
 */
export const clearLoginData = async () => {
    try {
        console.log('🗑️ Clearing login data from AsyncStorage...');

        await AsyncStorage.removeItem('access_token');
        await AsyncStorage.removeItem('user');
        await AsyncStorage.removeItem('mahasiswa');

        console.log('✅ Login data cleared');
        return true;
    } catch (error) {
        console.error('Error clearing login data:', error);
        return false;
    }
};

/**
 * Get data mahasiswa dari AsyncStorage
 */
export const getMahasiswaData = async () => {
    try {
        const mahasiswaString = await AsyncStorage.getItem('mahasiswa');

        if (!mahasiswaString) {
            console.warn('⚠️ Data mahasiswa tidak ditemukan');
            return null;
        }

        return JSON.parse(mahasiswaString);
    } catch (error) {
        console.error('Error getting mahasiswa data:', error);
        return null;
    }
};

/**
 * Get user data dari AsyncStorage
 */
export const getUserData = async () => {
    try {
        const userString = await AsyncStorage.getItem('user');

        if (!userString) {
            console.warn('⚠️ Data user tidak ditemukan');
            return null;
        }

        return JSON.parse(userString);
    } catch (error) {
        console.error('Error getting user data:', error);
        return null;
    }
};

/**
 * Get access token dari AsyncStorage
 */
export const getAccessToken = async () => {
    try {
        const token = await AsyncStorage.getItem('access_token');

        if (!token) {
            console.warn('⚠️ Access token tidak ditemukan');
            return null;
        }

        return token;
    } catch (error) {
        console.error('Error getting access token:', error);
        return null;
    }
};

/**
 * Check apakah user sudah login
 */
export const isUserLoggedIn = async () => {
    try {
        const token = await getAccessToken();
        const user = await getUserData();

        const loggedIn = !!(token && user);
        console.log(`User logged in: ${loggedIn ? '✅ YES' : '❌ NO'}`);

        return loggedIn;
    } catch (error) {
        console.error('Error checking login status:', error);
        return false;
    }
};

export default {
    logAllAsyncStorageData,
    verifyMahasiswaData,
    clearLoginData,
    getMahasiswaData,
    getUserData,
    getAccessToken,
    isUserLoggedIn,
};