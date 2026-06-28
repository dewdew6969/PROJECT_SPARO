import React, { useEffect } from 'react';
import { AppState, LogBox } from 'react-native';

// Sembunyikan semua pesan kuning (WARN) di layar HP agar presentasi mulus
LogBox.ignoreAllLogs();
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import OfflineIndicator from './src/components/OfflineIndicator';
import useAppStore from './src/store/useAppStore';

export default function App() {
  const profile = useAppStore(state => state.profile);

  useEffect(() => {
    const handleAppStateChange = async (nextAppState) => {
      if (!profile) return;
      
      const isOnline = nextAppState === 'active';
      
      // Logika untuk mengirim status online ke backend
      try {
        // Asumsi API terhubung, menggunakan endpoint PUT /users/{id}/status yang sudah dibuat
        // await fetch(`https://api.sparo.id/users/${profile.id}/status?is_online=${isOnline}`, { method: 'PUT' });
        console.log(`[Status] User ${profile.username} is now ${isOnline ? 'ONLINE' : 'OFFLINE'}`);
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
      <NavigationContainer>
        <AppNavigator />
        <OfflineIndicator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
