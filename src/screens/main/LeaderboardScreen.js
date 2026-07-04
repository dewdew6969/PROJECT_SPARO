import React, { useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, ScrollView, Platform, StatusBar, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import useAppStore from '../../store/useAppStore';

export default function LeaderboardScreen() {
  const { t, language, profile } = useAppStore();
  const [activeTab, setActiveTab] = useState('national'); // 'city', 'province', 'national'
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const getAvatarUrl = (str) => {
    if (!str || str === "null") return 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';
    
    let finalUrl = str;
    if (str.includes('gravatar.com') || str.startsWith('file://') || str.startsWith('content://')) {
      finalUrl = str;
    } else if (str.startsWith('http://') || str.startsWith('https://')) {
      if (!str.includes('localhost') && !str.includes('127.0.0.1') && !str.includes('10.0.2.2')) {
        finalUrl = str;
      } else {
        const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';
        try {
          const urlObj = new URL(str);
          finalUrl = `${apiUrl}${urlObj.pathname}${urlObj.search}`;
        } catch (e) {
          finalUrl = str.startsWith('/') ? `${apiUrl}${str}` : `${apiUrl}/${str}`;
        }
      }
    } else {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';
      try {
        const urlObj = new URL(str);
        finalUrl = `${apiUrl}${urlObj.pathname}${urlObj.search}`;
      } catch (e) {
        finalUrl = str.startsWith('/') ? `${apiUrl}${str}` : `${apiUrl}/${str}`;
      }
    }
    return finalUrl;
  };

  const fetchLeaderboard = async () => {
    if (!profile) return;
    setIsLoading(true);
    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';
      const lat = profile.latitude || '';
      const lon = profile.longitude || '';
      const response = await fetch(`${API_URL}/leaderboard/?lat=${lat}&lon=${lon}&scope=${activeTab}`);
      if (response.ok) {
        const data = await response.json();
        setLeaderboardData(data);
      }
    } catch (e) {
      console.error('Failed to fetch leaderboard:', e);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchLeaderboard();
  }, [activeTab, profile]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchLeaderboard().then(() => setRefreshing(false));
  }, [activeTab, profile]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <LinearGradient colors={['#0F1522', '#0A0F18']} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('leaderboard')}</Text>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity onPress={() => setActiveTab('city')}>
            <Text style={activeTab === 'city' ? styles.tabActive : styles.tab}>City</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('province')}>
            <Text style={activeTab === 'province' ? styles.tabActive : styles.tab}>Province</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('national')}>
            <Text style={activeTab === 'national' ? styles.tabActive : styles.tab}>National</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tableHeader}>
          <Text style={[styles.th, { flex: 0.5 }]}>#</Text>
          <Text style={[styles.th, { flex: 2 }]}>Player</Text>
          <Text style={[styles.th, { flex: 1, textAlign: 'center' }]}>{t('elo_rating')}</Text>
          <Text style={[styles.th, { flex: 1, textAlign: 'center' }]}>{t('win_rate')}</Text>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#D4FF00"
              colors={['#D4FF00']}
              progressBackgroundColor="#161C26"
            />
          }
        >
          {isLoading && !refreshing ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#D4FF00" />
            </View>
          ) : leaderboardData.length === 0 ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Text style={{ color: '#8A95A5', fontSize: 16 }}>Belum ada data peringkat di wilayah ini</Text>
            </View>
          ) : (
            leaderboardData.map((item) => (
              <View key={item.id} style={styles.row}>
                <Text style={[styles.tdRank, { flex: 0.5 }]}>{item.rank}</Text>
                <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center' }}>
                  {item.avatar ? (
                    <Image source={{ uri: getAvatarUrl(item.avatar) }} style={styles.avatarMini} />
                  ) : (
                    <View style={styles.avatarMiniPlaceholder}>
                      <Feather name="user" size={14} color="#8A95A5" />
                    </View>
                  )}
                  <Text style={styles.tdName} numberOfLines={1}>{item.full_name || item.username}</Text>
                </View>
                <Text style={[styles.tdRating, { flex: 1 }]}>{item.elo}</Text>
                <Text style={[styles.td, { flex: 1, textAlign: 'center' }]}>{item.win_rate}</Text>
              </View>
            ))
          )}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0F1522' },
  container: { flex: 1 },
  header: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  tabs: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 10, marginHorizontal: 20, backgroundColor: '#1C2433', borderRadius: 12, marginBottom: 20 },
  tabActive: { color: '#D4FF00', fontWeight: 'bold', paddingVertical: 5, paddingHorizontal: 15, backgroundColor: '#2D3748', borderRadius: 8 },
  tab: { color: '#8A95A5', paddingVertical: 5, paddingHorizontal: 15 },
  tableHeader: { flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#2D3748', marginBottom: 10 },
  th: { fontWeight: 'bold', color: '#5C677D', fontSize: 12, textTransform: 'uppercase' },
  row: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 15, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#1C2433' },
  tdRank: { color: '#8A95A5', fontWeight: 'bold', fontSize: 16 },
  avatarMini: { width: 24, height: 24, borderRadius: 12, marginRight: 10 },
  avatarMiniPlaceholder: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#2D3748', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  tdName: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  tdRating: { color: '#D4FF00', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  td: { color: '#C2D0E8' }
});
