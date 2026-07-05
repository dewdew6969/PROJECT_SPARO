import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { AppState, LogBox, Platform } from 'react-native';
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import OfflineIndicator from './src/components/OfflineIndicator';
import AppNavigator from './src/navigation/AppNavigator';
import useAppStore from './src/store/useAppStore';

// Sembunyikan semua pesan kuning (WARN) di layar HP agar presentasi mulus
LogBox.ignoreAllLogs();

// Configure notification handler for foreground notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function registerForPushNotificationsAsync() {
  let token;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#D4FF00',
    });
  }

  if (Constants.isDevice || Platform.OS === 'android') { // Allow on android emulators for testing if needed
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    try {
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      console.log('Expo Push Token:', token);
    } catch (e) {
      console.log('Error getting push token', e);
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

const SparoTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#0F1522',
  },
};

export default function App() {
  const profile = useAppStore(state => state.profile);
  const responseListener = useRef();

  useEffect(() => {
    if (profile?.id) {
      registerForPushNotificationsAsync().then(token => {
        if (token) {
          // Kirim token ke backend Sparo
          fetch('https://sparo.my.id/update_token.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: profile.id,
              push_token: token
            })
          })
            .then(res => res.text())
            .then(data => console.log('Backend response:', data))
            .catch(console.error);
        }
      });
    }

    // Listener saat notifikasi ditekan
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('User tapped notification', response);
      // Anda bisa menambahkan logika navigasi di sini (misal: diarahkan ke tab Matches)
    });

    return () => {
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [profile?.id]);

  useEffect(() => {
    const handleAppStateChange = async (nextAppState) => {
      if (!profile) return;

      const isOnline = nextAppState === 'active';

      // Logika untuk mengirim status online ke backend
      try {
        // Asumsi API terhubung, menggunakan endpoint PUT /users/{id}/status yang sudah dibuat
        // await fetch(`https://api.sparo.id/users/${profile.id}/status?is_online=${isOnline}`, { method: 'PUT' });
        console.log(`[Status] User ${profile.id} is now ${isOnline}`);
      } catch (error) {
        console.error("Failed to update status", error);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Set status online saat pertama kali aplikasi dibuka
    handleAppStateChange('active');

    return () => {
      // Pastikan status offline saat aplikasi sepenuhnya ditutup/unmount
      handleAppStateChange('background');
      subscription.remove();
    };
  }, [profile]);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor="#0F1522" />
      <NavigationContainer theme={SparoTheme}>
        <AppNavigator />
        <OfflineIndicator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
