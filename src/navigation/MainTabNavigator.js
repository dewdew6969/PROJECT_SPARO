import React, { useEffect, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Text, AppState, View } from 'react-native';
import DashboardScreen from '../screens/main/DashboardScreen';
import FindOpponentScreen from '../screens/main/FindOpponentScreen';
import ChallengeScreen from '../screens/main/ChallengeScreen';
import LeaderboardScreen from '../screens/main/LeaderboardScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import useAppStore from '../store/useAppStore';

const TabBarLabel = ({ route, color }) => {
  const { t } = useAppStore();
  return (
    <Text style={{ color, fontSize: 11, fontWeight: '600' }}>
      {t(`nav_${route.name.toLowerCase()}`)}
    </Text>
  );
};

const Tab = createMaterialTopTabNavigator();

export default function MainTabNavigator() {
  const { t, language, profile, hasNewMatches, setHasNewMatches } = useAppStore();
  const insets = useSafeAreaInsets();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    let intervalId;
    
    const updateOnlineStatus = async (isOnline) => {
      if (!profile?.id) return;
      try {
        const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';
        await fetch(`${apiUrl}/users/${profile?.id}/status?is_online=${isOnline}`, { method: 'PUT' });
      } catch (e) {
        // ignore network error
      }
    };

    const markDelivered = async () => {
      if (!profile?.id) return;
      try {
        const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';
        await fetch(`${apiUrl}/messages/${profile?.id}/delivered`, { method: 'PUT' });
      } catch (e) {
        // ignore network error
      }
    };

    const checkPendingMatches = async () => {
      if (!profile?.id) return;
      try {
        const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';
        const response = await fetch(`${apiUrl}/challenges/${profile?.id}?t=${new Date().getTime()}`);
        if (response.ok) {
          const data = await response.json();
          const hasPending = data.some(m => m.status && m.status.toLowerCase() === 'pending');
          setHasNewMatches(hasPending);
        }
      } catch (e) {}
    };

    if (profile?.id) {
      // Saat aplikasi baru dibuka (mounting), set online
      updateOnlineStatus(true);
      markDelivered();
      checkPendingMatches();
      
      // Heartbeat setiap 5 detik saat aktif (membantu mendeteksi jika crash/hilang koneksi)
      intervalId = setInterval(() => {
        if (appState.current === 'active') {
          updateOnlineStatus(true);
          markDelivered();
          checkPendingMatches();
        }
      }, 5000);
    }

    // Pantau aplikasi jika pindah ke background / diminimize
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        updateOnlineStatus(true);
        markDelivered();
      } else if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
        updateOnlineStatus(false);
      }
      appState.current = nextAppState;
    });

    return () => {
      if (intervalId) clearInterval(intervalId);
      subscription.remove();
      // Saat komponen hancur (logout), set offline
      updateOnlineStatus(false);
    };
  }, [profile?.id]);

  return (
    <Tab.Navigator
      key={language}
      tabBarPosition="bottom"
      screenOptions={({ route }) => ({
        headerShown: false,
        swipeEnabled: false,
        animationEnabled: false,
        tabBarIcon: ({ color }) => {
          let iconName;
          if (route.name === 'Home') iconName = 'home';
          else if (route.name === 'Opponent') iconName = 'users';
          else if (route.name === 'Matches') iconName = 'activity';
          else if (route.name === 'Leaderboard') iconName = 'bar-chart-2';
          else if (route.name === 'Profile') iconName = 'user';
          
          return (
            <View>
              <Feather name={iconName} size={24} color={color} />
              {route.name === 'Matches' && hasNewMatches && (
                <View style={{
                  position: 'absolute',
                  top: -2,
                  right: -4,
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: '#D4FF00', // warna hijau terang Sparo
                  borderWidth: 2,
                  borderColor: '#0F1522' // warna border senada dengan background tab bar
                }} />
              )}
            </View>
          );
        },
        tabBarActiveTintColor: '#D4FF00',
        tabBarInactiveTintColor: '#8A95A5',
        tabBarShowIcon: true,
        tabBarIndicatorStyle: { height: 2, backgroundColor: '#D4FF00', top: 0 },
        tabBarItemStyle: {
          padding: 0,
          margin: 0,
          justifyContent: 'center',
          alignItems: 'center'
        },
        tabBarStyle: {
          backgroundColor: '#0F1522',
          borderTopWidth: 1,
          borderTopColor: '#1C2433',
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 8,
          height: 60 + Math.max(insets.bottom, 10),
          elevation: 0,
        },
        tabBarLabel: (props) => <TabBarLabel route={route} color={props.color} />
      })}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Opponent" component={FindOpponentScreen} />
      <Tab.Screen name="Matches" component={ChallengeScreen} />
      <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
