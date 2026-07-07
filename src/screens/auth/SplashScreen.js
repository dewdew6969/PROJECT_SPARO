import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Image, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ExpoSplashScreen from 'expo-splash-screen';
import useAppStore from '../../store/useAppStore';

export default function SplashScreen({ navigation }) {
  const { initializeAuth, isAuthLoaded, token, profile } = useAppStore();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Sembunyikan native splash screen secepatnya agar JS splash screen bisa berjalan
    ExpoSplashScreen.hideAsync().catch(() => {});
    // Jalankan animasi fade-in pada logo
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Mulai proses inisialisasi Auth
    initializeAuth();

    // Timer wajib selama 3 detik (3000ms)
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, [initializeAuth, fadeAnim]);

  useEffect(() => {
    // Navigasi HANYA JIKA auth sudah selesai dicek DAN timer 2.5 detik sudah lewat
    if (isAuthLoaded && minTimeElapsed) {
      if (token && profile) {
        navigation.replace('Main');
      } else {
        navigation.replace('Auth');
      }
    }
  }, [isAuthLoaded, token, profile, navigation, minTimeElapsed]);

  return (
    <View style={[styles.container, { backgroundColor: '#000000' }]}>
      <Animated.View style={[styles.centerContainer, { opacity: fadeAnim }]}>
        <Image 
          source={require('../../../assets/images/icon.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
      <ActivityIndicator size="small" color="#D4FF00" style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 350,
    height: 350,
  },
  loader: {
    position: 'absolute',
    bottom: 50,
  }
});
