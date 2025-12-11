import messaging from '@react-native-firebase/messaging';
import {
  PermissionsAndroid,
  Platform,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {
  API_URL
} from '../config/api';

class NotificationService {

  constructor() {
    this.createNotificationChannel();
    this.setupTokenRefreshListener();
  }

  async createNotificationChannel() {
    if (Platform.OS === 'android') {
      try {
        // Check if messaging and android are available
        const messagingInstance = messaging();
        if (!messagingInstance || !messagingInstance.android) {
          console.warn('⚠️ Firebase messaging android module not available');
          return;
        }

        // Create high priority channel for important notifications
        const highPriorityChannel = {
          id: 'default_channel',
          name: 'E-Learn Notifications',
          description: 'Notifications for informasi, presensi, and materi updates',
          importance: 4, // HIGH - will make sound and appear as heads-up notification
          vibration: true,
          vibrationPattern: [200, 500, 200, 500],
          sound: 'default',
          showBadge: true,
          lights: true,
          lightColor: '#0066FF',
        };

        await messagingInstance.android.createChannel(highPriorityChannel);
        console.log('✅ High priority notification channel created');

        // Create normal priority channel for less urgent notifications
        const normalPriorityChannel = {
          id: 'normal_channel',
          name: 'E-Learn Updates',
          description: 'General updates and reminders',
          importance: 3, // DEFAULT
          vibration: true,
          sound: 'default',
          showBadge: true,
        };

        await messagingInstance.android.createChannel(normalPriorityChannel);
        console.log('✅ Normal priority notification channel created');
      } catch (error) {
        console.error('❌ Error creating notification channel:', error);
        console.error('Stack:', error.stack);
      }
    }
  }

  async requestUserPermission() {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Notification permission granted');
          return true;
        } else {
          console.log('Notification permission denied');
          return false;
        }
      } catch (err) {
        console.warn(err);
        return false;
      }
    }

    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('Authorization status:', authStatus);
    }
    return enabled;
  }

  async getFCMToken() {
    try {
      const fcmToken = await messaging().getToken();
      if (fcmToken) {
        console.log('Your Firebase Token is:', fcmToken);
        // Store locally could be useful
        await AsyncStorage.setItem('fcm_token', fcmToken);
        return fcmToken;
      } else {
        console.log('Failed', 'No token received');
        return null;
      }
    } catch (error) {
      console.log('Error fetching token:', error);
      return null;
    }
  }

  setupTokenRefreshListener() {
    if (this.onTokenRefreshUnsubscribe) {
      this.onTokenRefreshUnsubscribe();
    }

    this.onTokenRefreshUnsubscribe = messaging().onTokenRefresh(async token => {
      try {
        console.log('FCM token refreshed:', token);
        await AsyncStorage.setItem('fcm_token', token);
        await this.registerTokenWithBackend(token);
      } catch (error) {
        console.error('Failed to sync refreshed token:', error);
      }
    });
  }

  async syncTokenWithBackend() {
    const cachedToken = await AsyncStorage.getItem('fcm_token');

    if (cachedToken) {
      await this.registerTokenWithBackend(cachedToken);
      return;
    }

    const freshToken = await this.getFCMToken();
    if (freshToken) {
      await this.registerTokenWithBackend(freshToken);
    }
  }

  async registerTokenWithBackend(token) {
    try {
      // SessionManager menyimpan token di 'access_token', bukan 'userToken'
      const accessToken = await AsyncStorage.getItem('access_token');
      if (!accessToken) {
        console.log('⚠️ No access token available, skip FCM registration');
        return;
      }

      console.log('📤 Registering FCM token with backend...');
      console.log('🔑 Token preview:', token.substring(0, 20) + '...');
      
      const response = await axios.post(
        `${API_URL}/notifications/token`, {
          fcm_token: token
        }, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          timeout: 10000, // 10 second timeout
        }
      );
      
      console.log('✅ Token registered successfully:', response.data);
      
      // Store registration timestamp
      await AsyncStorage.setItem('fcm_token_registered_at', new Date().toISOString());
      
    } catch (error) {
      // Log detail supaya mudah diagnosa (status, data, message)
      if (error.response) {
        const details = {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          url: error.response.config?.url,
        };
        console.error('❌ Failed to register token with backend:', JSON.stringify(details, null, 2));
        
        // If unauthorized, clear token and retry later
        if (error.response.status === 401) {
          console.log('🔄 Token expired, will retry after re-login');
        }
      } else if (error.request) {
        console.error('❌ No response from server:', error.message);
      } else {
        console.error('❌ Error setting up request:', error.message);
      }
    }
  }

  listen(navigation) {
    // Foreground State - Show alert when app is open
    this.messageListener = messaging().onMessage(async remoteMessage => {
      console.log('📱 FCM message received (foreground):', JSON.stringify(remoteMessage));

      const {
        title,
        body
      } = remoteMessage.notification || {};
      const data = remoteMessage.data || {};

      Alert.alert(
        title || 'Notifikasi Baru',
        body || 'Anda memiliki notifikasi baru',
        [{
            text: 'Tutup',
            style: 'cancel'
          },
          {
            text: 'Lihat',
            onPress: () => {
              // Handle navigation based on notification type
              if (data.type && navigation) {
                this.handleNotificationNavigation(data, navigation);
              }
            }
          }
        ]
      );
    });

    // Background & Quit State (Notification Opened)
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log(
        '📱 Notification opened from background:',
        remoteMessage.notification,
      );
      const data = remoteMessage.data || {};
      if (data.type) {
        // Navigation will be handled when app is ready
        this.pendingNavigation = data;
      }
    });

    // Check whether an initial notification is available (app opened from quit state)
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log(
            '📱 Notification opened from quit state:',
            remoteMessage.notification,
          );
          const data = remoteMessage.data || {};
          if (data.type) {
            this.pendingNavigation = data;
          }
        }
      });
  }

  handleNotificationNavigation(data, navigation) {
    try {
      console.log('🧭 Handling notification navigation:', data);

      switch (data.type) {
        case 'informasi':
          if (data.id_informasi) {
            navigation.navigate('InformasiDetail', {
              id: parseInt(data.id_informasi)
            });
          } else {
            navigation.navigate('InformasiList');
          }
          break;

        case 'presensi':
          navigation.navigate('RiwayatPresensi');
          break;

        case 'materi':
          if (data.kode_mk) {
            navigation.navigate('DaftarMateri', {
              kode_mk: data.kode_mk
            });
          }
          break;

        default:
          navigation.navigate('Home');
      }
    } catch (error) {
      console.error('Error navigating from notification:', error);
    }
  }

  getPendingNavigation() {
    const pending = this.pendingNavigation;
    this.pendingNavigation = null;
    return pending;
  }

  unListen() {
    if (this.messageListener) {
      this.messageListener();
    }

    if (this.onTokenRefreshUnsubscribe) {
      this.onTokenRefreshUnsubscribe();
      this.onTokenRefreshUnsubscribe = null;
    }
  }
}

export const notificationService = new NotificationService();